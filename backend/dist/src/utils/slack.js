"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postSlack = postSlack;
const metrics_1 = require("../monitoring/metrics");
const logger_1 = require("./logger");
async function postSlack(message, opts) {
    try {
        const enabled = (process.env.SLACK_NOTIFICATIONS_ENABLED || 'true').toLowerCase() !== 'false';
        const url = process.env.SLACK_WEBHOOK_URL;
        if (!enabled || !url)
            return false;
        const payload = { text: message };
        if (opts?.channel)
            payload.channel = opts.channel;
        if (opts?.blocks)
            payload.blocks = opts.blocks;
        const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!resp.ok) {
            const t = await resp.text().catch(() => '');
            metrics_1.metrics.increment('integrations.slack.failed');
            logger_1.logger.warn('[slack] post failed', { status: resp.status, body: t.slice(0, 200) });
            return false;
        }
        metrics_1.metrics.increment('integrations.slack.sent');
        return true;
    }
    catch (e) {
        logger_1.logger.warn('[slack] post error', { error: e.message });
        try {
            metrics_1.metrics.increment('integrations.slack.failed');
        }
        catch { /* ignore */ }
        return false;
    }
}
