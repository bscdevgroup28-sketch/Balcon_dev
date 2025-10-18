"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const authEnhanced_1 = require("../middleware/authEnhanced");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../utils/validation");
const actions_1 = require("../security/actions");
const metrics_1 = require("../monitoring/metrics");
const logger_1 = require("../utils/logger");
const Sequence_1 = require("../models/Sequence");
const cache_1 = require("../utils/cache");
const router = (0, express_1.Router)();
// List
router.get('/', authEnhanced_1.authenticateToken, (0, validation_1.validate)({ query: validation_2.changeOrderQuerySchema }), async (req, res) => {
    const start = Date.now();
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', projectId, status, search } = req.validatedQuery;
        const offset = (page - 1) * limit;
        const where = {};
        if (projectId)
            where.projectId = projectId;
        if (status)
            where.status = status;
        if (search)
            where.title = { [sequelize_1.Op.iLike]: `%${search}%` };
        const { count, rows } = await models_1.ChangeOrder.findAndCountAll({
            where,
            include: [
                { model: models_1.Project, as: 'project', attributes: ['id', 'title', 'status'] },
                { model: models_1.Quote, as: 'quote', attributes: ['id', 'quoteNumber'], required: false }
            ],
            limit,
            offset,
            order: [[sortBy, (sortOrder || 'desc').toUpperCase()]],
        });
        metrics_1.metrics.observe('change_orders.list.latency.ms', Date.now() - start);
        res.json({ success: true, data: { changeOrders: rows, pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } } });
    }
    catch (e) {
        metrics_1.metrics.increment('change_orders.list.error');
        res.status(500).json({ success: false, message: 'Failed to fetch change orders', error: process.env.NODE_ENV === 'development' ? e.message : undefined });
    }
});
// Get one
router.get('/:id', authEnhanced_1.authenticateToken, (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const co = await models_1.ChangeOrder.findByPk(id, { include: [{ model: models_1.Project, as: 'project' }, { model: models_1.Quote, as: 'quote' }] });
        if (!co)
            return res.status(404).json({ success: false, message: 'Change order not found' });
        res.json({ success: true, data: co });
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch change order', error: process.env.NODE_ENV === 'development' ? e.message : undefined });
    }
});
// Create
router.post('/', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.CHANGE_ORDER_CREATE), (0, validation_1.validate)({ body: validation_2.createChangeOrderSchema }), async (req, res) => {
    try {
        const body = req.validatedBody;
        const project = await models_1.Project.findByPk(body.projectId);
        if (!project)
            return res.status(404).json({ success: false, message: 'Project not found' });
        let code;
        try {
            const seq = await (0, Sequence_1.getNextSequence)('change_order_code');
            code = `CO-${seq.toString().padStart(6, '0')}`;
        }
        catch {
            code = `CO-${Date.now()}`;
        }
        const co = await models_1.ChangeOrder.create({
            projectId: body.projectId,
            quoteId: body.quoteId,
            code,
            title: body.title,
            description: body.description,
            status: 'draft',
            amount: body.amount,
            createdByUserId: req.user.id
        });
        try {
            (0, cache_1.invalidateTag)(cache_1.cacheTags.analytics);
        }
        catch { }
        metrics_1.metrics.increment('change_orders.created');
        res.status(201).json({ success: true, data: co });
    }
    catch (e) {
        logger_1.logger.error('Error creating change order', e);
        res.status(500).json({ success: false, message: 'Failed to create change order', error: process.env.NODE_ENV === 'development' ? e.message : undefined });
    }
});
// Update
router.put('/:id', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.CHANGE_ORDER_UPDATE), (0, validation_1.validate)({ params: validation_2.idParamSchema, body: validation_2.updateChangeOrderSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const body = req.validatedBody;
        const co = await models_1.ChangeOrder.findByPk(id);
        if (!co)
            return res.status(404).json({ success: false, message: 'Change order not found' });
        if (co.status !== 'draft' && (body.title || body.description || body.amount)) {
            return res.status(400).json({ success: false, message: 'Only draft change orders can modify core fields' });
        }
        await co.update({ ...body });
        try {
            (0, cache_1.invalidateTag)(cache_1.cacheTags.analytics);
        }
        catch { }
        metrics_1.metrics.increment('change_orders.updated');
        res.json({ success: true, data: co });
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to update change order', error: process.env.NODE_ENV === 'development' ? e.message : undefined });
    }
});
// Delete
router.delete('/:id', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.CHANGE_ORDER_DELETE), (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const { id } = req.validatedParams;
        const co = await models_1.ChangeOrder.findByPk(id);
        if (!co)
            return res.status(404).json({ success: false, message: 'Change order not found' });
        if (co.status !== 'draft')
            return res.status(400).json({ success: false, message: 'Only draft change orders can be deleted' });
        await co.destroy();
        try {
            (0, cache_1.invalidateTag)(cache_1.cacheTags.analytics);
        }
        catch { }
        metrics_1.metrics.increment('change_orders.deleted');
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to delete change order', error: process.env.NODE_ENV === 'development' ? e.message : undefined });
    }
});
// Status transitions: send, approve, reject
router.post('/:id/send', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.CHANGE_ORDER_UPDATE), (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const co = await models_1.ChangeOrder.findByPk(req.validatedParams.id);
        if (!co)
            return res.status(404).json({ success: false, message: 'Change order not found' });
        if (co.status !== 'draft')
            return res.status(400).json({ success: false, message: 'Only draft change orders can be sent' });
        await co.update({ status: 'sent' });
        metrics_1.metrics.increment('change_orders.sent');
        res.json({ success: true, data: co });
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to send change order' });
    }
});
router.post('/:id/approve', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.CHANGE_ORDER_APPROVE), (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const co = await models_1.ChangeOrder.findByPk(req.validatedParams.id);
        if (!co)
            return res.status(404).json({ success: false, message: 'Change order not found' });
        if (!['sent', 'draft'].includes(co.status))
            return res.status(400).json({ success: false, message: 'Only sent/draft change orders can be approved' });
        await co.update({ status: 'approved', approvedAt: new Date(), approvedByUserId: req.user.id });
        metrics_1.metrics.increment('change_orders.approved');
        try {
            (0, cache_1.invalidateTag)(cache_1.cacheTags.analytics);
        }
        catch { }
        res.json({ success: true, data: co });
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to approve change order' });
    }
});
router.post('/:id/reject', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.CHANGE_ORDER_APPROVE), (0, validation_1.validate)({ params: validation_2.idParamSchema }), async (req, res) => {
    try {
        const co = await models_1.ChangeOrder.findByPk(req.validatedParams.id);
        if (!co)
            return res.status(404).json({ success: false, message: 'Change order not found' });
        if (!['sent', 'draft'].includes(co.status))
            return res.status(400).json({ success: false, message: 'Only sent/draft change orders can be rejected' });
        await co.update({ status: 'rejected', approvedAt: null, approvedByUserId: null });
        metrics_1.metrics.increment('change_orders.rejected');
        try {
            (0, cache_1.invalidateTag)(cache_1.cacheTags.analytics);
        }
        catch { }
        res.json({ success: true, data: co });
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to reject change order' });
    }
});
exports.default = router;
