"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const cache_1 = require("../utils/cache");
const crypto_1 = __importDefault(require("crypto"));
const json2csv_1 = require("json2csv");
const authEnhanced_1 = require("../middleware/authEnhanced");
const metrics_1 = require("../monitoring/metrics");
// New cache keys for Phase 7 endpoints
const trendCacheKey = (range) => `analytics:trends:${range}`;
const distributionCacheKey = (field) => `analytics:distribution:${field}`;
function computeEtag(obj) {
    return crypto_1.default.createHash('sha1').update(JSON.stringify(obj)).digest('hex');
}
const router = (0, express_1.Router)();
const csvRateWindows = {};
function csvRateLimit(req, res, next) {
    const limit = parseInt(process.env.ANALYTICS_CSV_RATE_LIMIT_PER_MIN || '30');
    if (limit <= 0)
        return next(); // disabled
    const key = req.user?.id ? `u:${req.user.id}` : `ip:${req.ip}`;
    const now = Date.now();
    const minute = 60000;
    let entry = csvRateWindows[key];
    if (!entry || (now - entry.windowStart) >= minute) {
        entry = { count: 0, windowStart: now };
        csvRateWindows[key] = entry;
    }
    if (entry.count >= limit) {
        metrics_1.metrics.increment('analytics.csv.ratelimit.exceeded');
        return res.status(429).json({ error: 'RateLimit', message: 'CSV export rate limit exceeded' });
    }
    entry.count++;
    metrics_1.metrics.increment('analytics.csv.export.allowed');
    next();
}
// GET /api/analytics/summary - latest KPI snapshot (simple first version)
router.get('/summary', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        const ttlMs = parseInt(process.env.CACHE_TTL_ANALYTICS_SUMMARY_MS || '60000');
        const payload = await (0, cache_1.withCache)(cache_1.cacheKeys.analyticsSummary, ttlMs, async () => {
            const latest = await models_1.KpiDailySnapshot.findOne({ order: [['date', 'DESC']] });
            return { data: latest, generatedAt: new Date().toISOString() };
        }, [cache_1.cacheTags.analytics]);
        const etag = crypto_1.default.createHash('sha1').update(JSON.stringify(payload.data || null) + payload.generatedAt).digest('hex');
        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
        }
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'public, max-age=30');
        res.json(payload);
    }
    catch (err) {
        logger_1.logger.error('Failed to fetch KPI summary', err);
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to load KPI summary' });
    }
});
// GET /api/analytics/trends?range=30d|90d|365d (defaults 30d)
router.get('/trends', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        const range = req.query.range || '30d';
        const days = range === '90d' ? 90 : range === '365d' ? 365 : 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        const ttlMs = parseInt(process.env.CACHE_TTL_ANALYTICS_TRENDS_MS || '60000');
        const payload = await (0, cache_1.withCache)(trendCacheKey(range), ttlMs, async () => {
            const snapshots = await models_1.KpiDailySnapshot.findAll({
                where: { date: { $gte: since } },
                order: [['date', 'ASC']]
            });
            // Compute trend arrays with rolling averages (7-day simple) and deltas
            const series = snapshots.map((s, idx) => {
                const start = Math.max(0, idx - 6);
                const window = snapshots.slice(start, idx + 1);
                const roll = (field) => {
                    const sum = window.reduce((a, b) => a + b[field], 0);
                    return sum / window.length;
                };
                const prev = snapshots[idx - 1];
                const delta = (field) => prev ? (Number(s[field]) - Number(prev[field])) : 0;
                return {
                    date: s.date,
                    quotesSent: s.quotesSent,
                    quotesAccepted: s.quotesAccepted,
                    quoteConversionRate: s.quoteConversionRate,
                    ordersCreated: s.ordersCreated,
                    ordersDelivered: s.ordersDelivered,
                    avgOrderCycleDays: s.avgOrderCycleDays,
                    inventoryNetChange: s.inventoryNetChange,
                    rolling: {
                        quotesSent: roll('quotesSent'),
                        quotesAccepted: roll('quotesAccepted'),
                        ordersCreated: roll('ordersCreated'),
                        ordersDelivered: roll('ordersDelivered'),
                        inventoryNetChange: roll('inventoryNetChange')
                    },
                    delta: {
                        quotesSent: delta('quotesSent'),
                        quotesAccepted: delta('quotesAccepted'),
                        ordersCreated: delta('ordersCreated'),
                        ordersDelivered: delta('ordersDelivered'),
                        inventoryNetChange: delta('inventoryNetChange')
                    }
                };
            });
            return { range, points: series, generatedAt: new Date().toISOString() };
        }, [cache_1.cacheTags.analytics]);
        const etag = computeEtag(payload);
        if (req.headers['if-none-match'] === etag)
            return res.status(304).end();
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'public, max-age=30');
        res.json(payload);
        metrics_1.metrics.increment('analytics.trends.served');
    }
    catch (err) {
        logger_1.logger.error('Failed to fetch analytics trends', err);
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to load trends' });
    }
});
// GET /api/analytics/distribution/materials?field=category|status (default category)
router.get('/distribution/materials', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        const field = req.query.field || 'category';
        if (!['category', 'status'].includes(field)) {
            return res.status(400).json({ error: 'BadRequest', message: 'Unsupported field' });
        }
        const ttlMs = parseInt(process.env.CACHE_TTL_ANALYTICS_DISTRIBUTION_MS || '60000');
        const payload = await (0, cache_1.withCache)(distributionCacheKey(`materials:${field}`), ttlMs, async () => {
            const rows = await models_1.Material.findAll({ attributes: [field] });
            const counts = {};
            rows.forEach(r => {
                const v = r[field] || 'unknown';
                counts[v] = (counts[v] || 0) + 1;
            });
            return { field, counts, total: rows.length, generatedAt: new Date().toISOString() };
        }, [cache_1.cacheTags.analytics]);
        const etag = computeEtag(payload);
        if (req.headers['if-none-match'] === etag)
            return res.status(304).end();
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.json(payload);
        metrics_1.metrics.increment('analytics.distribution.served');
    }
    catch (err) {
        logger_1.logger.error('Failed to fetch materials distribution', err);
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to load distribution' });
    }
});
// CSV export for trends
router.get('/trends.csv', authEnhanced_1.authenticateToken, csvRateLimit, async (req, res) => {
    try {
        const range = req.query.range || '30d';
        const days = range === '90d' ? 90 : range === '365d' ? 365 : 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        const snapshots = await models_1.KpiDailySnapshot.findAll({
            where: { date: { $gte: since } },
            order: [['date', 'ASC']]
        });
        const rows = snapshots.map(s => ({
            date: s.date,
            quotesSent: s.quotesSent,
            quotesAccepted: s.quotesAccepted,
            quoteConversionRate: s.quoteConversionRate,
            ordersCreated: s.ordersCreated,
            ordersDelivered: s.ordersDelivered,
            avgOrderCycleDays: s.avgOrderCycleDays,
            inventoryNetChange: s.inventoryNetChange
        }));
        const parser = new json2csv_1.Parser({ fields: Object.keys(rows[0] || { date: '', quotesSent: '' }) });
        const csv = parser.parse(rows);
        const etag = computeEtag(rows);
        res.setHeader('ETag', etag);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.attachment(`analytics-trends-${range}.csv`);
        res.send(csv);
        metrics_1.metrics.increment('analytics.trends.csv.served');
    }
    catch (err) {
        logger_1.logger.error('Failed to export trends CSV', err);
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to export trends CSV' });
    }
});
// CSV export for material distribution
router.get('/distribution/materials.csv', authEnhanced_1.authenticateToken, csvRateLimit, async (req, res) => {
    try {
        const field = req.query.field || 'category';
        if (!['category', 'status'].includes(field)) {
            return res.status(400).json({ error: 'BadRequest', message: 'Unsupported field' });
        }
        const rows = await models_1.Material.findAll({ attributes: [field] });
        const counts = {};
        rows.forEach(r => {
            const v = r[field] || 'unknown';
            counts[v] = (counts[v] || 0) + 1;
        });
        const csvRows = Object.entries(counts).map(([value, count]) => ({ value, count }));
        const parser = new json2csv_1.Parser({ fields: ['value', 'count'] });
        const csv = parser.parse(csvRows);
        const etag = computeEtag(csvRows);
        res.setHeader('ETag', etag);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Cache-Control', 'public, max-age=120');
        res.attachment(`materials-distribution-${field}.csv`);
        res.send(csv);
        metrics_1.metrics.increment('analytics.distribution.csv.served');
    }
    catch (err) {
        logger_1.logger.error('Failed to export materials distribution CSV', err);
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to export distribution CSV' });
    }
});
exports.default = router;
// ------------------ Phase 8: Anomalies Endpoint ------------------
// GET /api/analytics/anomalies?range=30d|90d (default 30d)
// Simple rolling z-score detection across KPI metrics
router.get('/anomalies', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        const range = req.query.range || '30d';
        const days = range === '90d' ? 90 : 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        const ttlMs = parseInt(process.env.CACHE_TTL_ANALYTICS_ANOMALIES_MS || '60000');
        const key = `analytics:anomalies:${range}`;
        const thresholdParam = req.query.threshold ? parseFloat(String(req.query.threshold)) : undefined;
        const payload = await (0, cache_1.withCache)(key + (thresholdParam ? `:th${thresholdParam}` : ''), ttlMs, async () => {
            const snapshots = await models_1.KpiDailySnapshot.findAll({
                where: { date: { $gte: since } },
                order: [['date', 'ASC']]
            });
            const metricsList = ['quotesSent', 'quotesAccepted', 'ordersCreated', 'ordersDelivered', 'inventoryNetChange'];
            const result = { range, metrics: {}, generatedAt: new Date().toISOString() };
            const zThreshold = thresholdParam || parseFloat(process.env.ANALYTICS_ANOMALY_Z_THRESHOLD || '2.5');
            for (const m of metricsList) {
                const values = snapshots.map(s => Number(s[m]));
                const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1);
                const variance = values.length > 1 ? values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1) : 0;
                const stdDev = Math.sqrt(variance);
                const anomalies = [];
                if (stdDev > 0) {
                    snapshots.forEach(s => {
                        const v = Number(s[m]);
                        const z = (v - mean) / stdDev;
                        if (Math.abs(z) >= zThreshold)
                            anomalies.push({ date: s.date, value: v, zScore: +z.toFixed(3) });
                    });
                }
                // Fallback percentile-based anomalies if none found via z-score
                if (anomalies.length === 0 && values.length >= 5) {
                    const sorted = [...values].sort((a, b) => a - b);
                    const idx95 = Math.floor(sorted.length * 0.95);
                    const p95 = sorted[idx95];
                    const p05 = sorted[Math.floor(sorted.length * 0.05)];
                    snapshots.forEach(s => {
                        const v = Number(s[m]);
                        if (v >= p95 || v <= p05) {
                            anomalies.push({ date: s.date, value: v, zScore: stdDev > 0 ? +(((v - mean) / stdDev).toFixed(3)) : 0 });
                        }
                    });
                }
                // Final fallback: always mark max value as anomaly if still none (ensures visibility)
                if (anomalies.length === 0 && values.length) {
                    let maxVal = -Infinity;
                    let maxSnap = null;
                    snapshots.forEach(s => { const v = Number(s[m]); if (v > maxVal) {
                        maxVal = v;
                        maxSnap = s;
                    } });
                    if (maxSnap)
                        anomalies.push({ date: maxSnap.date, value: maxVal, zScore: stdDev > 0 ? +(((maxVal - mean) / stdDev).toFixed(3)) : 0, fallback: true });
                }
                result.metrics[m] = { mean, stdDev, anomalies, latest: values[values.length - 1] };
            }
            return result;
        }, [cache_1.cacheTags.analytics]);
        const etag = computeEtag(payload);
        if (req.headers['if-none-match'] === etag)
            return res.status(304).end();
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'public, max-age=30');
        res.json(payload);
        metrics_1.metrics.increment('analytics.anomalies.served');
    }
    catch (err) {
        logger_1.logger.error('Failed to compute anomalies', err);
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to load anomalies' });
    }
});
// ------------------ Phase 7: Simple Forecast Endpoint ------------------
// GET /api/analytics/forecast?metric=ordersCreated&horizon=14
// Provides naive mean + linear trend extrapolation forecast (very lightweight placeholder)
router.get('/forecast', authEnhanced_1.authenticateToken, async (req, res) => {
    try {
        const metric = req.query.metric || 'ordersCreated';
        const horizon = Math.min(parseInt(req.query.horizon || '14', 10), 60);
        const allowed = ['quotesSent', 'quotesAccepted', 'ordersCreated', 'ordersDelivered', 'inventoryNetChange'];
        if (!allowed.includes(metric)) {
            return res.status(400).json({ error: 'BadRequest', message: 'Unsupported metric' });
        }
        const daysBack = Math.max(horizon * 2, 30); // lookback at least 30 days or 2x horizon
        const since = new Date();
        since.setDate(since.getDate() - daysBack);
        const cacheKey = `analytics:forecast:${metric}:${horizon}`;
        const ttlMs = parseInt(process.env.CACHE_TTL_ANALYTICS_FORECAST_MS || '60000');
        const payload = await (0, cache_1.withCache)(cacheKey, ttlMs, async () => {
            const snapshots = await models_1.KpiDailySnapshot.findAll({
                where: { date: { $gte: since } },
                order: [['date', 'ASC']]
            });
            const values = snapshots.map(s => Number(s[metric] || 0));
            const dates = snapshots.map(s => s.date);
            const n = values.length;
            if (!n)
                return { metric, horizon, forecasts: [], generatedAt: new Date().toISOString(), method: 'naive' };
            const mean = values.reduce((a, b) => a + b, 0) / n;
            // Simple linear regression y = a + b*t (t=0..n-1)
            let num = 0;
            let den = 0;
            const tMean = (n - 1) / 2;
            for (let i = 0; i < n; i++) {
                const t = i;
                num += (t - tMean) * (values[i] - mean);
                den += (t - tMean) * (t - tMean);
            }
            const slope = den === 0 ? 0 : num / den;
            const intercept = mean - slope * tMean;
            const lastDate = dates[dates.length - 1];
            const forecasts = [];
            for (let h = 1; h <= horizon; h++) {
                const tFuture = n - 1 + h;
                const pred = intercept + slope * tFuture;
                const futureDate = new Date(lastDate.getTime());
                futureDate.setDate(futureDate.getDate() + h);
                forecasts.push({ date: futureDate.toISOString().slice(0, 10), value: Math.max(0, Math.round(pred)) });
            }
            return { metric, horizon, mean, slope, method: 'naive_linear', sample: n, forecasts, lastHistorical: lastDate.toISOString().slice(0, 10), generatedAt: new Date().toISOString() };
        }, [cache_1.cacheTags.analytics]);
        metrics_1.metrics.increment('analytics.forecast.served');
        res.json(payload);
    }
    catch (err) {
        metrics_1.metrics.increment('analytics.forecast.error');
        logger_1.logger.error('Failed to compute forecast', err);
        res.status(500).json({ error: 'Internal Server Error', message: 'Failed to compute forecast' });
    }
});
