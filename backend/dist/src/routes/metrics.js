"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metrics_1 = require("../monitoring/metrics");
const advancedMetrics_1 = require("../monitoring/advancedMetrics");
const securityMetrics_1 = require("../utils/securityMetrics");
const queryMonitor_1 = require("../instrumentation/queryMonitor");
// Feature flags / security controls via env
const DIAG_ENABLED = (process.env.DIAG_ENDPOINTS_ENABLED || '').toLowerCase() === 'true';
const METRICS_TOKEN = process.env.METRICS_AUTH_TOKEN;
function requireMetricsAuth(req, res) {
    if (!METRICS_TOKEN)
        return true; // no token configured => allow (dev)
    const auth = req.headers['authorization'] || '';
    if (auth === `Bearer ${METRICS_TOKEN}`)
        return true;
    res.status(401).json({ error: 'unauthorized' });
    return false;
}
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.json(metrics_1.metrics.snapshot());
});
// Raw alias for backward compatibility with tests expecting /api/metrics/raw
router.get('/raw', (req, res) => {
    res.json(metrics_1.metrics.snapshot());
});
// Phase 10: summarized health snapshot for dashboards / lightweight polling
router.get('/health', (req, res) => {
    const snap = metrics_1.metrics.snapshot();
    const g = snap.gauges;
    const availability5 = g['http.availability.5m_est'];
    const availability30 = g['http.availability.30m_est'];
    const burn = g['http.slo.burn_rate_5m_30m'];
    const budgetRemain = g['http.error_budget.remaining_pct'];
    const authAnom = g['auth.failures.anomaly_score'];
    const errAnom = g['http.errors.5xx.anomaly_score'];
    const latencyAnom = g['http.latency.p95.anomaly_score'];
    const status = (() => {
        if (availability5 < 0.95 || burn > 4)
            return 'critical';
        if (availability5 < 0.98 || burn > 2)
            return 'degraded';
        return 'healthy';
    })();
    res.json({
        generatedAt: new Date().toISOString(),
        status,
        availability5m: availability5,
        availability30m: availability30,
        burnRate5m30m: burn,
        errorBudgetRemainingPct: budgetRemain,
        anomalies: {
            authFailures: authAnom,
            http5xx: errAnom,
            latencyP95: latencyAnom
        }
    });
});
router.get('/prometheus', async (req, res) => {
    if (!requireMetricsAuth(req, res))
        return;
    res.setHeader('Content-Type', 'text/plain');
    const base = metrics_1.metrics.toPrometheus();
    const security = (0, securityMetrics_1.securityMetricsToPrometheus)();
    let advanced = '';
    try {
        advanced = await advancedMetrics_1.advancedRegistry.metrics();
    }
    catch { /* ignore */ }
    res.send([base, security, advanced].filter(Boolean).join('\n'));
});
// Diagnostic: aggregated slow query patterns (not for production scraping; ephemeral)
router.get('/patterns', (req, res) => {
    if (!DIAG_ENABLED)
        return res.status(404).json({ error: 'not_found' });
    const data = (0, queryMonitor_1.getSlowQueryPatternSummary)();
    res.json({ generatedAt: new Date().toISOString(), count: data.length, patterns: data });
});
// Diagnostic: recent slow queries (raw truncated SQL)
router.get('/slow-queries', (req, res) => {
    if (!DIAG_ENABLED)
        return res.status(404).json({ error: 'not_found' });
    const limit = parseInt(req.query.limit || '50', 10);
    res.json({ generatedAt: new Date().toISOString(), queries: (0, queryMonitor_1.getRecentSlowQueries)(limit) });
});
exports.default = router;
