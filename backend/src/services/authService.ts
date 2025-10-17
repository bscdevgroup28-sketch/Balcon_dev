import jwt, { SignOptions } from 'jsonwebtoken';
// removed unused bcrypt import
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/UserEnhanced';
import { logger } from '../utils/logger';
import { logSecurityEvent } from '../utils/securityAudit';
import crypto from 'crypto';
import { RefreshToken } from '../models/RefreshToken';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'balcon-builders-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
// Note: do NOT cache refresh token lifetime; tests may override env var at runtime
function getRefreshTokenTtl() {
  return process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
}

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
      expiresIn: getRefreshTokenTtl(),
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
      }) as JWTPayload; // jwt.verify respects exp
      return decoded;
    } catch (error) {
      logger.warn('Token verification failed:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  // Authenticate user with email and password
  static async authenticateUser(email: string, password: string, meta?: { ip?: string, ua?: string }): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  } | null> {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        logger.warn(`Authentication failed: User not found for email ${email}`);
        logSecurityEvent(undefined, { action: 'auth.login', outcome: 'failure', meta: { reason: 'user_not_found', email: email.toLowerCase() } });
        return null;
      }

      // Check if user is active
      if (!user.isActive) {
        logger.warn(`Authentication failed: User ${email} is inactive`);
        logSecurityEvent(undefined, { action: 'auth.login', outcome: 'failure', meta: { reason: 'inactive', userId: user.id } });
        return null;
      }

      // Verify password
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        logger.warn(`Authentication failed: Invalid password for user ${email}`);
        logSecurityEvent(undefined, { action: 'auth.login', outcome: 'failure', meta: { reason: 'bad_password', userId: user.id } });
        return null;
      }

      // Update last login
      await user.updateLastLogin();

      // Generate tokens
  const accessToken = this.generateAccessToken(user);
  const refreshToken = this.generateRefreshToken(user);
  await this.persistRefreshToken(user.id, refreshToken, meta);

  logger.info(`User authenticated successfully: ${email} (${user.role})`);
  logSecurityEvent(undefined, { action: 'auth.login', outcome: 'success', meta: { userId: user.id, email: user.email, role: user.role } });

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
  static async refreshToken(refreshToken: string, meta?: { ip?: string, ua?: string }): Promise<{
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

      // Look up existing stored token hash
      const incomingHash = this.hashToken(refreshToken);
      const stored = await RefreshToken.findOne({ where: { userId: user.id, tokenHash: incomingHash, revokedAt: null } });
      if (!stored) {
        // Reuse or unknown token -> log and deny
  logSecurityEvent(undefined, { action: 'auth.refresh.reuse_detected', outcome: 'failure', actorUserId: user.id, meta: { reason: 'unknown_token' } });
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
  logSecurityEvent(undefined, { action: 'auth.refresh.rotate', outcome: 'success', actorUserId: user.id, meta: { replaced: stored.id } });
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      logger.error('Token refresh error:', error);
      return null;
    }
  }

  // --- Refresh Token Persistence & Helpers ---
  static hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static decodeExpiry(refreshJwt: string): Date | null {
    // Use decode (non-verified) only for storage convenience; if missing exp, fall back to 7d
    try {
      const decoded: any = jwt.decode(refreshJwt);
      if (decoded?.exp) return new Date(decoded.exp * 1000);
      return null;
    } catch { return null; }
  }

  static async persistRefreshToken(userId: number, rawToken: string, meta?: { ip?: string, ua?: string }) {
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = this.decodeExpiry(rawToken) || new Date(Date.now() + 7*24*60*60*1000);
    await RefreshToken.create({ userId, tokenHash, expiresAt, ipAddress: meta?.ip, userAgent: meta?.ua } as any);
  }

  static async revokeAllUserTokens(userId: number) {
    await RefreshToken.update({ revokedAt: new Date() }, { where: { userId, revokedAt: null } });
  }

  static async detectAndFlagReuse(userId: number, tokenHash: string) {
    const existing = await RefreshToken.findOne({ where: { userId, tokenHash } });
    if (!existing) return false;
    if (existing.revokedAt) {
      await existing.update({ reuseDetected: true });
  logSecurityEvent(undefined, { action: 'auth.refresh.reuse_detected', outcome: 'failure', actorUserId: userId, meta: { tokenId: existing.id } });
      return true;
    }
    return false;
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
