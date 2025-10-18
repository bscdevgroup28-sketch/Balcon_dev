"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authEnhanced_1 = require("../middleware/authEnhanced");
const cache_1 = require("../utils/cache");
const metrics_1 = require("../monitoring/metrics");
const models_1 = require("../models");
const router = (0, express_1.Router)();
// Derive a coarse role category to avoid high-cardinality labels
function roleBucket(role) {
    switch ((role || '').toLowerCase()) {
        case 'owner':
        case 'admin':
            return 'exec';
        case 'office_manager':
        case 'project_manager':
        case 'shop_manager':
            return 'ops';
        case 'team_leader':
        case 'technician':
            return 'field';
        default:
            return 'unknown';
    }
}
// GET /api/attention
// Returns a lightweight list of attention items based on role
router.get('/', authEnhanced_1.authenticateToken, async (req, res) => {
    const start = Date.now();
    const role = req.user?.role;
    const bucket = roleBucket(role);
    const ttlMs = parseInt(process.env.CACHE_TTL_ATTENTION_MS || '60000');
    const cacheKey = `attention:${bucket}`;
    try {
        const data = await (0, cache_1.withCache)(cacheKey, ttlMs, async () => {
            const items = [];
            // Overdue quotes (exec/ops)
            if (bucket === 'exec' || bucket === 'ops') {
                const overdueQuotes = await models_1.Quote.findAll({ where: { status: 'sent' }, limit: 10, order: [['validUntil', 'ASC']] });
                for (const q of overdueQuotes) {
                    const isExpired = q.isExpired || (new Date() > new Date(q.validUntil));
                    if (isExpired) {
                        items.push({ id: `quote:${q.id}`, type: 'quote', title: `Quote ${q.quoteNumber} expired`, priority: 'high', context: { id: q.id, projectId: q.projectId } });
                    }
                }
            }
            // Orders with balance remaining (exec/ops)
            if (bucket === 'exec' || bucket === 'ops') {
                const orders = await models_1.Order.findAll({ where: { status: ['confirmed', 'in_production', 'ready', 'shipped'] }, limit: 10, order: [['createdAt', 'DESC']] });
                for (const o of orders) {
                    const balanceRemaining = Number(o.balanceRemaining ?? ((Number(o.totalAmount) || 0) - (Number(o.amountPaid) || 0)));
                    if (balanceRemaining > 0) {
                        items.push({ id: `order:${o.id}`, type: 'receivable', title: `Order #${o.orderNumber} has balance due`, priority: balanceRemaining > 1000 ? 'high' : 'medium', context: { id: o.id, projectId: o.projectId, balanceRemaining } });
                    }
                }
            }
            // Low stock materials (ops)
            if (bucket === 'ops') {
                const lows = await models_1.Material.findAll({ limit: 10, order: [['currentStock', 'ASC']] });
                for (const m of lows) {
                    const isLow = m.isLowStock ?? ((Number(m.currentStock) || 0) <= (Number(m.minimumStock) || 0));
                    if (isLow) {
                        items.push({ id: `material:${m.id}`, type: 'inventory', title: `Low stock: ${m.name}`, priority: 'high', context: { id: m.id, currentStock: m.currentStock, minimumStock: m.minimumStock } });
                    }
                }
            }
            // Blocked or overdue work orders (field/ops)
            if (bucket === 'field' || bucket === 'ops') {
                const wos = await models_1.WorkOrder.findAll({ where: { status: ['blocked', 'in_progress', 'assigned'] }, limit: 10, order: [['dueDate', 'ASC']] });
                const now = Date.now();
                for (const w of wos) {
                    const due = w.dueDate ? new Date(w.dueDate).getTime() : 0;
                    const overdue = !!due && due < now && w.status !== 'completed';
                    if (w.status === 'blocked') {
                        items.push({ id: `work:${w.id}`, type: 'work_order', title: `Blocked work order: ${w.title}`, priority: 'urgent', context: { id: w.id, projectId: w.projectId, status: w.status } });
                    }
                    else if (overdue) {
                        items.push({ id: `work:${w.id}`, type: 'work_order', title: `Overdue work order: ${w.title}`, priority: 'high', context: { id: w.id, projectId: w.projectId, dueDate: w.dueDate } });
                    }
                }
            }
            // Limit to 20 items max
            return items.slice(0, 20);
        }, [cache_1.cacheTags.attention]);
        metrics_1.metrics.increment(`attention.requests`);
        res.json({ ok: true, role: role || 'unknown', items: data, cachedTtlMs: ttlMs });
        metrics_1.metrics.observe('attention.latency.ms', Date.now() - start);
    }
    catch (e) {
        metrics_1.metrics.increment('attention.errors');
        res.status(500).json({ ok: false, error: 'Failed to compute attention items' });
    }
});
exports.default = router;
