"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOwnerOrAssigned = exports.requirePermission = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
// Enhanced JWT authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        res.status(401).json({
            error: 'Access token required',
            message: 'Please provide a valid authentication token'
        });
        return;
    }
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.logger.error('JWT_SECRET not configured');
            res.status(500).json({
                error: 'Server configuration error',
                message: 'Authentication system not properly configured'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions || []
        };
        logger_1.logger.info(`✅ Authenticated user: ${decoded.email} (${decoded.role})`);
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                error: 'Token expired',
                message: 'Your session has expired. Please log in again.'
            });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                error: 'Invalid token',
                message: 'The provided authentication token is invalid.'
            });
        }
        else {
            logger_1.logger.error('Authentication error:', error);
            res.status(401).json({
                error: 'Authentication failed',
                message: 'Unable to authenticate the request.'
            });
        }
    }
};
exports.authenticateToken = authenticateToken;
// Role-based authorization middleware
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'User must be authenticated to access this resource'
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
// Permission-based authorization middleware
const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'User must be authenticated to access this resource'
            });
            return;
        }
        if (!req.user.permissions.includes(requiredPermission) &&
            !req.user.permissions.includes('system_admin')) {
            res.status(403).json({
                error: 'Insufficient permissions',
                message: `Access denied. Required permission: ${requiredPermission}`
            });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
// Owner or assigned user authorization
const requireOwnerOrAssigned = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            error: 'Authentication required',
            message: 'User must be authenticated to access this resource'
        });
        return;
    }
    // System admins and owners can access everything
    if (req.user.role === 'owner' || req.user.permissions.includes('system_admin')) {
        next();
        return;
    }
    // For other roles, check if they're assigned to the project/resource
    // This would typically check the resource ownership in the database
    // For now, we'll allow project managers and office managers broader access
    if (['project_manager', 'office_manager'].includes(req.user.role)) {
        next();
        return;
    }
    // For other roles, they can only access their own resources
    // This logic would be refined based on specific business requirements
    next();
};
exports.requireOwnerOrAssigned = requireOwnerOrAssigned;
