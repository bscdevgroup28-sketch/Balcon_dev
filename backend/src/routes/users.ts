import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { User } from '../models/UserEnhanced';
import { validate, ValidatedRequest } from '../middleware/validation';
import {
  createUserSchema,
  updateUserSchema,
  idParamSchema,
  CreateUserInput,
  UpdateUserInput,
  IdParamInput,
} from '../utils/validation';
import { logger } from '../utils/logger';
import { authenticateToken, requireRole } from '../middleware/authEnhanced';
import bcrypt from 'bcryptjs';

const router = Router();

// GET /api/users - Get all users (admin only)
router.get(
  '/',
  authenticateToken,
  requireRole(['owner']),
  async (req: Request, res: Response) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['passwordHash'] }, // Exclude password from response
        order: [['createdAt', 'DESC']],
      });

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

// GET /api/users/:id - Get user by ID
router.get(
  '/:id',
  authenticateToken,
  validate({ params: idParamSchema }),
  async (req: ValidatedRequest<any, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;

      const user = await User.findByPk(id, {
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
    } catch (error) {
      logger.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

// POST /api/users - Create new user (admin only)
router.post(
  '/',
  authenticateToken,
  requireRole(['owner']),
  validate({ body: createUserSchema }),
  async (req: ValidatedRequest<CreateUserInput>, res: Response) => {
    try {
      const userData = req.validatedBody!;

      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Create user with default password
      const user = await User.createWithPassword(userData, 'defaultPassword123');

      // Remove password from response
      const userResponse = { ...user.toJSON() };
      delete (userResponse as any).passwordHash;

      logger.info(`User created: ${user.email} by user ${(req as any).user.id}`);

      res.status(201).json({
        success: true,
        data: userResponse,
        message: 'User created successfully. Default password: defaultPassword123',
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

// PUT /api/users/:id - Update user
router.put(
  '/:id',
  authenticateToken,
  validate({
    params: idParamSchema,
    body: updateUserSchema,
  }),
  async (req: ValidatedRequest<UpdateUserInput, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;
      const updateData = req.validatedBody!;
      const userRole = (req as any).user.role;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check permissions - users can update themselves, admins can update anyone
      if (user.id !== (req as any).user.id && userRole !== 'owner') {
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
      delete (userResponse as any).passwordHash;

      logger.info(`User updated: ${user.email} by user ${(req as any).user.id}`);

      res.json({
        success: true,
        data: userResponse,
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

// DELETE /api/users/:id - Delete user (admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['owner']),
  validate({ params: idParamSchema }),
  async (req: ValidatedRequest<any, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Prevent deleting self
      if (user.id === (req as any).user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
        });
      }

      await user.destroy();

      logger.info(`User deleted: ${user.email} by user ${(req as any).user.id}`);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

// GET /api/users/profile/me - Get current user profile
router.get(
  '/profile/me',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;

      const user = await User.findByPk(userId, {
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
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

export default router; 
