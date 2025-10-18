"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authEnhanced_1 = require("../middleware/authEnhanced");
const zod_1 = require("zod");
const metrics_1 = require("../monitoring/metrics");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const slackBody = zod_1.z.object({ text: zod_1.z.string().min(1).max(4000).optional(), channel: zod_1.z.string().optional(), blocks: zod_1.z.any().optional() });
router.post('/slack/test', authEnhanced_1.authenticateToken, (0, authEnhanced_1.requireRole)(['owner', 'admin', 'office_manager']), async (req, res) => {
    try {
        const parsed = slackBody.safeParse(req.body || {});
        if (!parsed.success)
            return res.status(400).json({ error: 'validation_failed', details: parsed.error.issues });
        const url = process.env.SLACK_WEBHOOK_URL;
        if (!url)
            return res.status(400).json({ error: 'config_missing', message: 'SLACK_WEBHOOK_URL not configured' });
        const payload = {
            text: parsed.data.text || 'Bal-Con Builders Slack integration test message',
            blocks: parsed.data.blocks,
        };
        if (parsed.data.channel)
            payload.channel = parsed.data.channel;
        const meta = { env: process.env.NODE_ENV || 'development', time: new Date().toISOString() };
        const body = JSON.stringify({ ...payload, meta });
        const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        const ok = resp.ok;
        if (!ok) {
            const t = await resp.text().catch(() => '');
            metrics_1.metrics.increment('integrations.slack.failed');
            return res.status(502).json({ error: 'slack_failed', message: t.slice(0, 200) });
        }
        metrics_1.metrics.increment('integrations.slack.sent');
        res.json({ ok: true });
    }
    catch (e) {
        logger_1.logger.error('slack test failed', { error: e.message });
        metrics_1.metrics.increment('integrations.slack.failed');
        res.status(500).json({ error: 'internal_error' });
    }
});
exports.default = router;
