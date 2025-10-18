"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authEnhanced_1 = require("../middleware/authEnhanced");
const customerApprovalService_1 = require("../services/customerApprovalService");
const metrics_1 = require("../monitoring/metrics");
const webhooks_1 = require("../services/webhooks");
const eventBus_1 = require("../events/eventBus");
const router = (0, express_1.Router)();
// Issue a token for a project (and optionally quote/order)
router.post('/projects/:id/approvals/token', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)(['owner', 'admin', 'project_manager']), async (req, res) => {
    const start = Date.now();
    try {
        const projectId = parseInt(req.params.id, 10);
        const { quoteId, orderId, ttlDays } = req.body || {};
        const rec = await (0, customerApprovalService_1.createApprovalToken)({ projectId, quoteId, orderId, createdByUserId: req.user.id, ttlDays });
        const url = (0, customerApprovalService_1.approvalUrlFor)(rec.token);
        metrics_1.metrics.increment('approvals.token.issued');
        metrics_1.metrics.observe('approvals.route.latency.ms', Date.now() - start);
        res.json({ ok: true, token: rec.token, url, expiresAt: rec.expiresAt });
    }
    catch (e) {
        metrics_1.metrics.increment('approvals.token.issue_failed');
        res.status(500).json({ ok: false, error: 'Failed to issue approval token' });
    }
});
// Public: read-only token info (no auth required)
router.get('/approvals/:token', async (req, res) => {
    const v = await (0, customerApprovalService_1.verifyToken)(req.params.token);
    if (!v.ok)
        return res.status(400).json({ ok: false, reason: v.reason });
    const rec = v.record;
    // In the future, include read-only payload for rendering: project/quote/order summary
    res.json({ ok: true, token: rec.token, projectId: rec.projectId, quoteId: rec.quoteId, orderId: rec.orderId, expiresAt: rec.expiresAt });
});
// Public: approve/reject
router.post('/approvals/:token/decision', async (req, res) => {
    const { decision, note } = req.body || {};
    if (!['approve', 'reject'].includes(decision))
        return res.status(400).json({ ok: false, error: 'Invalid decision' });
    const result = await (0, customerApprovalService_1.consumeToken)(req.params.token, { decision, note, actorIp: req.ip, userAgent: req.headers['user-agent'] });
    if (!result.ok)
        return res.status(400).json({ ok: false, reason: result.reason });
    metrics_1.metrics.increment(`approvals.${decision}`);
    try {
        (0, webhooks_1.publishEvent)('approval.completed', {
            projectId: result.record.projectId,
            quoteId: result.record.quoteId,
            orderId: result.record.orderId,
            decision
        });
        // Also emit on internal event bus for in-process listeners (e.g., Slack notifications)
        try {
            eventBus_1.eventBus.emitEvent((0, eventBus_1.createEvent)('approval.completed', {
                projectId: result.record.projectId,
                quoteId: result.record.quoteId,
                orderId: result.record.orderId,
                decision
            }));
        }
        catch { /* ignore bus errors */ }
    }
    catch { /* ignore event errors */ }
    res.json({ ok: true, decision });
});
exports.default = router;
