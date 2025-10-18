"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authEnhanced_1 = require("../middleware/authEnhanced");
const zod_1 = require("zod");
const models_1 = require("../models");
const PurchaseOrder_1 = require("../models/PurchaseOrder");
const logger_1 = require("../utils/logger");
const metrics_1 = require("../monitoring/metrics");
const actions_1 = require("../security/actions");
const cache_1 = require("../utils/cache");
const eventBus_1 = require("../events/eventBus");
const router = (0, express_1.Router)();
// Shortage computation: naive approach sums materials with stock below reorderPoint
router.get('/shortages', authEnhanced_1.authenticateToken, async (_req, res) => {
    try {
        const low = await models_1.Material.findAll({ where: {}, order: [['currentStock', 'ASC']], limit: 500 });
        const shortages = low.filter(m => m.needsReorder).map(m => ({ materialId: m.id, name: m.name, currentStock: Number(m.currentStock), reorderPoint: Number(m.reorderPoint), suggestedQty: Math.max(0, Number(m.reorderPoint) - Number(m.currentStock)) }));
        res.json({ success: true, data: shortages });
    }
    catch (e) {
        logger_1.logger.error('shortage list failed', e);
        res.status(500).json({ success: false, message: 'Failed to compute shortages' });
    }
});
const createPOSchema = zod_1.z.object({ vendor: zod_1.z.string().min(2), items: zod_1.z.array(zod_1.z.object({ materialId: zod_1.z.number().positive(), quantity: zod_1.z.number().positive(), unitCost: zod_1.z.number().min(0) })).min(1), notes: zod_1.z.string().optional() });
router.post('/', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.PURCHASE_ORDER_CREATE), async (req, res) => {
    const parsed = createPOSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ success: false, message: 'validation_failed', details: parsed.error.issues });
    const { vendor, items, notes } = parsed.data;
    // Compute total
    const totalCost = items.reduce((s, it) => s + it.quantity * it.unitCost, 0);
    const po = await PurchaseOrder_1.PurchaseOrder.create({ vendor, items, totalCost, status: 'draft', notes });
    metrics_1.metrics.increment('po.created');
    try {
        eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('purchase_order.created', { id: po.id, vendor }));
    }
    catch (e) { /* ignore event bus error */ }
    try {
        (0, cache_1.invalidateTag)(cache_1.cacheTags.materials);
    }
    catch { /* ignore */ }
    res.status(201).json({ success: true, data: po });
});
// Receive PO: update inventory for each item and mark received
router.post('/:id/receive', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requirePolicy)(actions_1.Actions.PURCHASE_ORDER_RECEIVE), async (req, res) => {
    const id = Number(req.params.id);
    const po = await PurchaseOrder_1.PurchaseOrder.findByPk(id);
    if (!po)
        return res.status(404).json({ success: false, message: 'not_found' });
    if (po.status === 'received')
        return res.status(400).json({ success: false, message: 'already received' });
    try {
        for (const it of po.items) {
            const mat = await models_1.Material.findByPk(it.materialId);
            if (!mat)
                continue;
            const resultingStock = Number(mat.currentStock) + Number(it.quantity);
            await mat.update({ currentStock: resultingStock });
            await models_1.InventoryTransaction.create({ materialId: mat.id, type: 'receipt', direction: 'in', quantity: it.quantity, referenceType: 'purchase_order', referenceId: po.id, resultingStock });
        }
        await po.update({ status: 'received', receivedAt: new Date() });
        metrics_1.metrics.increment('po.received');
        try {
            eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('purchase_order.received', { id: po.id, receivedAt: po.receivedAt }));
        }
        catch (e) { /* ignore event bus error */ }
        try {
            (0, cache_1.invalidateTag)(cache_1.cacheTags.materials);
        }
        catch { /* ignore */ }
        res.json({ success: true, data: po });
    }
    catch (e) {
        logger_1.logger.error('receive po failed', e);
        res.status(500).json({ success: false, message: 'failed to receive purchase order' });
    }
});
// Simple list/get
router.get('/', authEnhanced_1.authenticateToken, async (_req, res) => {
    const rows = await PurchaseOrder_1.PurchaseOrder.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: rows });
});
router.get('/:id', authEnhanced_1.authenticateToken, async (req, res) => {
    const id = Number(req.params.id);
    const po = await PurchaseOrder_1.PurchaseOrder.findByPk(id);
    if (!po)
        return res.status(404).json({ success: false, message: 'not_found' });
    res.json({ success: true, data: po });
});
exports.default = router;
