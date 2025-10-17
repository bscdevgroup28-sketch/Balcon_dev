"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const securityMetrics_1 = require("../utils/securityMetrics");
const securityAudit_1 = require("../utils/securityAudit");
const SecurityAuditEvent_1 = require("../models/SecurityAuditEvent");
const authEnhanced_1 = require("../middleware/authEnhanced");
const router = (0, express_1.Router)();
// GET /api/security/metrics
router.get('/metrics', authEnhanced_1.authenticateToken, (req, res) => {
    res.json({ success: true, data: (0, securityMetrics_1.getSecurityMetrics)() });
});
// GET /api/security/audit?limit=100&action=auth.login&outcome=success&since=ISO
router.get('/audit', authEnhanced_1.authenticateToken, (req, res) => {
    const { action, outcome, since, limit } = req.query;
    const events = (0, securityAudit_1.getRecentSecurityEvents)({ action, outcome, since });
    const lim = Math.min(parseInt(limit || '100', 10), 250);
    res.json({ success: true, count: events.slice(-lim).length, data: events.slice(-lim) });
});
// GET /api/security/audit/persistent?page=1&pageSize=50&action=auth.login&outcome=success
router.get('/audit/persistent', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        const { page = '1', pageSize = '50', action, outcome, actorUserId, targetUserId, q, from, to } = req.query;
        const p = Math.max(parseInt(page, 10) || 1, 1);
        const ps = Math.min(Math.max(parseInt(pageSize, 10) || 50, 1), 250);
        const where = {};
        if (action)
            where.action = action;
        if (outcome)
            where.outcome = outcome;
        if (actorUserId)
            where.actor_user_id = actorUserId;
        if (targetUserId)
            where.target_user_id = targetUserId;
        if (from || to)
            where.created_at = {};
        if (from)
            where.created_at['$gte'] = new Date(from);
        if (to)
            where.created_at['$lte'] = new Date(to);
        if (q) {
            // Basic meta text search (SQLite/Postgres compatibility) – serialize meta and LIKE
            where.meta = { $like: `%${q}%` }; // Will be adapted by dialect; lightweight debug search
        }
        const offset = (p - 1) * ps;
        const { rows, count } = await SecurityAuditEvent_1.SecurityAuditEvent.findAndCountAll({ where, order: [['created_at', 'DESC']], limit: ps, offset });
        res.json({ success: true, page: p, pageSize: ps, total: count, data: rows });
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to query persistent audit log' });
    }
});
exports.default = router;
// Prometheus style metrics (mounted separately by app if desired)
router.get('/metrics/prometheus', authEnhanced_1.authenticateToken, (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send((0, securityMetrics_1.securityMetricsToPrometheus)());
});
