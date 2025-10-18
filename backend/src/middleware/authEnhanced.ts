import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { logSecurityEvent } from '../utils/securityAudit';
import { authorize } from '../security/policyEngine';
import { metrics } from '../monitoring/metrics';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

// Enhanced JWT authentication middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  // Fallback: support httpOnly cookie 'accessToken'
  if (!token && (req as any).cookies && (req as any).cookies.accessToken) {
    token = (req as any).cookies.accessToken;
  }

  if (!token) {
    logSecurityEvent(req, { action: 'auth.token.validate', outcome: 'failure', meta: { reason: 'missing' } });
    metrics.increment('auth.failures');
    res.status(401).json({ 
      error: 'Access token required',
      message: 'Please provide a valid authentication token'
    });
    return;
  }

  try {
  const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      logSecurityEvent(req, { action: 'auth.token.validate', outcome: 'failure', meta: { reason: 'misconfiguration' } });
      metrics.increment('auth.failures');
      res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Authentication system not properly configured'
      });
      return;
    }

    const decoded: any = jwt.verify(token, jwtSecret);
    const userId = decoded.id ?? decoded.userId; // support both payload shapes
    // Normalize permissions: may be array OR object of booleans
    let perms: string[] = [];
    if (Array.isArray(decoded.permissions)) {
      perms = decoded.permissions;
    } else if (decoded.permissions && typeof decoded.permissions === 'object') {
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
    (req as any).userId = userId;

  logger.info(`✅ Authenticated user: ${decoded.email} (${decoded.role})`);
  logSecurityEvent(req, { action: 'auth.token.validate', outcome: 'success', meta: { userId, role: decoded.role } });
  metrics.increment('auth.success');
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logSecurityEvent(req, { action: 'auth.token.validate', outcome: 'failure', meta: { reason: 'expired' } });
      metrics.increment('auth.failures');
      res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logSecurityEvent(req, { action: 'auth.token.validate', outcome: 'failure', meta: { reason: 'invalid' } });
      metrics.increment('auth.failures');
      res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided authentication token is invalid.'
      });
    } else {
      logger.error('Authentication error:', error);
      logSecurityEvent(req, { action: 'auth.token.validate', outcome: 'failure', meta: { reason: 'error' } });
      metrics.increment('auth.failures');
      res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Unable to authenticate the request.'
      });
    }
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

// Permission-based authorization middleware
export const requirePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

// Generic policy middleware: pass canonical action id and optional resource resolver
export const requirePolicy = (action: string, resolveResource?: (req: Request) => Promise<{ type: string; ownerId?: number; attributes?: any } | null> ) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', message: 'User must be authenticated' });
    }
    let resource = null;
    if (resolveResource) {
      try { resource = await resolveResource(req); } catch { /* ignore resolver errors */ }
    }
    const decision = authorize({
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

// Owner or assigned user authorization
export const requireOwnerOrAssigned = (req: Request, res: Response, next: NextFunction): void => {
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
