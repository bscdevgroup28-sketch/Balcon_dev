"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserEnhanced_1 = require("../models/UserEnhanced");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const authEnhanced_1 = require("../middleware/authEnhanced");
const router = (0, express_1.Router)();
// GET /api/users - Get all users (admin only)
router.get('/', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)(['owner']), async (req, res) => {
    try {
        const users = await UserEnhanced_1.User.findAll({
            attributes: { exclude: ['passwordHash'] }, // Exclude password from response
            order: [['createdAt', 'DESC']],
        });
        res.json({
            success: true,
            data: users,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});
// GET /api/users/:id - Get user by ID
router.get('/:id', authEnhanced_1.authenticateToken, (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const user = await UserEnhanced_1.User.findByPk(id, {
            attributes: { exclude: ['passwordHash'] }, // Exclude password from response
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});
// POST /api/users - Create new user (admin only)
router.post('/', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)(['owner']), (0, validation_1.validate)({ body: validation_2.createUserSchema }), async (req, res) => {
    try {
        const userData = req.validatedBody;
        // Check if user already exists
        const existingUser = await UserEnhanced_1.User.findByEmail(userData.email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists',
            });
        }
        // Create user with default password
        const user = await UserEnhanced_1.User.createWithPassword(userData, 'defaultPassword123');
        // Remove password from response
        const userResponse = { ...user.toJSON() };
        delete userResponse.passwordHash;
        logger_1.logger.info(`User created: ${user.email} by user ${req.user.id}`);
        res.status(201).json({
            success: true,
            data: userResponse,
            message: 'User created successfully. Default password: defaultPassword123',
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});
// PUT /api/users/:id - Update user
router.put('/:id', authEnhanced_1.authenticateToken, (0, validation_1.validate)({
    params: validation_2.idParamSchema,
    body: validation_2.updateUserSchema,
}), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const updateData = req.validatedBody;
        const userRole = req.user.role;
        const user = await UserEnhanced_1.User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        // Check permissions - users can update themselves, admins can update anyone
        if (user.id !== req.user.id && userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions to update this user',
            });
        }
        // Only admins can change roles
        if (updateData.role && userRole !== 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions to change user role',
            });
        }
        await user.update(updateData);
        // Remove password from response
        const userResponse = { ...user.toJSON() };
        delete userResponse.passwordHash;
        logger_1.logger.info(`User updated: ${user.email} by user ${req.user.id}`);
        res.json({
            success: true,
            data: userResponse,
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});
// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)(['owner']), (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const user = await UserEnhanced_1.User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        // Prevent deleting self
        if (user.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account',
            });
        }
        await user.destroy();
        logger_1.logger.info(`User deleted: ${user.email} by user ${req.user.id}`);
        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});
// GET /api/users/profile/me - Get current user profile
router.get('/profile/me', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await UserEnhanced_1.User.findByPk(userId, {
            attributes: { exclude: ['passwordHash'] }, // Exclude password from response
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});
exports.default = router;
