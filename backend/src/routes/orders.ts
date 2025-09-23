import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { Order, Project, User, Quote } from '../models';
import { validate, ValidatedRequest } from '../middleware/validation';
import {
  createOrderSchema,
  updateOrderSchema,
  orderQuerySchema,
  idParamSchema,
  CreateOrderInput,
  UpdateOrderInput,
  OrderQueryInput,
  IdParamInput,
} from '../utils/validation';
import { logger } from '../utils/logger';
import { authenticateToken, requireRole } from '../middleware/authEnhanced';

const router = Router();

// GET /api/orders - Get all orders with filtering and pagination
router.get(
  '/',
  authenticateToken,
  validate({ query: orderQuerySchema }),
  async (req: ValidatedRequest<any, OrderQueryInput>, res: Response) => {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status,
        priority,
        projectId,
        userId,
        search,
      } = req.validatedQuery!;

      const offset = (page - 1) * limit;
      const where: any = {};

      // Apply role-based filtering
      const userRole = (req as any).user.role;
      const userIdFromToken = (req as any).user.id;

      if (userRole === 'customer') {
        where.userId = userIdFromToken;
      }
      // Note: Project manager filtering removed until projectManagerId field is added to Project model

      // Apply filters
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (projectId) where.projectId = projectId;
      if (userId && (userRole === 'admin' || userRole === 'owner')) where.userId = userId;

      // Apply search
      if (search) {
        where[Op.or] = [
          { orderNumber: { [Op.iLike]: `%${search}%` } },
          { notes: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name', 'status'],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'company'],
          },
          {
            model: Quote,
            as: 'quote',
            attributes: ['id', 'quoteNumber', 'totalAmount'],
            required: false,
          },
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
      });

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page,
            limit,
            total: count,
            pages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

// GET /api/orders/:id - Get single order
router.get(
  '/:id',
  authenticateToken,
  validate({ params: idParamSchema }),
  async (req: ValidatedRequest<IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;
      const userRole = (req as any).user.role;
      const userId = (req as any).user.id;

      const order = await Order.findByPk(id, {
        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name', 'status', 'description'],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'company', 'phone'],
          },
          {
            model: Quote,
            as: 'quote',
            attributes: ['id', 'quoteNumber', 'totalAmount', 'items'],
            required: false,
          },
        ],
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      // Check permissions
      if (userRole === 'customer' && order.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      if (userRole === 'project_manager') {
        // For now, project managers can see all orders - this should be restricted based on assigned projects
        // TODO: Add projectManagerId field to Project model for proper filtering
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

// POST /api/orders - Create new order
router.post(
  '/',
  authenticateToken,
  requireRole(['admin', 'owner', 'office_manager']),
  validate({ body: createOrderSchema }),
  async (req: ValidatedRequest<CreateOrderInput>, res: Response) => {
    try {
      const orderData = req.validatedBody!;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Verify project exists and user has access
      const project = await Project.findByPk(orderData.projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
        });
      }

      // Verify user exists
      const user = await User.findByPk(orderData.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Calculate totals
      const subtotal = orderData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = subtotal * 0.08; // 8% tax
      const totalAmount = subtotal + taxAmount;

      const order = await Order.create({
        ...orderData,
        orderNumber,
        subtotal,
        taxAmount,
        totalAmount,
        amountPaid: 0,
        status: 'pending',
        estimatedDelivery: orderData.estimatedDelivery ? new Date(orderData.estimatedDelivery) : undefined,
      });

      logger.info(`Order created: ${orderNumber} by user ${(req as any).user.id}`);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully',
      });
    } catch (error) {
      logger.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

// PUT /api/orders/:id - Update order
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'owner', 'office_manager']),
  validate({ params: idParamSchema, body: updateOrderSchema }),
  async (req: ValidatedRequest<UpdateOrderInput, any, IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;
      const updateData = req.validatedBody!;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      // Prepare update data with proper types
      const updateFields: any = { ...updateData };

      // Recalculate totals if items changed
      if (updateData.items) {
        const subtotal = updateData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
        const taxAmount = subtotal * 0.08;
        const totalAmount = subtotal + taxAmount;
        updateFields.subtotal = subtotal;
        updateFields.taxAmount = taxAmount;
        updateFields.totalAmount = totalAmount;
      }

      // Update status timestamps
      if (updateData.status) {
        const now = new Date();
        switch (updateData.status) {
          case 'confirmed':
            updateFields.confirmedAt = now;
            break;
          case 'shipped':
            updateFields.shippedAt = now;
            break;
          case 'delivered':
            updateFields.deliveredAt = now;
            break;
        }
      }

      // Convert estimatedDelivery to Date if provided
      if (updateData.estimatedDelivery) {
        updateFields.estimatedDelivery = new Date(updateData.estimatedDelivery);
      }

      await order.update(updateFields);

      logger.info(`Order updated: ${order.orderNumber} by user ${(req as any).user.id}`);

      res.json({
        success: true,
        data: order,
        message: 'Order updated successfully',
      });
    } catch (error) {
      logger.error('Error updating order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

// DELETE /api/orders/:id - Delete order
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'owner']),
  validate({ params: idParamSchema }),
  async (req: ValidatedRequest<IdParamInput>, res: Response) => {
    try {
      const { id } = req.validatedParams!;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        });
      }

      // Only allow deletion of pending orders
      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete order that is not in pending status',
        });
      }

      await order.destroy();

      logger.info(`Order deleted: ${order.orderNumber} by user ${(req as any).user.id}`);

      res.json({
        success: true,
        message: 'Order deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete order',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      });
    }
  }
);

export default router;