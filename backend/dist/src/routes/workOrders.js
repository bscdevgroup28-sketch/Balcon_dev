"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authEnhanced_1 = require("../middleware/authEnhanced");
const authEnhanced_2 = require("../middleware/authEnhanced");
const actions_1 = require("../security/actions");
const WorkOrder_1 = require("../models/WorkOrder");
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const eventBus_1 = require("../events/eventBus");
const webSocketService_1 = require("../services/webSocketService");
// removed unused sequelize import
const router = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    projectId: zod_1.z.number().positive(),
    title: zod_1.z.string().min(3).max(200),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    estimatedHours: zod_1.z.number().positive().optional(),
    dueDate: zod_1.z.string().datetime().optional()
});
const updateSchema = createSchema.partial().extend({
    status: zod_1.z.enum(['pending', 'assigned', 'in_progress', 'blocked', 'completed', 'cancelled']).optional(),
    assignedUserId: zod_1.z.number().positive().nullable().optional(),
    actualHours: zod_1.z.number().nonnegative().optional(),
    team: zod_1.z.string().max(100).nullable().optional(),
    startDate: zod_1.z.string().datetime().optional(),
    completedAt: zod_1.z.string().datetime().optional()
});
const idParam = zod_1.z.object({ id: zod_1.z.string().regex(/^\d+$/).transform(v => parseInt(v, 10)) });
router.get('/', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        const { projectId, status, assignedUserId } = req.query;
        const where = {};
        if (projectId)
            where.projectId = Number(projectId);
        if (status)
            where.status = status;
        if (assignedUserId)
            where.assignedUserId = Number(assignedUserId);
        const items = await WorkOrder_1.WorkOrder.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json({ data: items });
    }
    catch (e) {
        logger_1.logger.error('Failed to list work orders', e);
        res.status(500).json({ error: 'Failed to list work orders' });
    }
});
router.post('/', authEnhanced_1.authenticateToken, (0, authEnhanced_2.requirePolicy)(actions_1.Actions.WORK_ORDER_CREATE), async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'validation_failed', details: parsed.error.issues });
    }
    try {
        const { dueDate, ...rest } = parsed.data;
        const wo = await WorkOrder_1.WorkOrder.create({ ...rest, dueDate: dueDate ? new Date(dueDate) : undefined });
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('work_order.created', { id: wo.id, projectId: wo.projectId }));
        res.status(201).json({ data: wo });
    }
    catch (e) {
        logger_1.logger.error('Failed to create work order', e);
        res.status(500).json({ error: 'Failed to create work order' });
    }
});
router.get('/:id', authEnhanced_1.authenticateToken, async (req, res) => {
    const parsed = idParam.safeParse(req.params);
    if (!parsed.success)
        return res.status(400).json({ error: 'invalid_id' });
    const wo = await WorkOrder_1.WorkOrder.findByPk(parsed.data.id);
    if (!wo)
        return res.status(404).json({ error: 'not_found' });
    res.json({ data: wo });
});
router.put('/:id', authEnhanced_1.authenticateToken, (0, authEnhanced_2.requirePolicy)(actions_1.Actions.WORK_ORDER_UPDATE), async (req, res) => {
    const idp = idParam.safeParse(req.params);
    if (!idp.success)
        return res.status(400).json({ error: 'invalid_id' });
    const body = updateSchema.safeParse(req.body);
    if (!body.success)
        return res.status(400).json({ error: 'validation_failed', details: body.error.issues });
    const wo = await WorkOrder_1.WorkOrder.findByPk(idp.data.id);
    if (!wo)
        return res.status(404).json({ error: 'not_found' });
    try {
        const upd = { ...body.data };
        if (upd.dueDate)
            upd.dueDate = new Date(upd.dueDate);
        if (upd.startDate)
            upd.startDate = new Date(upd.startDate);
        if (upd.completedAt)
            upd.completedAt = new Date(upd.completedAt);
        await wo.update(upd);
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('work_order.updated', { id: wo.id, status: wo.status }));
        try {
            (0, webSocketService_1.getWebSocketService)().notifyProject(wo.projectId, { type: 'status_change', title: 'Work Order Updated', message: `${wo.title} updated`, projectId: wo.projectId, timestamp: new Date() });
        }
        catch (e) {
            void 0;
        }
        res.json({ data: wo });
    }
    catch (e) {
        logger_1.logger.error('Failed to update work order', e);
        res.status(500).json({ error: 'Failed to update work order' });
    }
});
router.delete('/:id', authEnhanced_1.authenticateToken, async (req, res) => {
    const idp = idParam.safeParse(req.params);
    if (!idp.success)
        return res.status(400).json({ error: 'invalid_id' });
    const wo = await WorkOrder_1.WorkOrder.findByPk(idp.data.id);
    if (!wo)
        return res.status(404).json({ error: 'not_found' });
    try {
        await wo.destroy();
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('work_order.deleted', { id: wo.id }));
        res.json({ success: true });
    }
    catch (e) {
        logger_1.logger.error('Failed to delete work order', e);
        res.status(500).json({ error: 'Failed to delete work order' });
    }
});
exports.default = router;
// Scheduling board endpoints
// GET /api/work-orders/schedule?start=2025-10-01&end=2025-10-31&team=A
router.get('/schedule', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        const { start, end, team } = req.query;
        const where = {};
        if (start)
            where.startDate = { $gte: new Date(String(start)) };
        if (end)
            where.dueDate = Object.assign(where.dueDate || {}, { $lte: new Date(String(end)) });
        if (team)
            where.team = String(team);
        const rows = await WorkOrder_1.WorkOrder.findAll({ where, order: [['startDate', 'ASC'], ['dueDate', 'ASC']] });
        res.json({ success: true, data: rows });
    }
    catch (e) {
        logger_1.logger.error('schedule list failed', e);
        res.status(500).json({ success: false, message: 'Failed to list schedule' });
    }
});
// Move item on board (update start/end/team/status)
router.post('/:id/move', authEnhanced_1.authenticateToken, (0, authEnhanced_2.requirePolicy)(actions_1.Actions.WORK_ORDER_UPDATE), async (req, res) => {
    const id = Number(req.params.id);
    if (!id)
        return res.status(400).json({ success: false, message: 'invalid id' });
    const body = zod_1.z.object({ startDate: zod_1.z.string().datetime().optional(), dueDate: zod_1.z.string().datetime().optional(), team: zod_1.z.string().max(100).optional(), status: updateSchema.shape.status }).safeParse(req.body);
    if (!body.success)
        return res.status(400).json({ success: false, message: 'validation_failed', details: body.error.issues });
    const wo = await WorkOrder_1.WorkOrder.findByPk(id);
    if (!wo)
        return res.status(404).json({ success: false, message: 'not_found' });
    const upd = {};
    if (body.data.startDate)
        upd.startDate = new Date(body.data.startDate);
    if (body.data.dueDate)
        upd.dueDate = new Date(body.data.dueDate);
    if (body.data.team)
        upd.team = body.data.team;
    if (body.data.status)
        upd.status = body.data.status;
    await wo.update(upd);
    // Emit real-time update
    try {
        (0, webSocketService_1.getWebSocketService)().notifyProject(wo.projectId, { type: 'status_change', title: 'Work Order Moved', message: `${wo.title} moved`, projectId: wo.projectId, timestamp: new Date() });
    }
    catch (e) {
        void 0;
    }
    res.json({ success: true, data: wo });
});
