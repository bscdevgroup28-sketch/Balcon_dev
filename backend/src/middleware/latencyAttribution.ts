import { NextFunction, Request, Response } from 'express';

// Lightweight global map of active requests by requestId so lower-level instrumentation
// (e.g. Sequelize patch in queryMonitor) can attribute DB time without direct access to req.
const activeRequests: Map<string, Request> = (global as any).__latencyActiveReqMap || new Map();
(global as any).__latencyActiveReqMap = activeRequests;

// Phase 17 latency attribution middleware
// Captures rough attribution buckets: handler (controller), db (sequelize), other (residual) per request.
// Strategy: wrap res.send to finalize; rely on instrumentation hooks that set symbols on req during lifecycle.

const DB_TIME_SYMBOL = Symbol.for('latency.db.ms');
const HANDLER_TIME_SYMBOL = Symbol.for('latency.handlers.ms');

export function latencyAttributionMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  // Stash handler start when route handler begins (another middleware will set it)
  (req as any)[HANDLER_TIME_SYMBOL] = 0;
  (req as any)[DB_TIME_SYMBOL] = 0;

  const origJson = res.json.bind(res);
  const origSend = res.send.bind(res);

  function finalize(body: any) {
    try {
      const totalMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const dbMs = (req as any)[DB_TIME_SYMBOL] || 0;
      const handlerMs = (req as any)[HANDLER_TIME_SYMBOL] || 0;
      const otherMs = Math.max(0, totalMs - dbMs - handlerMs);
      const bucket = (global as any).__latencyAttribution as any;
      bucket.total += totalMs;
      bucket.db += dbMs;
      bucket.handlers += handlerMs;
      bucket.other += otherMs;
      bucket.count += 1;
    } catch { /* swallow */ }
    return body;
  }

  res.json = function patchedJson(body: any) {
    finalize(body);
    return origJson(body);
  } as any;
  res.send = function patchedSend(body: any) {
    finalize(body);
    return origSend(body);
  } as any;

  // Track active request for downstream instrumentation (removed on finish/close)
  const requestId = (req as any).requestId;
  if (requestId) {
    activeRequests.set(requestId, req);
    const cleanup = () => { activeRequests.delete(requestId); };
    res.once('finish', cleanup);
    res.once('close', cleanup);
  }

  next();
}

// Helper to record handler elapsed (used in wrapper around actual controller execution)
export function recordHandlerTime(req: Request, elapsedMs: number) {
  const prev = (req as any)[HANDLER_TIME_SYMBOL] || 0;
  (req as any)[HANDLER_TIME_SYMBOL] = prev + elapsedMs;
}

// Helper to record DB time (wrap sequelize query call)
export function recordDbTime(req: Request, elapsedMs: number) {
  const prev = (req as any)[DB_TIME_SYMBOL] || 0;
  (req as any)[DB_TIME_SYMBOL] = prev + elapsedMs;
}

// Helper for external instrumentation to fetch request by id
export function getActiveRequestById(requestId: string): Request | undefined {
  return activeRequests.get(requestId);
}
