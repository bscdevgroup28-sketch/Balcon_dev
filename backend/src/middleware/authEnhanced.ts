import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

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
      logger.error('JWT_SECRET not configured');
      res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Authentication system not properly configured'
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };

    logger.info(`✅ Authenticated user: ${decoded.email} (${decoded.role})`);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided authentication token is invalid.'
      });
    } else {
      logger.error('Authentication error:', error);
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
