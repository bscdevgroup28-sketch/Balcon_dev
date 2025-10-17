"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = void 0;
exports.metricsMiddleware = metricsMiddleware;
exports.initSentry = initSentry;
const os_1 = __importDefault(require("os"));
const process_1 = __importDefault(require("process"));
const perf_hooks_1 = require("perf_hooks");
const logger_1 = require("../utils/logger");
class MetricsRegistry {
    constructor() {
        this.counters = {};
        this.gauges = {};
        this.histBuckets = {};
        this.histCounts = {};
        this.rollingTracked = {};
        this.rollingTracked30m = {};
        this.rollingWindowMs = 5 * 60 * 1000; // 5 minutes
        this.rollingWindow30mMs = 30 * 60 * 1000; // 30 minutes
        this.startTime = Date.now();
        this.registerGauge('process.uptime_ms', () => Date.now() - this.startTime);
        this.registerGauge('process.memory.rss_mb', () => Math.round(process_1.default.memoryUsage().rss / 1024 / 1024));
        this.registerGauge('process.memory.heap_used_mb', () => Math.round(process_1.default.memoryUsage().heapUsed / 1024 / 1024));
        this.registerGauge('system.load.1m', () => os_1.default.loadavg()[0]);
        this.registerGauge('system.load.5m', () => os_1.default.loadavg()[1]);
        this.registerGauge('system.load.15m', () => os_1.default.loadavg()[2]);
    }
    increment(name, value = 1) {
        this.counters[name] = (this.counters[name] || 0) + value;
        const rt = this.rollingTracked[name];
        if (rt) {
            rt.points.push({ t: Date.now(), v: value });
            // prune old
            const cutoff = Date.now() - this.rollingWindowMs;
            while (rt.points.length && rt.points[0].t < cutoff)
                rt.points.shift();
        }
    }
    registerGauge(name, fn) {
        this.gauges[name] = fn;
    }
    registerHistogram(name, buckets) {
        this.histBuckets[name] = buckets.sort((a, b) => a - b);
        for (const b of buckets)
            this.histCounts[`${name}.le_${b}`] = 0;
        this.histCounts[`${name}.le_inf`] = 0;
    }
    observe(name, value) {
        const buckets = this.histBuckets[name];
        if (!buckets)
            return; // ignore if not registered
        let matched = false;
        for (const b of buckets) {
            if (value <= b) {
                this.histCounts[`${name}.le_${b}`]++;
                matched = true;
            }
        }
        // always increment +Inf bucket
        this.histCounts[`${name}.le_inf`]++;
        if (!matched) {
            // value greater than all buckets; nothing else to do beyond +inf
        }
    }
    snapshot() {
        const gauges = {};
        for (const [k, fn] of Object.entries(this.gauges)) {
            try {
                gauges[k] = fn();
            }
            catch {
                gauges[k] = NaN;
            }
        }
        return {
            timestamp: new Date().toISOString(),
            counters: { ...this.counters },
            gauges,
            hist: { ...this.histCounts },
            meta: {
                pid: process_1.default.pid,
                nodeVersion: process_1.default.version,
                platform: process_1.default.platform,
                memory: process_1.default.memoryUsage(),
            }
        };
    }
    toPrometheus() {
        const lines = [];
        const snap = this.snapshot();
        for (const [k, v] of Object.entries(snap.counters)) {
            lines.push(`# TYPE ${k.replace(/\./g, '_')} counter`);
            lines.push(`${k.replace(/\./g, '_')} ${v}`);
        }
        for (const [k, v] of Object.entries(snap.gauges)) {
            lines.push(`# TYPE ${k.replace(/\./g, '_')} gauge`);
            lines.push(`${k.replace(/\./g, '_')} ${v}`);
        }
        for (const [k, v] of Object.entries(snap.hist)) {
            lines.push(`# TYPE ${k.replace(/\./g, '_')} counter`);
            lines.push(`${k.replace(/\./g, '_')} ${v}`);
        }
        return lines.join('\n');
    }
    trackRolling(name) {
        if (!this.rollingTracked[name])
            this.rollingTracked[name] = { points: [] };
    }
    trackRolling30m(name) {
        if (!this.rollingTracked30m[name])
            this.rollingTracked30m[name] = { points: [] };
    }
    getRollingRatePerMinute(name) {
        const rt = this.rollingTracked[name];
        if (!rt)
            return 0;
        const now = Date.now();
        const cutoff = now - this.rollingWindowMs;
        let sum = 0;
        for (const p of rt.points)
            if (p.t >= cutoff)
                sum += p.v;
        const minutes = this.rollingWindowMs / 60000;
        return sum / minutes;
    }
    getRollingRatePerMinute30m(name) {
        const rt = this.rollingTracked30m[name];
        if (!rt)
            return 0;
        const now = Date.now();
        const cutoff = now - this.rollingWindow30mMs;
        let sum = 0;
        for (const p of rt.points)
            if (p.t >= cutoff)
                sum += p.v;
        const minutes = this.rollingWindow30mMs / 60000;
        return sum / minutes;
    }
}
exports.metrics = new MetricsRegistry();
// Register default histogram(s)
exports.metrics.registerHistogram('jobs.latency.ms', [50, 100, 250, 500, 1000, 2000]);
exports.metrics.registerHistogram('export.duration.ms', [50, 100, 250, 500, 1000, 2000, 5000, 10000]);
// New histogram for webhook delivery latency
exports.metrics.registerHistogram('webhook.delivery.latency.ms', [50, 100, 250, 500, 1000, 2000, 5000, 10000, 30000]);
// DB query latency histogram
exports.metrics.registerHistogram('db.query.duration.ms', [5, 10, 25, 50, 100, 250, 500, 1000, 2000]);
exports.metrics.registerHistogram('db.pool.acquire.wait.ms', [5, 10, 25, 50, 100, 250, 500, 1000, 2000]);
// Deep health endpoint latency histogram (added post Phase 14 readiness review)
exports.metrics.registerHistogram('health.deep.latency.ms', [10, 25, 50, 100, 200, 400, 800, 1600, 3200]);
// Test harness diagnostics (will remain zero in production)
exports.metrics.registerGauge('test.exit.attempts', () => {
    try {
        return global.__testExitAttempts || 0;
    }
    catch {
        return 0;
    }
});
const __latencyAttribution = { total: 0, db: 0, handlers: 0, other: 0, count: 0 };
global.__latencyAttribution = __latencyAttribution;
exports.metrics.registerGauge('latency.attr.sample_count', () => __latencyAttribution.count);
exports.metrics.registerGauge('latency.attr.avg_total_ms', () => __latencyAttribution.count ? __latencyAttribution.total / __latencyAttribution.count : 0);
exports.metrics.registerGauge('latency.attr.db_pct', () => __latencyAttribution.total ? Math.min(100, (__latencyAttribution.db / __latencyAttribution.total) * 100) : 0);
exports.metrics.registerGauge('latency.attr.handlers_pct', () => __latencyAttribution.total ? Math.min(100, (__latencyAttribution.handlers / __latencyAttribution.total) * 100) : 0);
exports.metrics.registerGauge('latency.attr.other_pct', () => __latencyAttribution.total ? Math.min(100, (__latencyAttribution.other / __latencyAttribution.total) * 100) : 0);
// Dynamic token gauges (lazy imports to avoid circulars)
exports.metrics.registerGauge('tokens.refresh.total', () => {
    try {
        const { RefreshToken } = require('../models/RefreshToken');
        return RefreshToken._cacheTotal || 0; // fallback if not updated
    }
    catch {
        return 0;
    }
});
exports.metrics.registerGauge('tokens.refresh.active', () => {
    try {
        const { RefreshToken } = require('../models/RefreshToken');
        return RefreshToken._cacheActive || 0;
    }
    catch {
        return 0;
    }
});
// WebSocket active connections (safe lazy lookup; returns 0 if not initialized)
exports.metrics.registerGauge('ws.connections.active', () => {
    try {
        const { getWebSocketService } = require('../services/webSocketService');
        return getWebSocketService().getConnectedUsersCount();
    }
    catch {
        return 0;
    }
});
// Token cleanup recent run metrics (populated by cleanup scheduler)
exports.metrics.registerGauge('tokens.cleanup.removed_last_run', () => {
    try {
        return global.__tokenCleanup?.removed || 0;
    }
    catch {
        return 0;
    }
});
exports.metrics.registerGauge('tokens.cleanup.last_run_epoch_ms', () => {
    try {
        return global.__tokenCleanup?.lastRun || 0;
    }
    catch {
        return 0;
    }
});
// Gauges for derived metrics
let webhookDelivered = 0;
let webhookFailed = 0;
let authSuccessCount = 0;
let authFailureCount = 0;
exports.metrics.registerGauge('webhooks.failure_rate', () => {
    const total = webhookDelivered + webhookFailed;
    return total > 0 ? webhookFailed / total : 0;
});
exports.metrics.registerGauge('auth.failures.ratio', () => {
    const total = authFailureCount + authSuccessCount;
    return total > 0 ? authFailureCount / total : 0;
});
// Update counters with hooks
const originalIncrement = exports.metrics.increment.bind(exports.metrics);
exports.metrics.increment = (name, value = 1) => {
    originalIncrement(name, value);
    if (name === 'webhooks.delivered')
        webhookDelivered += value;
    if (name === 'webhooks.failed')
        webhookFailed += value;
    if (name === 'auth.success')
        authSuccessCount += value;
    if (name === 'auth.failures')
        authFailureCount += value;
    // Mirror into 30m trackers if enabled
    const rt5 = exports.metrics.rollingTracked?.[name];
    if (rt5) {
        const thirty = exports.metrics.rollingTracked30m;
        if (thirty && !thirty[name])
            thirty[name] = { points: [] };
        if (thirty && thirty[name]) {
            thirty[name].points.push({ t: Date.now(), v: value });
            const cutoff30 = Date.now() - exports.metrics.rollingWindow30mMs;
            while (thirty[name].points.length && thirty[name].points[0].t < cutoff30)
                thirty[name].points.shift();
        }
    }
};
// Track rolling rates for selected counters
exports.metrics.trackRolling('http.errors.5xx');
exports.metrics.trackRolling('db.slow_query.total');
exports.metrics.registerGauge('http.errors.5xx.rate_5m_per_min', () => exports.metrics.getRollingRatePerMinute('http.errors.5xx'));
exports.metrics.registerGauge('db.slow_query.rate_5m_per_min', () => exports.metrics.getRollingRatePerMinute('db.slow_query.total'));
exports.metrics.trackRolling('auth.failures');
exports.metrics.registerGauge('auth.failures.rate_5m_per_min', () => exports.metrics.getRollingRatePerMinute('auth.failures'));
// Phase 8: SLO Support - track request volume for availability calculation
exports.metrics.trackRolling('http.requests.total');
exports.metrics.registerGauge('http.requests.rate_5m_per_min', () => exports.metrics.getRollingRatePerMinute('http.requests.total'));
exports.metrics.registerGauge('http.availability.5m_est', () => {
    const reqRate = exports.metrics.getRollingRatePerMinute('http.requests.total');
    if (reqRate === 0)
        return 1; // assume full availability when no traffic
    const err5xx = exports.metrics.getRollingRatePerMinute('http.errors.5xx');
    const avail = 1 - (err5xx / reqRate);
    return Math.max(0, Math.min(1, avail));
});
exports.metrics.registerGauge('http.error_budget.remaining_pct', () => {
    const target = parseFloat(process_1.default.env.SLO_AVAILABILITY_TARGET || '0.995'); // 99.5% default
    const availability = exports.metrics.snapshot().gauges['http.availability.5m_est'] || 1;
    const budget = 1 - target;
    if (budget <= 0)
        return 0;
    const consumed = 1 - availability;
    const frac = consumed / budget;
    const remaining = 1 - frac;
    return Math.max(0, Math.min(1, remaining)) * 100; // percentage
});
// Phase 9: 30m window & burn rate gauges
exports.metrics.trackRolling30m('http.requests.total');
exports.metrics.trackRolling30m('http.errors.5xx');
exports.metrics.registerGauge('http.requests.rate_30m_per_min', () => exports.metrics.getRollingRatePerMinute30m('http.requests.total'));
exports.metrics.registerGauge('http.errors.5xx.rate_30m_per_min', () => exports.metrics.getRollingRatePerMinute30m('http.errors.5xx'));
exports.metrics.registerGauge('http.availability.30m_est', () => {
    const reqRate = exports.metrics.getRollingRatePerMinute30m('http.requests.total');
    if (reqRate === 0)
        return 1;
    const err5xx = exports.metrics.getRollingRatePerMinute30m('http.errors.5xx');
    return Math.max(0, Math.min(1, 1 - (err5xx / reqRate)));
});
exports.metrics.registerGauge('http.slo.burn_rate_5m_30m', () => {
    const a5 = exports.metrics.snapshot().gauges['http.availability.5m_est'] || 1;
    const a30 = exports.metrics.snapshot().gauges['http.availability.30m_est'] || 1;
    const err5 = 1 - a5;
    const err30 = 1 - a30;
    if (err30 <= 0)
        return 0;
    return err5 / err30; // burn rate ratio
});
exports.metrics.registerGauge('http.slo.burn_rate_budget', () => {
    const target = parseFloat(process_1.default.env.SLO_AVAILABILITY_TARGET || '0.995');
    const a5 = exports.metrics.snapshot().gauges['http.availability.5m_est'] || 1;
    const budget = 1 - target;
    if (budget <= 0)
        return 0;
    return (1 - a5) / budget;
});
// --- HTTP Latency Recent Samples (for percentile + anomaly) ---
const __recentLatencies = [];
const RECENT_LATENCY_MAX = 500;
function recordLatencySample(ms) {
    __recentLatencies.push(ms);
    if (__recentLatencies.length > RECENT_LATENCY_MAX)
        __recentLatencies.shift();
}
function percentile(p) {
    if (!__recentLatencies.length)
        return 0;
    const sorted = [...__recentLatencies].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)));
    return sorted[idx];
}
exports.metrics.registerGauge('http.latency.p50_ms', () => Math.round(percentile(0.5) * 100) / 100);
exports.metrics.registerGauge('http.latency.p95_ms', () => Math.round(percentile(0.95) * 100) / 100);
const ANOMALY_ALPHA = parseFloat(process_1.default.env.ANOMALY_ALPHA || '0.2');
const ANOMALY_LOG_THRESHOLD = parseFloat(process_1.default.env.ANOMALY_LOG_THRESHOLD || '3');
const ANOMALY_LOG_SUPPRESS_MS = parseInt(process_1.default.env.ANOMALY_LOG_SUPPRESS_MS || '60000', 10); // default: 60s
const anomalyTargets = {
    'auth.failures': { initialized: false, mean: 0, var: 0, lastScore: 0 },
    'http.errors.5xx': { initialized: false, mean: 0, var: 0, lastScore: 0 },
    // latency p95 anomaly monitors upward spikes in p95 latency
    'http.latency.p95': { initialized: false, mean: 0, var: 0, lastScore: 0 }
};
const anomalyLastLog = {};
function updateAnomaly(key) {
    const st = anomalyTargets[key];
    if (!st)
        return 0;
    const now = Date.now();
    // For latency we use direct p95 gauge value; for others use rolling rate
    const measurement = key === 'http.latency.p95' ? percentile(0.95) : exports.metrics.getRollingRatePerMinute(key);
    if (!st.initialized) {
        st.mean = measurement;
        st.var = 0; // no variance yet
        st.initialized = true;
        st.lastScore = 0;
        return 0;
    }
    const diff = measurement - st.mean;
    const prevMean = st.mean;
    const prevVar = st.var;
    // Compute z-score against previous baseline before updating (reactive spike detection)
    let score = 0;
    if (prevVar > 1e-9) {
        const std = Math.sqrt(prevVar);
        score = std > 0 ? diff / std : 0;
    }
    else if (prevMean !== 0) {
        // fallback ratio-based if variance not yet established
        score = diff / (Math.abs(prevMean) || 1);
    }
    else {
        score = 0;
    }
    // Clamp negative scores to 0 (focus on upward anomalies)
    if (score < 0)
        score = 0;
    st.lastScore = score;
    // Opportunistic structured log once per suppression window when threshold crossed
    if (score >= ANOMALY_LOG_THRESHOLD) {
        const last = anomalyLastLog[key] || 0;
        if (now - last >= ANOMALY_LOG_SUPPRESS_MS) {
            anomalyLastLog[key] = now;
            logger_1.logger.warn(`[anomaly] ${key} anomaly_score=${score.toFixed(2)} value=${measurement.toFixed(2)} mean=${prevMean.toFixed(2)} var=${prevVar.toExponential(2)}`);
        }
    }
    // Update EMA baseline & variance approximation after scoring
    st.mean = prevMean + ANOMALY_ALPHA * diff;
    // Exponential moving variance approximation (very lightweight)
    const dev = measurement - st.mean; // deviation from updated mean
    st.var = (1 - ANOMALY_ALPHA) * (prevVar + ANOMALY_ALPHA * diff * diff) + ANOMALY_ALPHA * dev * dev * 0.01;
    return score;
}
exports.metrics.registerGauge('auth.failures.anomaly_score', () => updateAnomaly('auth.failures'));
exports.metrics.registerGauge('http.errors.5xx.anomaly_score', () => updateAnomaly('http.errors.5xx'));
exports.metrics.registerGauge('http.latency.p95.anomaly_score', () => updateAnomaly('http.latency.p95'));
// Pre-register commonly monitored counters so they appear in baseline schema immediately
['http.requests.total', 'http.errors.total', 'http.errors.5xx', 'http.errors.429', 'auth.success', 'auth.failures', 'exports.completed', 'exports.failed', 'webhooks.delivered', 'webhooks.failed', 'db.slow_query.total', 'tokens.cleanup.runs', 'tokens.cleanup.removed'].forEach(c => exports.metrics.increment(c, 0));
// Event loop delay instrumentation
let eld = null;
try {
    eld = (0, perf_hooks_1.monitorEventLoopDelay)({ resolution: 20 });
    eld.enable();
    exports.metrics.registerGauge('event_loop.delay.mean_ms', () => eld ? Math.round((eld.mean / 1000000) * 100) / 100 : 0);
    exports.metrics.registerGauge('event_loop.delay.p95_ms', () => eld ? Math.round((eld.percentile(95) / 1000000) * 100) / 100 : 0);
}
catch { /* ignore if not supported */ }
// Simple middleware to count requests and track latency buckets
function metricsMiddleware(req, res, next) {
    const start = process_1.default.hrtime.bigint();
    exports.metrics.increment('http.requests.total');
    res.on('finish', () => {
        const ms = Number(process_1.default.hrtime.bigint() - start) / 1000000;
        recordLatencySample(ms);
        if (process_1.default.env.DISABLE_HTTP_STATUS_CODE_METRICS !== 'true') {
            exports.metrics.increment(`http.response.status.${res.statusCode}`);
        }
        // Aggregate error counters (alert-friendly)
        if (res.statusCode >= 400)
            exports.metrics.increment('http.errors.total');
        if (res.statusCode >= 500 && res.statusCode < 600)
            exports.metrics.increment('http.errors.5xx');
        if (res.statusCode === 429)
            exports.metrics.increment('http.errors.429');
        const cls = Math.floor(res.statusCode / 100);
        if (cls >= 1 && cls <= 5)
            exports.metrics.increment(`http.response.status_class.${cls}xx`);
        if (ms < 100)
            exports.metrics.increment('http.latency.lt_100ms');
        else if (ms < 300)
            exports.metrics.increment('http.latency.lt_300ms');
        else if (ms < 1000)
            exports.metrics.increment('http.latency.lt_1000ms');
        else
            exports.metrics.increment('http.latency.ge_1000ms');
    });
    next();
}
// Phase 9: Forecast residual gauges placeholder (extend later)
['quotesSent', 'quotesAccepted', 'ordersCreated', 'ordersDelivered', 'inventoryNetChange']
    .forEach(m => exports.metrics.registerGauge(`analytics.forecast.residual.${m}`, () => {
    try {
        return global.__residualCache?.[m] ?? 0;
    }
    catch {
        return 0;
    }
}));
// Phase 11: Residual anomaly score gauges (populated by analytics:residuals:anom:update)
['quotesSent', 'quotesAccepted', 'ordersCreated', 'ordersDelivered', 'inventoryNetChange']
    .forEach(m => exports.metrics.registerGauge(`analytics.forecast.residual_anom_score.${m}`, () => {
    try {
        return global.__residualAnomCache?.[m] ?? 0;
    }
    catch {
        return 0;
    }
}));
// Phase 12: Adaptive residual deviation gauges (difference vs dynamic upper bound)
['quotesSent', 'quotesAccepted', 'ordersCreated', 'ordersDelivered', 'inventoryNetChange']
    .forEach(m => exports.metrics.registerGauge(`analytics.forecast.residual_dev_pct.${m}`, () => {
    try {
        const thresholds = global.__residualAdaptiveThresholds; // { metrics: { m: { mean,std,upper,lower } } }
        const residuals = global.__residualCache; // latest residual values
        if (!thresholds?.metrics?.[m] || !thresholds.metrics[m].ready)
            return 0;
        const mean = thresholds.metrics[m].mean;
        const val = residuals?.[m];
        if (typeof val !== 'number')
            return 0;
        if (mean === 0)
            return 0;
        return ((val - mean) / Math.abs(mean)) * 100; // percent deviation
    }
    catch {
        return 0;
    }
}));
// Phase 11: Capacity derived gauges (populated by capacity:update scripts)
exports.metrics.registerGauge('capacity.max_rps', () => {
    try {
        return global.__capacityCache?.maxRps ?? 0;
    }
    catch {
        return 0;
    }
});
exports.metrics.registerGauge('capacity.optimal_connections', () => {
    try {
        return global.__capacityCache?.optimalConnections ?? 0;
    }
    catch {
        return 0;
    }
});
exports.metrics.registerGauge('capacity.scale_suggestion_code', () => {
    try {
        return global.__capacityCache?.suggestionCode ?? 0;
    }
    catch {
        return 0;
    }
});
// Phase 13: Predictive scaling advisory gauges
exports.metrics.registerGauge('scaling.headroom.rps_pct', () => {
    try {
        const cap = global.__capacityCache?.maxRps;
        if (!cap || cap <= 0)
            return 0;
        // current request rate per second derived from 5m per-minute gauge
        const snap = exports.metrics.snapshot();
        const perMin = snap.gauges['http.requests.rate_5m_per_min'] || 0;
        const currentRps = perMin / 60;
        const remaining = Math.max(0, cap - currentRps);
        return Math.max(0, Math.min(100, (remaining / cap) * 100));
    }
    catch {
        return 0;
    }
});
exports.metrics.registerGauge('scaling.scale_trigger_threshold_rps', () => {
    try {
        const cap = global.__capacityCache?.maxRps;
        if (!cap || cap <= 0)
            return 0;
        return cap * 0.8; // threshold to begin scale planning
    }
    catch {
        return 0;
    }
});
exports.metrics.registerGauge('scaling.advice.code', () => {
    try {
        const snap = exports.metrics.snapshot();
        const headroom = snap.gauges['scaling.headroom.rps_pct'] || 0;
        const burnBudget = snap.gauges['http.slo.burn_rate_budget'] || 0;
        const burnRatio = snap.gauges['http.slo.burn_rate_5m_30m'] || 0;
        let code = 0; // 0=no action,1=monitor,2=scale soon,3=scale now
        if (headroom < 5 || burnBudget > 1.2)
            code = 3;
        else if (headroom < 15 || burnRatio > 2)
            code = 2;
        else if (headroom < 30)
            code = 1;
        return code;
    }
    catch {
        return 0;
    }
});
exports.metrics.registerGauge('scaling.advice.reason_code', () => {
    try {
        const snap = exports.metrics.snapshot();
        const headroom = snap.gauges['scaling.headroom.rps_pct'] || 0;
        const burnBudget = snap.gauges['http.slo.burn_rate_budget'] || 0;
        const burnRatio = snap.gauges['http.slo.burn_rate_5m_30m'] || 0;
        // 0=none,1=headroom_low,2=burn_budget_exceeded,3=burn_ratio_high,4=headroom_and_burn,5=headroom_and_budget
        if (headroom < 5 && burnBudget > 1.2)
            return 5;
        if (headroom < 5 && burnRatio > 2)
            return 4;
        if (burnBudget > 1.2)
            return 2;
        if (burnRatio > 2)
            return 3;
        if (headroom < 30)
            return 1;
        return 0;
    }
    catch {
        return 0;
    }
});
exports.metrics.registerGauge('scaling.forecast.max_rps_next', () => {
    try {
        const cap = global.__capacityCache?.maxRps;
        if (!cap || cap <= 0)
            return 0;
        // Use residual anomaly score (ordersCreated) as a simplistic growth proxy
        const score = global.__residualAnomCache?.['ordersCreated'] || 0;
        const growthFactor = 1 + 0.05 * Math.min(5, Math.max(0, score)); // up to +25%
        return cap * growthFactor;
    }
    catch {
        return 0;
    }
});
// Optional Sentry integration wrapper
function initSentry(logger) {
    const dsn = process_1.default.env.SENTRY_DSN;
    if (!dsn) {
        logger.info('[monitoring] SENTRY_DSN not set; skipping Sentry init');
        return;
    }
    try {
        // Lazy import to avoid dependency if not installed
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Sentry = require('@sentry/node');
        const config = {
            dsn,
            tracesSampleRate: parseFloat(process_1.default.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
            environment: process_1.default.env.NODE_ENV || 'development'
        };
        if (process_1.default.env.SENTRY_RELEASE)
            config.release = process_1.default.env.SENTRY_RELEASE;
        Sentry.init(config);
        logger.info('[monitoring] Sentry initialized');
    }
    catch (err) {
        logger.warn('[monitoring] Failed to initialize Sentry (is @sentry/node installed?)');
    }
}
const CARDINALITY_GROUPS = [
    // Slow query pattern counters: db.slow_query.pattern.<hash>
    { pattern: /^db\.slow_query\.pattern\./, name: 'db.slow_query.pattern', soft: parseInt(process_1.default.env.CARD_SOFT_DB_SLOW_PATTERN || '50', 10), hard: parseInt(process_1.default.env.CARD_HARD_DB_SLOW_PATTERN || '200', 10) },
    // HTTP status codes (optional governance if status code metrics enabled)
    { pattern: /^http\.response\.status\./, name: 'http.response.status', soft: parseInt(process_1.default.env.CARD_SOFT_HTTP_STATUS || '120', 10), hard: parseInt(process_1.default.env.CARD_HARD_HTTP_STATUS || '512', 10) },
    // Per-status-class (low cardinality – track but high budgets)
    { pattern: /^http\.response\.status_class\./, name: 'http.response.status_class', soft: 10, hard: 30 },
    // Pattern for future dynamic domain events (placeholder)
    { pattern: /^events\.dynamic\./, name: 'events.dynamic', soft: parseInt(process_1.default.env.CARD_SOFT_EVENTS_DYNAMIC || '100', 10), hard: parseInt(process_1.default.env.CARD_HARD_EVENTS_DYNAMIC || '400', 10) },
];
const cardinalityState = {};
for (const g of CARDINALITY_GROUPS) {
    cardinalityState[g.name] = { distinct: new Set(), added5m: [], warnRaised: false, hardRaised: false };
}
// Wrap registry increment to observe dynamic names (only counters; hist buckets already expand deterministically)
const _origIncrementForCard = exports.metrics.increment.bind(exports.metrics);
exports.metrics.increment = (name, value = 1) => {
    _origIncrementForCard(name, value);
    try {
        for (const g of CARDINALITY_GROUPS) {
            if (g.pattern.test(name)) {
                const st = cardinalityState[g.name];
                if (!st.distinct.has(name)) {
                    st.distinct.add(name);
                    st.added5m.push({ t: Date.now(), name });
                }
                break;
            }
        }
    }
    catch { /* ignore governance errors */ }
};
function sweepCardinalityWindows() {
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const g of CARDINALITY_GROUPS) {
        const st = cardinalityState[g.name];
        while (st.added5m.length && st.added5m[0].t < cutoff)
            st.added5m.shift();
    }
}
setInterval(sweepCardinalityWindows, 30000).unref?.();
// Gauges per group
for (const g of CARDINALITY_GROUPS) {
    exports.metrics.registerGauge(`cardinality.${g.name}.series_total`, () => cardinalityState[g.name].distinct.size);
    exports.metrics.registerGauge(`cardinality.${g.name}.series_added_5m`, () => {
        sweepCardinalityWindows();
        return cardinalityState[g.name].added5m.length;
    });
    exports.metrics.registerGauge(`cardinality.${g.name}.soft_budget`, () => g.soft);
    exports.metrics.registerGauge(`cardinality.${g.name}.hard_budget`, () => g.hard);
    exports.metrics.registerGauge(`cardinality.${g.name}.budget_utilization_pct`, () => {
        const used = cardinalityState[g.name].distinct.size;
        return g.hard > 0 ? Math.min(100, (used / g.hard) * 100) : 0;
    });
    exports.metrics.registerGauge(`cardinality.${g.name}.violation_level`, () => {
        const used = cardinalityState[g.name].distinct.size;
        if (used >= g.hard)
            return 2; // hard
        if (used >= g.soft)
            return 1; // soft
        return 0; // ok
    });
}
// Aggregate governance summary gauges
exports.metrics.registerGauge('cardinality.governance.groups_with_soft_violations', () => CARDINALITY_GROUPS.filter(g => {
    const used = cardinalityState[g.name].distinct.size;
    return used >= g.soft && used < g.hard;
}).length);
exports.metrics.registerGauge('cardinality.governance.groups_with_hard_violations', () => CARDINALITY_GROUPS.filter(g => cardinalityState[g.name].distinct.size >= g.hard).length);
exports.metrics.registerGauge('cardinality.governance.groups_total', () => CARDINALITY_GROUPS.length);
// Lightweight logging (rate-limited) when crossing budgets
let lastGovLog = 0;
const GOV_LOG_SUPPRESS_MS = parseInt(process_1.default.env.CARD_GOV_LOG_SUPPRESS_MS || '60000', 10);
setInterval(() => {
    const now = Date.now();
    if (now - lastGovLog < GOV_LOG_SUPPRESS_MS)
        return;
    let emitted = false;
    for (const g of CARDINALITY_GROUPS) {
        const st = cardinalityState[g.name];
        const used = st.distinct.size;
        if (!st.hardRaised && used >= g.hard) {
            logger_1.logger.error('[cardinality] HARD budget exceeded', { group: g.name, used, hard: g.hard });
            st.hardRaised = true;
            emitted = true;
        }
        else if (!st.warnRaised && used >= g.soft) {
            logger_1.logger.warn('[cardinality] Soft budget reached', { group: g.name, used, soft: g.soft, hard: g.hard });
            st.warnRaised = true;
            emitted = true;
        }
    }
    if (emitted)
        lastGovLog = now;
}, 15000).unref?.();
// NOTE: Baseline schema should include these new gauges; update baseline.json accordingly when committing Phase 18.
