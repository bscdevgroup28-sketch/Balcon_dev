"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authService_1 = require("../services/authService");
const authEnhanced_1 = require("../middleware/authEnhanced");
const UserEnhanced_1 = require("../models/UserEnhanced");
const logger_1 = require("../utils/logger");
const express_validator_1 = require("express-validator");
const bruteForceProtector_1 = require("../middleware/bruteForceProtector");
const securityAudit_1 = require("../utils/securityAudit");
const router = express_1.default.Router();
// Validation middlewares
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    (0, express_validator_1.body)('firstName').notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('role').isIn(['customer', 'technician', 'team_leader', 'project_manager', 'office_manager', 'shop_manager', 'owner'])
        .withMessage('Valid role is required')
];
// Change password validation: currentPassword optional to support first-login forced change
const changePasswordValidation = [
    (0, express_validator_1.body)('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    (0, express_validator_1.body)('currentPassword').optional()
];
// Helper function to handle validation errors
const handleValidationErrors = (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
        return false;
    }
    return true;
};
// POST /api/auth/login
router.post('/login', bruteForceProtector_1.bruteForceProtector, loginValidation, async (req, res) => {
    try {
        if (!handleValidationErrors(req, res))
            return;
        const { email, password } = req.body;
        const result = await authService_1.AuthService.authenticateUser(email, password);
        if (!result) {
            if (req.recordAuthFailure)
                req.recordAuthFailure();
            (0, securityAudit_1.logSecurityEvent)(req, {
                action: 'auth.login',
                outcome: 'failure',
                meta: { email: email.toLowerCase() }
            });
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        const { user, accessToken, refreshToken } = result;
        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        if (req.clearAuthFailures)
            req.clearAuthFailures();
        (0, securityAudit_1.logSecurityEvent)(req, {
            action: 'auth.login',
            outcome: 'success',
            meta: { userId: user.id, email: user.email, role: user.role }
        });
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    displayRole: user.getDisplayRole(),
                    permissions: {
                        canAccessFinancials: user.canAccessFinancials,
                        canManageProjects: user.canManageProjects,
                        canManageUsers: user.canManageUsers
                    },
                    isVerified: user.isVerified,
                    lastLoginAt: user.lastLoginAt,
                    mustChangePassword: user.mustChangePassword === true
                },
                accessToken
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// POST /api/auth/register (requires admin privileges)
router.post('/register', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePermission)('canManageUsers'), registerValidation, async (req, res) => {
    try {
        if (!handleValidationErrors(req, res))
            return;
        const { email, password, firstName, lastName, role, ...userData } = req.body;
        // Check if user already exists
        const existingUser = await UserEnhanced_1.User.findByEmail(email);
        if (existingUser) {
            (0, securityAudit_1.logSecurityEvent)(req, {
                action: 'user.register',
                outcome: 'failure',
                meta: { reason: 'email_exists', email: email.toLowerCase() }
            });
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        // Create user
        const user = await authService_1.AuthService.createUser({
            email,
            firstName,
            lastName,
            role,
            ...userData
        }, password);
        if (!user) {
            (0, securityAudit_1.logSecurityEvent)(req, {
                action: 'user.register',
                outcome: 'failure',
                meta: { reason: 'creation_failed', email: email.toLowerCase() }
            });
            return res.status(500).json({
                success: false,
                message: 'Failed to create user'
            });
        }
        (0, securityAudit_1.logSecurityEvent)(req, {
            action: 'user.register',
            outcome: 'success',
            meta: { newUserId: user.id, email: user.email, role: user.role }
        });
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    displayRole: user.getDisplayRole(),
                    isActive: user.isActive,
                    isVerified: user.isVerified
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required'
            });
        }
        const result = await authService_1.AuthService.refreshToken(refreshToken);
        if (!result) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        // Set new refresh token as cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: result.accessToken
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    try {
        // Clear refresh token cookie
        res.clearCookie('refreshToken');
        (0, securityAudit_1.logSecurityEvent)(req, {
            action: 'auth.logout',
            outcome: 'success'
        });
        res.json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        logger_1.logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// GET /api/auth/me
router.get('/me', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.getFullName(),
                    role: user.role,
                    displayRole: user.getDisplayRole(),
                    permissions: {
                        canAccessFinancials: user.canAccessFinancials,
                        canManageProjects: user.canManageProjects,
                        canManageUsers: user.canManageUsers
                    },
                    isActive: user.isActive,
                    isVerified: user.isVerified,
                    lastLoginAt: user.lastLoginAt,
                    createdAt: user.createdAt,
                    mustChangePassword: user.mustChangePassword === true
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// PUT /api/auth/change-password
router.put('/change-password', authEnhanced_1.authenticateToken, changePasswordValidation, async (req, res) => {
    try {
        if (!handleValidationErrors(req, res))
            return;
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;
        const user = await UserEnhanced_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // If user is flagged to change password and currentPassword not provided, allow direct change
        if (user.mustChangePassword === true && !currentPassword) {
            await user.updatePassword(newPassword);
            user.mustChangePassword = false;
            await user.save();
            (0, securityAudit_1.logSecurityEvent)(req, {
                action: 'user.password.first_set',
                outcome: 'success',
                meta: { userId }
            });
            return res.json({
                success: true,
                message: 'Password set successfully',
                data: { mustChangePassword: false }
            });
        }
        if (!currentPassword) {
            (0, securityAudit_1.logSecurityEvent)(req, {
                action: 'user.password.change',
                outcome: 'failure',
                meta: { reason: 'missing_current_password', userId }
            });
            return res.status(400).json({ success: false, message: 'Current password is required' });
        }
        const success = await authService_1.AuthService.changePassword(userId, currentPassword, newPassword);
        if (!success) {
            (0, securityAudit_1.logSecurityEvent)(req, {
                action: 'user.password.change',
                outcome: 'failure',
                meta: { reason: 'incorrect_current_password', userId }
            });
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
        // Ensure flag cleared if it was still set
        if (user.mustChangePassword === true) {
            user.mustChangePassword = false;
            await user.save();
        }
        (0, securityAudit_1.logSecurityEvent)(req, {
            action: 'user.password.change',
            outcome: 'success',
            meta: { userId }
        });
        res.json({ success: true, message: 'Password changed successfully', data: { mustChangePassword: false } });
    }
    catch (error) {
        logger_1.logger.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// PUT /api/auth/reset-password/:userId (admin only)
router.put('/reset-password/:userId', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePermission)('canManageUsers'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters'
            });
        }
        const targetId = parseInt(userId);
        const user = await UserEnhanced_1.User.findByPk(targetId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        await user.updatePassword(newPassword);
        // Force password rotation after admin reset
        user.mustChangePassword = true;
        await user.save();
        (0, securityAudit_1.logSecurityEvent)(req, {
            action: 'user.password.reset',
            outcome: 'success',
            targetUserId: user.id,
            meta: { adminUserId: req.userId }
        });
        res.json({ success: true, message: 'Password reset successfully (rotation required)', data: { mustChangePassword: true } });
    }
    catch (error) {
        logger_1.logger.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// GET /api/auth/users (admin only)
router.get('/users', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePermission)('canManageUsers'), async (req, res) => {
    try {
        const users = await UserEnhanced_1.User.findAll({
            attributes: { exclude: ['passwordHash', 'passwordResetToken', 'emailVerificationToken'] },
            order: [['createdAt', 'DESC']]
        });
        res.json({
            success: true,
            data: {
                users: users.map(user => ({
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.getFullName(),
                    role: user.role,
                    displayRole: user.getDisplayRole(),
                    isActive: user.isActive,
                    isVerified: user.isVerified,
                    lastLoginAt: user.lastLoginAt,
                    createdAt: user.createdAt,
                    mustChangePassword: user.mustChangePassword === true
                }))
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// PUT /api/auth/users/:userId/status (admin only)
router.put('/users/:userId/status', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePermission)('canManageUsers'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;
        const user = await UserEnhanced_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        user.isActive = isActive;
        await user.save();
        (0, securityAudit_1.logSecurityEvent)(req, {
            action: 'user.status.change',
            outcome: 'success',
            targetUserId: user.id,
            meta: { isActive }
        });
        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    isActive: user.isActive
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
