import express, { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { authenticateToken, requireRole, requirePermission } from '../middleware/authEnhanced';
import { User } from '../models/UserEnhanced';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation middlewares
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['customer', 'technician', 'team_leader', 'project_manager', 'office_manager', 'shop_manager', 'owner'])
    .withMessage('Valid role is required')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
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
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { email, password } = req.body;

    const result = await AuthService.authenticateUser(email, password);
    
    if (!result) {
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
          lastLoginAt: user.lastLoginAt
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
router.post('/register', authenticateToken, requirePermission('canManageUsers'), registerValidation, async (req: any, res: Response) => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { email, password, firstName, lastName, role, ...userData } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
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
      return res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }

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

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

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

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: any, res: Response) => {
  try {
    const user = req.user!;

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
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, changePasswordValidation, async (req: any, res: Response) => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { currentPassword, newPassword } = req.body;
    const userId = req.userId!;

    const success = await AuthService.changePassword(userId, currentPassword, newPassword);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/auth/reset-password/:userId (admin only)
router.put('/reset-password/:userId', authenticateToken, requirePermission('canManageUsers'), async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    const success = await AuthService.resetPassword(parseInt(userId), newPassword);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

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
          createdAt: user.createdAt
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
router.put('/users/:userId/status', authenticateToken, requirePermission('canManageUsers'), async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = isActive;
    await user.save();

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
