import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/UserEnhanced';
import { logger } from '../utils/logger';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'balcon-builders-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// JWT Payload interface
export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  permissions: {
    canAccessFinancials: boolean;
    canManageProjects: boolean;
    canManageUsers: boolean;
  };
  type: 'access' | 'refresh';
}

// Extended Request interface with user
export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: number;
}

// Authentication service class
export class AuthService {
  // Generate access token
  static generateAccessToken(user: User): string {
    const payload: JWTPayload = {
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

    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'balcon-builders',
      audience: 'balcon-builders-app'
    } as SignOptions;

    return jwt.sign(payload, JWT_SECRET, options);
  }

  // Generate refresh token
  static generateRefreshToken(user: User): string {
    const payload: JWTPayload = {
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

    const options: SignOptions = {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'balcon-builders',
      audience: 'balcon-builders-app'
    } as SignOptions;

    return jwt.sign(payload, JWT_SECRET, options);
  }

  // Verify token
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'balcon-builders',
        audience: 'balcon-builders-app'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      logger.warn('Token verification failed:', error);
      return null;
    }
  }

  // Authenticate user with email and password
  static async authenticateUser(email: string, password: string): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  } | null> {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        logger.warn(`Authentication failed: User not found for email ${email}`);
        return null;
      }

      // Check if user is active
      if (!user.isActive) {
        logger.warn(`Authentication failed: User ${email} is inactive`);
        return null;
      }

      // Verify password
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        logger.warn(`Authentication failed: Invalid password for user ${email}`);
        return null;
      }

      // Update last login
      await user.updateLastLogin();

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      logger.info(`User authenticated successfully: ${email} (${user.role})`);

      return {
        user,
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Authentication error:', error);
      return null;
    }
  }

  // Refresh access token
  static async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  } | null> {
    try {
      // Verify refresh token
      const payload = this.verifyToken(refreshToken);
      if (!payload || payload.type !== 'refresh') {
        return null;
      }

      // Find user
      const user = await User.findByPk(payload.userId);
      if (!user || !user.isActive) {
        return null;
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      return null;
    }
  }

  // Create user with password
  static async createUser(userData: any, password: string): Promise<User | null> {
    try {
      const user = await User.createWithPassword(userData, password);
      logger.info(`User created successfully: ${user.email} (${user.role})`);
      return user;
    } catch (error) {
      logger.error('User creation error:', error);
      return null;
    }
  }

  // Change user password
  static async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
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
      logger.info(`Password changed successfully for user: ${user.email}`);
      return true;
    } catch (error) {
      logger.error('Password change error:', error);
      return false;
    }
  }

  // Reset user password (admin function)
  static async resetPassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return false;
      }

      await user.updatePassword(newPassword);
      logger.info(`Password reset successfully for user: ${user.email}`);
      return true;
    } catch (error) {
      logger.error('Password reset error:', error);
      return false;
    }
  }
}

// Authentication middleware
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
    const user = await User.findByPk(payload.userId);
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
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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

// Permission-based authorization middleware
export const requirePermission = (permission: 'canAccessFinancials' | 'canManageProjects' | 'canManageUsers') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = AuthService.verifyToken(token);
      if (payload && payload.type === 'access') {
        const user = await User.findByPk(payload.userId);
        if (user && user.isActive) {
          req.user = user;
          req.userId = user.id;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

export default AuthService;
