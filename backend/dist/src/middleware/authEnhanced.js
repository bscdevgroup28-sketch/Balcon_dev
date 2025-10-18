"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOwnerOrAssigned = exports.requirePolicy = exports.requirePermission = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const securityAudit_1 = require("../utils/securityAudit");
const policyEngine_1 = require("../security/policyEngine");
const metrics_1 = require("../monitoring/metrics");
// Enhanced JWT authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    // Fallback: support httpOnly cookie 'accessToken'
    if (!token && req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    if (!token) {
        (0, securityAudit_1.logSecurityEvent)(req, { action: 'auth.token.validate', outcome: 'failure', meta: { reason: 'missing' } });
        metrics_1.metrics.increment('auth.failures');
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
            (0, securityAudit_1.logSecurityEvent)(req, { action: 'auth.token.validate', outcome: 'failure', meta: { reason: 'misconfiguration' } });
            metrics_1.metrics.increment('auth.failures');
            res.status(500).json({
                error: 'Server configuration error',
                message: 'Authentication system not properly configured'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const userId = decoded.id ?? decoded.userId; // support both payload shapes
        // Normalize permissions: may be array OR object of booleans
        let perms = [];
        if (Array.isArray(decoded.permissions)) {
            perms = decoded.permissions;
        }
        else if (decoded.permissions && typeof decoded.permissions === 'object') {
            perms = Object.entries(decoded.permissions)
                .filter(([, v]) => !!v)
                .map(([k]) => k);
        }
        req.user = {
            id: userId,
            email: decoded.email,
            role: decoded.role,
            permissions: perms
        };
        req.userId = userId;
        logger_1.logger.info(`✅ Authenticated user: ${decoded.email} (${decoded.role})`);
        (0, securityAudit_1.logSecurityEvent)(req, { action: 'auth.token.validate', outcome: 'success', meta: { userId, role: decoded.role } });
        metrics_1.metrics.increment('auth.success');
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            (0, securityAudit_1.logSecurityEvent)(req, { action: 'auth.token.validate', outcome: 'failure', meta: { reason: 'expired' } });
            metrics_1.metrics.increment('auth.failures');
            res.status(401).json({
                error: 'Token expired',
                message: 'Your session has expired. Please log in again.'
            });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            (0, securityAudit_1.logSecurityEvent)(req, { action: 'auth.token.validate', outcome: 'failure', meta: { reason: 'invalid' } });
            metrics_1.metrics.increment('auth.failures');
            res.status(401).json({
                error: 'Invalid token',
                message: 'The provided authentication token is invalid.'
            });
        }
        else {
            logger_1.logger.error('Authentication error:', error);
            (0, securityAudit_1.logSecurityEvent)(req, { action: 'auth.token.validate', outcome: 'failure', meta: { reason: 'error' } });
            metrics_1.metrics.increment('auth.failures');
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
// Generic policy middleware: pass canonical action id and optional resource resolver
const requirePolicy = (action, resolveResource) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required', message: 'User must be authenticated' });
        }
        let resource = null;
        if (resolveResource) {
            try {
                resource = await resolveResource(req);
            }
            catch { /* ignore resolver errors */ }
        }
        const decision = (0, policyEngine_1.authorize)({
            user: req.user,
            action,
            resource: resource || undefined,
            request: req
        });
        if (!decision.allow) {
            return res.status(403).json({ error: 'PolicyDenied', message: decision.reason || 'Access denied' });
        }
        next();
    };
};
exports.requirePolicy = requirePolicy;
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
