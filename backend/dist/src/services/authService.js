"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requirePermission = exports.requireRole = exports.authenticateToken = exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserEnhanced_1 = require("../models/UserEnhanced");
const logger_1 = require("../utils/logger");
const securityAudit_1 = require("../utils/securityAudit");
const crypto_1 = __importDefault(require("crypto"));
const RefreshToken_1 = require("../models/RefreshToken");
// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'balcon-builders-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
// Note: do NOT cache refresh token lifetime; tests may override env var at runtime
function getRefreshTokenTtl() {
    return process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
}
// Authentication service class
class AuthService {
    // Generate access token
    static generateAccessToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            permissions: {
                canAccessFinancials: user.canAccessFinancials,
                canManageProjects: user.canManageProjects,
                canManageUsers: user.canManageUsers,
            },
            type: 'access'
        };
        const options = {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'balcon-builders',
            audience: 'balcon-builders-app'
        };
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
    }
    // Generate refresh token
    static generateRefreshToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            permissions: {
                canAccessFinancials: user.canAccessFinancials,
                canManageProjects: user.canManageProjects,
                canManageUsers: user.canManageUsers,
            },
            type: 'refresh'
        };
        const options = {
            expiresIn: getRefreshTokenTtl(),
            issuer: 'balcon-builders',
            audience: 'balcon-builders-app'
        };
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
    }
    // Verify token
    static verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
                issuer: 'balcon-builders',
                audience: 'balcon-builders-app'
            }); // jwt.verify respects exp
            return decoded;
        }
        catch (error) {
            logger_1.logger.warn('Token verification failed:', error instanceof Error ? error.message : error);
            return null;
        }
    }
    // Authenticate user with email and password
    static async authenticateUser(email, password, meta) {
        try {
            // Find user by email
            const user = await UserEnhanced_1.User.findByEmail(email);
            if (!user) {
                logger_1.logger.warn(`Authentication failed: User not found for email ${email}`);
                (0, securityAudit_1.logSecurityEvent)(undefined, { action: 'auth.login', outcome: 'failure', meta: { reason: 'user_not_found', email: email.toLowerCase() } });
                return null;
            }
            // Check if user is active
            if (!user.isActive) {
                logger_1.logger.warn(`Authentication failed: User ${email} is inactive`);
                (0, securityAudit_1.logSecurityEvent)(undefined, { action: 'auth.login', outcome: 'failure', meta: { reason: 'inactive', userId: user.id } });
                return null;
            }
            // Verify password
            const isPasswordValid = await user.validatePassword(password);
            if (!isPasswordValid) {
                logger_1.logger.warn(`Authentication failed: Invalid password for user ${email}`);
                (0, securityAudit_1.logSecurityEvent)(undefined, { action: 'auth.login', outcome: 'failure', meta: { reason: 'bad_password', userId: user.id } });
                return null;
            }
            // Update last login
            await user.updateLastLogin();
            // Generate tokens
            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);
            await this.persistRefreshToken(user.id, refreshToken, meta);
            logger_1.logger.info(`User authenticated successfully: ${email} (${user.role})`);
            (0, securityAudit_1.logSecurityEvent)(undefined, { action: 'auth.login', outcome: 'success', meta: { userId: user.id, email: user.email, role: user.role } });
            return {
                user,
                accessToken,
                refreshToken
            };
        }
        catch (error) {
            logger_1.logger.error('Authentication error:', error);
            return null;
        }
    }
    // Refresh access token
    static async refreshToken(refreshToken, meta) {
        try {
            // Verify refresh token
            const payload = this.verifyToken(refreshToken);
            if (!payload || payload.type !== 'refresh') {
                return null;
            }
            // Find user
            const user = await UserEnhanced_1.User.findByPk(payload.userId);
            if (!user || !user.isActive) {
                return null;
            }
            // Look up existing stored token hash
            const incomingHash = this.hashToken(refreshToken);
            const stored = await RefreshToken_1.RefreshToken.findOne({ where: { userId: user.id, tokenHash: incomingHash, revokedAt: null } });
            if (!stored) {
                // Reuse or unknown token -> log and deny
                (0, securityAudit_1.logSecurityEvent)(undefined, { action: 'auth.refresh.reuse_detected', outcome: 'failure', actorUserId: user.id, meta: { reason: 'unknown_token' } });
                return null;
            }
            if (new Date(stored.expiresAt).getTime() < Date.now()) {
                await stored.update({ revokedAt: new Date() });
                return null;
            }
            // Rotate: revoke old token and issue a new one
            const newAccessToken = this.generateAccessToken(user);
            const newRefreshToken = this.generateRefreshToken(user);
            await stored.update({ revokedAt: new Date(), replacedByToken: this.hashToken(newRefreshToken) });
            await this.persistRefreshToken(user.id, newRefreshToken, meta);
            (0, securityAudit_1.logSecurityEvent)(undefined, { action: 'auth.refresh.rotate', outcome: 'success', actorUserId: user.id, meta: { replaced: stored.id } });
            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        }
        catch (error) {
            logger_1.logger.error('Token refresh error:', error);
            return null;
        }
    }
    // --- Refresh Token Persistence & Helpers ---
    static hashToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    static decodeExpiry(refreshJwt) {
        // Use decode (non-verified) only for storage convenience; if missing exp, fall back to 7d
        try {
            const decoded = jsonwebtoken_1.default.decode(refreshJwt);
            if (decoded?.exp)
                return new Date(decoded.exp * 1000);
            return null;
        }
        catch {
            return null;
        }
    }
    static async persistRefreshToken(userId, rawToken, meta) {
        const tokenHash = this.hashToken(rawToken);
        const expiresAt = this.decodeExpiry(rawToken) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await RefreshToken_1.RefreshToken.create({ userId, tokenHash, expiresAt, ipAddress: meta?.ip, userAgent: meta?.ua });
    }
    static async revokeAllUserTokens(userId) {
        await RefreshToken_1.RefreshToken.update({ revokedAt: new Date() }, { where: { userId, revokedAt: null } });
    }
    static async detectAndFlagReuse(userId, tokenHash) {
        const existing = await RefreshToken_1.RefreshToken.findOne({ where: { userId, tokenHash } });
        if (!existing)
            return false;
        if (existing.revokedAt) {
            await existing.update({ reuseDetected: true });
            (0, securityAudit_1.logSecurityEvent)(undefined, { action: 'auth.refresh.reuse_detected', outcome: 'failure', actorUserId: userId, meta: { tokenId: existing.id } });
            return true;
        }
        return false;
    }
    // Create user with password
    static async createUser(userData, password) {
        try {
            const user = await UserEnhanced_1.User.createWithPassword(userData, password);
            logger_1.logger.info(`User created successfully: ${user.email} (${user.role})`);
            return user;
        }
        catch (error) {
            logger_1.logger.error('User creation error:', error);
            return null;
        }
    }
    // Change user password
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await UserEnhanced_1.User.findByPk(userId);
            if (!user) {
                return false;
            }
            // Verify current password
            const isCurrentPasswordValid = await user.validatePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                return false;
            }
            // Update password
            await user.updatePassword(newPassword);
            logger_1.logger.info(`Password changed successfully for user: ${user.email}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Password change error:', error);
            return false;
        }
    }
    // Reset user password (admin function)
    static async resetPassword(userId, newPassword) {
        try {
            const user = await UserEnhanced_1.User.findByPk(userId);
            if (!user) {
                return false;
            }
            await user.updatePassword(newPassword);
            logger_1.logger.info(`Password reset successfully for user: ${user.email}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Password reset error:', error);
            return false;
        }
    }
}
exports.AuthService = AuthService;
// Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required'
            });
            return;
        }
        // Verify token
        const payload = AuthService.verifyToken(token);
        if (!payload || payload.type !== 'access') {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
            return;
        }
        // Find user
        const user = await UserEnhanced_1.User.findByPk(payload.userId);
        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
            return;
        }
        // Attach user to request
        req.user = user;
        req.userId = user.id;
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};
exports.authenticateToken = authenticateToken;
// Role-based authorization middleware
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
// Permission-based authorization middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (!req.user[permission]) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const payload = AuthService.verifyToken(token);
            if (payload && payload.type === 'access') {
                const user = await UserEnhanced_1.User.findByPk(payload.userId);
                if (user && user.isActive) {
                    req.user = user;
                    req.userId = user.id;
                }
            }
        }
        next();
    }
    catch (error) {
        // Continue without authentication
        next();
    }
};
exports.optionalAuth = optionalAuth;
exports.default = AuthService;
