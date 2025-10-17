"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.latencyAttributionMiddleware = latencyAttributionMiddleware;
exports.recordHandlerTime = recordHandlerTime;
exports.recordDbTime = recordDbTime;
exports.getActiveRequestById = getActiveRequestById;
// Lightweight global map of active requests by requestId so lower-level instrumentation
// (e.g. Sequelize patch in queryMonitor) can attribute DB time without direct access to req.
const activeRequests = global.__latencyActiveReqMap || new Map();
global.__latencyActiveReqMap = activeRequests;
// Phase 17 latency attribution middleware
// Captures rough attribution buckets: handler (controller), db (sequelize), other (residual) per request.
// Strategy: wrap res.send to finalize; rely on instrumentation hooks that set symbols on req during lifecycle.
const DB_TIME_SYMBOL = Symbol.for('latency.db.ms');
const HANDLER_TIME_SYMBOL = Symbol.for('latency.handlers.ms');
function latencyAttributionMiddleware(req, res, next) {
    const start = process.hrtime.bigint();
    // Stash handler start when route handler begins (another middleware will set it)
    req[HANDLER_TIME_SYMBOL] = 0;
    req[DB_TIME_SYMBOL] = 0;
    const origJson = res.json.bind(res);
    const origSend = res.send.bind(res);
    function finalize(body) {
        try {
            const totalMs = Number(process.hrtime.bigint() - start) / 1000000;
            const dbMs = req[DB_TIME_SYMBOL] || 0;
            const handlerMs = req[HANDLER_TIME_SYMBOL] || 0;
            const otherMs = Math.max(0, totalMs - dbMs - handlerMs);
            const bucket = global.__latencyAttribution;
            bucket.total += totalMs;
            bucket.db += dbMs;
            bucket.handlers += handlerMs;
            bucket.other += otherMs;
            bucket.count += 1;
        }
        catch { /* swallow */ }
        return body;
    }
    res.json = function patchedJson(body) {
        finalize(body);
        return origJson(body);
    };
    res.send = function patchedSend(body) {
        finalize(body);
        return origSend(body);
    };
    // Track active request for downstream instrumentation (removed on finish/close)
    const requestId = req.requestId;
    if (requestId) {
        activeRequests.set(requestId, req);
        const cleanup = () => { activeRequests.delete(requestId); };
        res.once('finish', cleanup);
        res.once('close', cleanup);
    }
    next();
}
// Helper to record handler elapsed (used in wrapper around actual controller execution)
function recordHandlerTime(req, elapsedMs) {
    const prev = req[HANDLER_TIME_SYMBOL] || 0;
    req[HANDLER_TIME_SYMBOL] = prev + elapsedMs;
}
// Helper to record DB time (wrap sequelize query call)
function recordDbTime(req, elapsedMs) {
    const prev = req[DB_TIME_SYMBOL] || 0;
    req[DB_TIME_SYMBOL] = prev + elapsedMs;
}
// Helper for external instrumentation to fetch request by id
function getActiveRequestById(requestId) {
    return activeRequests.get(requestId);
}
