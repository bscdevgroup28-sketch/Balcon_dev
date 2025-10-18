import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthService } from '../services/authService';
import { authenticateToken, requirePermission } from '../middleware/authEnhanced';
import { User } from '../models/UserEnhanced';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import { evaluatePassword } from '../security/passwordPolicy';
import { bruteForceProtector } from '../middleware/bruteForceProtector';
import { logSecurityEvent } from '../utils/securityAudit';
import { RefreshToken } from '../models/RefreshToken';

const router = express.Router();

// Zod schemas
const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['customer', 'technician', 'team_leader', 'project_manager', 'office_manager', 'shop_manager', 'owner']),
  // Additional optional fields pass-through
}).strict();

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  currentPassword: z.string().optional()
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required')
});

const forgotPasswordConfirmSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

// POST /api/auth/login
router.post('/login', bruteForceProtector, validate({ body: loginSchema }), async (req: any, res: Response) => {
  try {
    const { email, password } = req.validatedBody;

    const result = await AuthService.authenticateUser(email, password);
    
    if (!result) {
      try { (req as any).recordAuthFailure?.(); } catch { /* ignore in tests */ }
      logSecurityEvent(req, {
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

    // Also set access token as httpOnly cookie (short-lived)
    try {
      const decoded: any = jwt.decode(accessToken);
      const ttlMs = decoded?.exp ? Math.max(0, decoded.exp * 1000 - Date.now()) : 60 * 60 * 1000; // default 1h
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ttlMs
      });
    } catch { /* ignore cookie set failure */ }

  try { (req as any).clearAuthFailures?.(); } catch { /* ignore */ }
    logSecurityEvent(req, {
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
          permissions: user.permissions,
          isVerified: user.isVerified,
          lastLoginAt: user.lastLoginAt,
          mustChangePassword: (user as any).mustChangePassword === true
        },
        accessToken
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/register (requires admin privileges)
router.post('/register', authenticateToken, requirePermission('canManageUsers'), validate({ body: registerSchema }), async (req: any, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, ...userData } = req.validatedBody;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      logSecurityEvent(req, {
        action: 'user.register',
        outcome: 'failure',
        meta: { reason: 'email_exists', email: email.toLowerCase() }
      });
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Enforce password policy
    const pwEval = evaluatePassword(password);
    if (!pwEval.valid) {
      return res.status(400).json({ success: false, message: 'Password does not meet policy', errors: pwEval.errors });
    }
    // Create user
    const user = await AuthService.createUser({
      email,
      firstName,
      lastName,
      role,
      ...userData
    }, password);

    if (!user) {
      logSecurityEvent(req, {
        action: 'user.register',
        outcome: 'failure',
        meta: { reason: 'creation_failed', email: email.toLowerCase() }
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }

    logSecurityEvent(req, {
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

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const result = await AuthService.refreshToken(refreshToken);
    
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

    // Set updated access token cookie
    try {
      const decoded: any = jwt.decode(result.accessToken);
      const ttlMs = decoded?.exp ? Math.max(0, decoded.exp * 1000 - Date.now()) : 60 * 60 * 1000;
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ttlMs
      });
    } catch { /* ignore */ }

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), async (req: any, res: Response) => {
  try {
    const { email } = req.validatedBody as { email: string };
    const normalized = email.toLowerCase();
    const user = await User.findByEmail(normalized);

    // Always return success to avoid user enumeration
    const genericResponse = {
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.'
    };

    if (!user || !user.isActive) {
      logSecurityEvent(req, { action: 'auth.forgot.request', outcome: 'success', meta: { email: normalized, existed: false } });
      return res.json(genericResponse);
    }

    // Generate secure token and expiry (~1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    (user as any).passwordResetToken = token;
    (user as any).passwordResetExpiresAt = expiresAt;
    await user.save();

    // In a real deployment, send email via provider (e.g., SendGrid). Here we just log.
    logger.info(`Password reset requested for ${user.email}. Token expires at ${expiresAt.toISOString()}`);
    logSecurityEvent(req, { action: 'auth.forgot.request', outcome: 'success', targetUserId: user.id });
    return res.json(genericResponse);
  } catch (error) {
    logger.error('Forgot password request error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password/confirm
router.post('/forgot-password/confirm', validate({ body: forgotPasswordConfirmSchema }), async (req: any, res: Response) => {
  try {
    const { token, newPassword } = req.validatedBody as { token: string; newPassword: string };
    const user = await User.findOne({ where: { passwordResetToken: token } as any });
    if (!user || !(user as any).passwordResetExpiresAt || (user as any).passwordResetExpiresAt < new Date()) {
      logSecurityEvent(req, { action: 'auth.forgot.confirm', outcome: 'failure', meta: { reason: 'invalid_or_expired_token' } });
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const pwEval = evaluatePassword(newPassword);
    if (!pwEval.valid) {
      return res.status(400).json({ success: false, message: 'Password does not meet policy', errors: pwEval.errors });
    }

    await user.updatePassword(newPassword);
    (user as any).passwordResetToken = null;
    (user as any).passwordResetExpiresAt = null;
    (user as any).mustChangePassword = false; // user-initiated reset
    await user.save();

    logSecurityEvent(req, { action: 'auth.forgot.confirm', outcome: 'success', targetUserId: user.id });
    return res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    logger.error('Forgot password confirm error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    logSecurityEvent(req, {
      action: 'auth.logout',
      outcome: 'success'
    });
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/auth/revoke-all (invalidate all active refresh tokens for current user)
router.post('/revoke-all', authenticateToken, async (req: any, res: Response) => {
  try {
    const userId = req.userId ?? req.user?.id;
    if (!userId) throw new Error('No authenticated user context');
    await AuthService.revokeAllUserTokens(userId);
    logSecurityEvent(req, { action: 'auth.tokens.revoke_all', outcome: 'success', actorUserId: userId });
    return res.json({ success: true, message: 'All refresh tokens revoked' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[revoke-all] error', error);
    logSecurityEvent(req, { action: 'auth.tokens.revoke_all', outcome: 'failure', meta: { error: (error as Error).message } });
    return res.status(500).json({ success: false, message: 'Failed to revoke tokens', error: (error as Error).message });
  }
});

// GET /api/auth/tokens (list active refresh tokens for current user)
router.get('/tokens', authenticateToken, async (req: any, res: Response) => {
  try {
    const userId = req.userId!;
    const page = Math.max(parseInt(req.query.page as string || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize as string || '25', 10), 1), 100);
    const mask = (req.query.mask ?? 'true') !== 'false';
    const offset = (page - 1) * pageSize;
    const { count, rows } = await RefreshToken.findAndCountAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: pageSize, offset });
    logSecurityEvent(req, { action: 'auth.tokens.list', outcome: 'success', actorUserId: userId, meta: { count: rows.length, page, pageSize } });
    res.json({
      success: true,
      page,
      pageSize,
      total: count,
      data: rows.map(t => ({
        id: t.id,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
        revokedAt: t.revokedAt,
        reuseDetected: t.reuseDetected,
        replacedByToken: mask && t.replacedByToken ? '***' : t.replacedByToken,
        ipAddress: mask ? undefined : t.ipAddress,
        userAgent: mask ? undefined : t.userAgent
      }))
    });
  } catch (error) {
    logSecurityEvent(req, { action: 'auth.tokens.list', outcome: 'failure', meta: { error: (error as Error).message } });
    res.status(500).json({ success: false, message: 'Failed to list tokens' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: any, res: Response) => {
  try {
    const rawUser = req.user!;
    // If the request middleware attached a plain object instead of a Sequelize instance,
    // synthesize the expected helper methods/fields so the response shape stays stable.
    const user: any = rawUser;
    const safeGet = (fnName: string, fallback: any) => {
      try { return typeof user[fnName] === 'function' ? user[fnName]() : fallback; } catch { return fallback; }
    };
    const fullName = safeGet('getFullName', [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email);
    const displayRole = safeGet('getDisplayRole', (user.role || 'user').toString());

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName,
            role: user.role,
            displayRole,
            permissions: {
              canAccessFinancials: user.canAccessFinancials ?? false,
              canManageProjects: user.canManageProjects ?? false,
              canManageUsers: user.canManageUsers ?? false
            },
            isActive: user.isActive !== false,
            isVerified: user.isVerified === true,
            lastLoginAt: user.lastLoginAt ?? null,
            createdAt: user.createdAt ?? null,
            mustChangePassword: (user as any).mustChangePassword === true
        }
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, validate({ body: changePasswordSchema }), async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.validatedBody;
    const userId = req.userId!;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If user is flagged to change password and currentPassword not provided, allow direct change
    if ((user as any).mustChangePassword === true && !currentPassword) {
      await user.updatePassword(newPassword);
      (user as any).mustChangePassword = false;
      await user.save();
      logSecurityEvent(req, {
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
      logSecurityEvent(req, {
        action: 'user.password.change',
        outcome: 'failure',
        meta: { reason: 'missing_current_password', userId }
      });
      return res.status(400).json({ success: false, message: 'Current password is required' });
    }

    // Evaluate new password strength
    const pwEval = evaluatePassword(newPassword);
    if (!pwEval.valid) {
      return res.status(400).json({ success: false, message: 'Password does not meet policy', errors: pwEval.errors });
    }
    const success = await AuthService.changePassword(userId, currentPassword, newPassword);
    if (!success) {
      logSecurityEvent(req, {
        action: 'user.password.change',
        outcome: 'failure',
        meta: { reason: 'incorrect_current_password', userId }
      });
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Ensure flag cleared if it was still set
    if ((user as any).mustChangePassword === true) {
      (user as any).mustChangePassword = false;
      await user.save();
    }

    logSecurityEvent(req, {
      action: 'user.password.change',
      outcome: 'success',
      meta: { userId }
    });
    res.json({ success: true, message: 'Password changed successfully', data: { mustChangePassword: false } });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/auth/reset-password/:userId (admin only)
const adminResetSchema = z.object({ newPassword: z.string().min(8) });
router.put('/reset-password/:userId', authenticateToken, requirePermission('canManageUsers'), validate({ body: adminResetSchema }), async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.validatedBody;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    const targetId = parseInt(userId);
    const user = await User.findByPk(targetId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const pwEval = evaluatePassword(newPassword);
    if (!pwEval.valid) {
      return res.status(400).json({ success: false, message: 'Password does not meet policy', errors: pwEval.errors });
    }
    await user.updatePassword(newPassword);
    // Force password rotation after admin reset
    (user as any).mustChangePassword = true;
    await user.save();
    logSecurityEvent(req, {
      action: 'user.password.reset',
      outcome: 'success',
      targetUserId: user.id,
      meta: { adminUserId: req.userId }
    });
    res.json({ success: true, message: 'Password reset successfully (rotation required)', data: { mustChangePassword: true } });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/auth/users (admin only)
router.get('/users', authenticateToken, requirePermission('canManageUsers'), async (req: any, res: Response) => {
  try {
    const users = await User.findAll({
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
          mustChangePassword: (user as any).mustChangePassword === true
        }))
      }
    });

  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/auth/users/:userId/status (admin only)
const statusSchema = z.object({ isActive: z.boolean() });
router.put('/users/:userId/status', authenticateToken, requirePermission('canManageUsers'), validate({ body: statusSchema }), async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.validatedBody;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();
    logSecurityEvent(req, {
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

  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
