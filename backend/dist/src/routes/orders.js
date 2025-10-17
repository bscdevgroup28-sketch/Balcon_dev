"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const eventBus_1 = require("../events/eventBus");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const Sequence_1 = require("../models/Sequence");
const authEnhanced_1 = require("../middleware/authEnhanced");
const actions_1 = require("../security/actions");
const router = (0, express_1.Router)();
// GET /api/orders - Get all orders with filtering and pagination
router.get('/', authEnhanced_1.authenticateToken, (0, validation_1.validate)({ query: validation_2.orderQuerySchema }), async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, priority, projectId, userId, search, } = req.validatedQuery;
        const offset = (page - 1) * limit;
        const where = {};
        // Apply role-based filtering
        const userRole = req.user.role;
        const userIdFromToken = req.user.id;
        if (userRole === 'customer') {
            where.userId = userIdFromToken;
        }
        // Note: Project manager filtering removed until projectManagerId field is added to Project model
        // Apply filters
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (projectId)
            where.projectId = projectId;
        if (userId && (userRole === 'admin' || userRole === 'owner'))
            where.userId = userId;
        // Apply search
        if (search) {
            where[sequelize_1.Op.or] = [
                { orderNumber: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { notes: { [sequelize_1.Op.iLike]: `%${search}%` } },
            ];
        }
        const { count, rows: orders } = await models_1.Order.findAndCountAll({
            where,
            include: [
                {
                    model: models_1.Project,
                    as: 'project',
                    attributes: ['id', 'name', 'status'],
                },
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                },
                {
                    model: models_1.Quote,
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});
// GET /api/orders/:id - Get single order
router.get('/:id', authEnhanced_1.authenticateToken, (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const userRole = req.user.role;
        const userId = req.user.id;
        const order = await models_1.Order.findByPk(id, {
            include: [
                {
                    model: models_1.Project,
                    as: 'project',
                    attributes: ['id', 'name', 'status', 'description'],
                },
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
                },
                {
                    model: models_1.Quote,
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});
// POST /api/orders - Create new order
router.post('/', authEnhanced_1.authenticateToken, 
// Prefer policy-based authorization; fallback role guard retained temporarily for legacy
(0, authEnhanced_1.requirePolicy)(actions_1.Actions.ORDER_CREATE), (0, validation_1.validate)({ body: validation_2.createOrderSchema }), async (req, res) => {
    try {
        const orderData = req.validatedBody;
        // Verify project exists and user has access
        const project = await models_1.Project.findByPk(orderData.projectId);
        if (!project) {
            logger_1.logger.warn('Order create 404 project not found', { projectId: orderData.projectId });
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }
        // Determine userId: prefer provided, fallback to project's userId
        let userIdToUse = orderData.userId;
        if (!userIdToUse && project.userId)
            userIdToUse = project.userId;
        const user = userIdToUse ? await models_1.User.findByPk(userIdToUse) : null;
        if (!user) {
            logger_1.logger.warn('Order create 404 user not found', { userIdToUse });
            return res.status(404).json({ success: false, message: 'User not found for order creation' });
        }
        // Generate deterministic sequential order number (e.g., ORD-000001)
        let orderNumber;
        try {
            const seq = await (0, Sequence_1.getNextSequence)('order_number');
            orderNumber = `ORD-${seq.toString().padStart(6, '0')}`;
        }
        catch (e) {
            logger_1.logger.error('Order sequence generation failed, using fallback', e);
            orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        }
        // Calculate totals
        const subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxAmount = subtotal * 0.08; // 8% tax
        const totalAmount = subtotal + taxAmount;
        const order = await models_1.Order.create({
            ...orderData,
            userId: user.id,
            orderNumber,
            subtotal,
            taxAmount,
            totalAmount,
            amountPaid: 0,
            status: 'pending',
            estimatedDelivery: orderData.estimatedDelivery ? new Date(orderData.estimatedDelivery) : undefined,
        });
        logger_1.logger.info(`Order created: ${orderNumber} by user ${req.user.id}`);
        // Emit domain event
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('order.created', {
            id: order.id,
            orderNumber,
            projectId: order.projectId,
            userId: order.userId,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
            deliveredAt: order.get('deliveredAt') || null
        }));
        res.status(201).json({
            success: true,
            data: order,
            message: 'Order created successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});
// PUT /api/orders/:id - Update order
router.put('/:id', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.ORDER_UPDATE), (0, validation_1.validate)({ params: validation_2.idParamSchema, body: validation_2.updateOrderSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const updateData = req.validatedBody;
        const order = await models_1.Order.findByPk(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }
        // Prepare update data with proper types
        const updateFields = { ...updateData };
        // Recalculate totals if items changed
        if (updateData.items) {
            const subtotal = updateData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
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
        const statusBefore = order.get('status');
        await order.update(updateFields);
        const statusAfter = order.get('status');
        logger_1.logger.info(`Order updated: ${order.orderNumber} by user ${req.user.id}`);
        // Emit update event
        const changedKeys = Object.keys(updateFields);
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('order.updated', {
            id: order.id,
            orderNumber: order.orderNumber,
            changed: changedKeys,
            statusBefore,
            statusAfter
        }));
        if (statusBefore !== statusAfter) {
            const payloadBase = {
                id: order.id,
                orderNumber: order.orderNumber,
                projectId: order.projectId,
                createdAt: order.createdAt,
                deliveredAt: order.get('deliveredAt') || null
            };
            eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('order.status.changed', {
                ...payloadBase,
                statusBefore,
                statusAfter
            }));
            eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)(`order.${statusAfter}`, payloadBase));
        }
        res.json({
            success: true,
            data: order,
            message: 'Order updated successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});
// DELETE /api/orders/:id - Delete order
router.delete('/:id', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.ORDER_DELETE), (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const order = await models_1.Order.findByPk(id);
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
        logger_1.logger.info(`Order deleted: ${order.orderNumber} by user ${req.user.id}`);
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('order.deleted', { id: order.id, orderNumber: order.orderNumber }));
        res.json({
            success: true,
            message: 'Order deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});
exports.default = router;
