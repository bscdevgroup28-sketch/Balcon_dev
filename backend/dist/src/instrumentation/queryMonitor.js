"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentSlowQueries = getRecentSlowQueries;
exports.getSlowQueryPatternSummary = getSlowQueryPatternSummary;
exports.installQueryMonitor = installQueryMonitor;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const metrics_1 = require("../monitoring/metrics");
// Lazy import inside function for latency attribution helpers to avoid circulars if any
const crypto_1 = __importDefault(require("crypto"));
const cardinality_1 = require("../monitoring/cardinality");
// Configuration via env
const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.DB_SLOW_QUERY_THRESHOLD_MS || '500', 10);
const ENABLE_QUERY_LOGGING = (process.env.DB_QUERY_LOGGING || '').toLowerCase() === 'true' || process.env.NODE_ENV === 'production';
let patched = false;
const SLOW_QUERY_BUFFER_MAX = 200;
const slowQueryBuffer = [];
function getRecentSlowQueries(limit = 50) {
    return slowQueryBuffer.slice(-limit).reverse();
}
function getSlowQueryPatternSummary() {
    const agg = {};
    for (const rec of slowQueryBuffer) {
        if (!agg[rec.pattern])
            agg[rec.pattern] = { count: 0, maxMs: 0, lastMs: 0 };
        const a = agg[rec.pattern];
        a.count += 1;
        if (rec.durationMs > a.maxMs)
            a.maxMs = rec.durationMs;
        a.lastMs = rec.durationMs;
    }
    return Object.entries(agg).map(([pattern, v]) => ({ pattern, ...v })).sort((a, b) => b.count - a.count).slice(0, 100);
}
function installQueryMonitor() {
    if (patched)
        return;
    patched = true;
    // Patch pool acquisition timing (best-effort internal API usage)
    try {
        const connectionManager = database_1.sequelize.connectionManager;
        if (connectionManager && connectionManager.getConnection) {
            const originalGet = connectionManager.getConnection.bind(connectionManager);
            connectionManager.getConnection = async function patchedGetConnection(...args) {
                const startWait = process.hrtime.bigint();
                const conn = await originalGet(...args);
                const waitMs = Number(process.hrtime.bigint() - startWait) / 1000000;
                metrics_1.metrics.observe('db.pool.acquire.wait.ms', waitMs);
                if (waitMs > 250) {
                    try {
                        const { getRequestContext } = require('../utils/requestContext');
                        const ctx = getRequestContext();
                        logger_1.logger.warn('[db] slow pool acquire', { waitMs: waitMs.toFixed(2), requestId: ctx?.requestId });
                    }
                    catch {
                        logger_1.logger.warn('[db] slow pool acquire', { waitMs: waitMs.toFixed(2) });
                    }
                }
                return conn;
            };
            // Register lightweight pool gauges (Postgres only; skip for sqlite which may not expose internals similarly)
            try {
                metrics_1.metrics.registerGauge('db.pool.in_use', () => {
                    try {
                        return connectionManager.pool?.used || 0;
                    }
                    catch {
                        return 0;
                    }
                });
                metrics_1.metrics.registerGauge('db.pool.free', () => {
                    try {
                        return connectionManager.pool?.free || 0;
                    }
                    catch {
                        return 0;
                    }
                });
                metrics_1.metrics.registerGauge('db.pool.pending_acquires', () => {
                    try {
                        return connectionManager.pool?._factory?.pending || connectionManager.pool?.pending || 0;
                    }
                    catch {
                        return 0;
                    }
                });
                metrics_1.metrics.registerGauge('db.pool.size_configured', () => {
                    try {
                        return connectionManager.pool?.max || 0;
                    }
                    catch {
                        return 0;
                    }
                });
                metrics_1.metrics.registerGauge('db.pool.utilization_ratio', () => {
                    try {
                        const used = connectionManager.pool?.used || 0;
                        const max = connectionManager.pool?.max || 0;
                        return max > 0 ? used / max : 0;
                    }
                    catch {
                        return 0;
                    }
                });
            }
            catch { /* ignore gauge registration issues */ }
        }
    }
    catch { /* ignore pool instrumentation errors */ }
    const origQuery = database_1.sequelize.query.bind(database_1.sequelize);
    database_1.sequelize.query = async function patchedQuery(sql, options) {
        const start = process.hrtime.bigint();
        let error = null;
        try {
            const result = await origQuery(sql, options);
            return result;
        }
        catch (e) {
            error = e;
            throw e;
        }
        finally {
            const ms = Number(process.hrtime.bigint() - start) / 1000000;
            metrics_1.metrics.observe('db.query.duration.ms', ms);
            // Phase 17: attribute DB time to active request if available
            try {
                const { getRequestContext } = require('../utils/requestContext');
                const ctx = getRequestContext();
                if (ctx?.requestId) {
                    const { getActiveRequestById, recordDbTime } = require('../middleware/latencyAttribution');
                    const req = getActiveRequestById(ctx.requestId);
                    if (req)
                        recordDbTime(req, ms);
                }
            }
            catch { /* ignore attribution errors */ }
            if (ms >= SLOW_QUERY_THRESHOLD_MS && ENABLE_QUERY_LOGGING) {
                const sqlText = typeof sql === 'string' ? sql : (sql?.query || '').toString();
                const truncated = sqlText.replace(/\s+/g, ' ').slice(0, 300);
                // Normalize literals (numbers / quoted strings) to reduce cardinality
                const pattern = truncated
                    .replace(/'(?:''|[^'])*'/g, "'?")
                    .replace(/\b\d+\b/g, '?')
                    .replace(/\bin \([^)]*\)/gi, 'IN (?)');
                const meta = { durationMs: ms.toFixed(2), slow: true };
                if (options?.type)
                    meta.type = options.type;
                if (error)
                    meta.error = error.message;
                let ctx = undefined;
                try {
                    const mod = require('../utils/requestContext');
                    ctx = mod.getRequestContext();
                }
                catch { /* ignore */ }
                logger_1.logger.warn('[db] slow query', { sql: truncated, pattern, ...meta, requestId: ctx?.requestId });
                // Buffer
                slowQueryBuffer.push({ pattern, sql: truncated, durationMs: ms, time: new Date().toISOString(), type: options?.type, error: error?.message });
                if (slowQueryBuffer.length > SLOW_QUERY_BUFFER_MAX)
                    slowQueryBuffer.shift();
                // Hash pattern to keep label bounded and track cardinality
                try {
                    const hash = crypto_1.default.createHash('md5').update(pattern).digest('hex').slice(0, 8);
                    (0, cardinality_1.trackDimension)('db_slow_query_pattern', hash);
                    metrics_1.metrics.increment(`db.slow_query.pattern.${hash}`);
                    metrics_1.metrics.increment('db.slow_query.total');
                }
                catch { /* ignore pattern metric errors */ }
            }
        }
    };
    logger_1.logger.info(`[db] Query monitor installed (slow >= ${SLOW_QUERY_THRESHOLD_MS}ms)`);
}
// Auto-install when imported (non-test unless explicitly enabled)
if (process.env.NODE_ENV !== 'test') {
    try {
        installQueryMonitor();
    }
    catch { /* ignore */ }
}
