"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authEnhanced_1 = require("../middleware/authEnhanced");
const metrics_1 = require("../monitoring/metrics");
const jobQueue_1 = require("../jobs/jobQueue");
const cache_1 = require("../utils/cache");
const webhooks_1 = require("../services/webhooks");
const retentionJob_1 = __importDefault(require("../jobs/handlers/retentionJob"));
const router = (0, express_1.Router)();
router.get('/summary', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)(['owner', 'admin']), async (_req, res) => {
    const m = metrics_1.metrics.snapshot();
    const jobs = jobQueue_1.jobQueue.getStats();
    res.json({ success: true, metrics: { counters: m.counters, gauges: m.gauges }, jobs });
});
router.post('/cache/invalidate', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)(['owner', 'admin']), async (req, res) => {
    const { tags } = req.body || {};
    if (!Array.isArray(tags) || !tags.length)
        return res.status(400).json({ success: false, message: 'tags_required' });
    for (const t of tags) {
        try {
            (0, cache_1.invalidateTag)(String(t));
        }
        catch { /* ignore */ }
    }
    res.json({ success: true, invalidated: tags.length });
});
router.post('/webhooks/redeliver', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)(['owner', 'admin']), async (req, res) => {
    const { deliveryId } = req.body || {};
    if (!deliveryId)
        return res.status(400).json({ success: false, message: 'deliveryId_required' });
    await (0, webhooks_1.retryDelivery)(Number(deliveryId));
    res.json({ success: true });
});
router.post('/jobs/pause', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)(['owner', 'admin']), async (_req, res) => {
    jobQueue_1.jobQueue.pause();
    res.json({ success: true, paused: true });
});
router.post('/jobs/resume', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)(['owner', 'admin']), async (_req, res) => {
    jobQueue_1.jobQueue.resume();
    res.json({ success: true, paused: false });
});
router.get('/jobs/status', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)(['owner', 'admin']), async (_req, res) => {
    res.json({ success: true, ...jobQueue_1.jobQueue.getStats() });
});
// Manual trigger for data retention sweep
router.post('/retention/run', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)(['owner', 'admin']), async (_req, res) => {
    try {
        await (0, retentionJob_1.default)();
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});
exports.default = router;
