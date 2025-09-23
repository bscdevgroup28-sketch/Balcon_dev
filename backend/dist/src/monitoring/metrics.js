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
class MetricsRegistry {
    constructor() {
        this.counters = {};
        this.gauges = {};
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
    }
    registerGauge(name, fn) {
        this.gauges[name] = fn;
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
        return lines.join('\n');
    }
}
exports.metrics = new MetricsRegistry();
// Simple middleware to count requests and track latency buckets
function metricsMiddleware(req, res, next) {
    const start = process_1.default.hrtime.bigint();
    exports.metrics.increment('http.requests.total');
    res.on('finish', () => {
        const ms = Number(process_1.default.hrtime.bigint() - start) / 1000000;
        exports.metrics.increment(`http.response.status.${res.statusCode}`);
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
        Sentry.init({
            dsn,
            tracesSampleRate: parseFloat(process_1.default.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
            environment: process_1.default.env.NODE_ENV || 'development'
        });
        logger.info('[monitoring] Sentry initialized');
    }
    catch (err) {
        logger.warn('[monitoring] Failed to initialize Sentry (is @sentry/node installed?)');
    }
}
