"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalRateLimit = globalRateLimit;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LRUCache = require('lru-cache');
const environment_1 = require("../config/environment");
const redis_1 = require("redis");
const metrics_1 = require("../monitoring/metrics");
const windowMs = environment_1.config.limits.global.windowMs;
const baseMax = environment_1.config.limits.global.max;
let adaptiveMax = baseMax;
const buckets = new LRUCache({ max: 5000, ttl: windowMs * 2 });
let redisClient = null;
if (process.env.REDIS_URL) {
    redisClient = (0, redis_1.createClient)({ url: process.env.REDIS_URL });
    redisClient.on('error', () => { });
    redisClient.connect().catch(() => { redisClient = null; });
}
function key(req) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userPart = req.user?.id ? `u${req.user.id}` : 'anon';
    return `${ip}:${userPart}`;
}
// Adaptive tuner: periodically adjust adaptiveMax based on error & latency signals
let lastTune = 0;
function maybeTune() {
    const now = Date.now();
    if (now - lastTune < 5000)
        return; // tune every 5s
    lastTune = now;
    try {
        const snap = metrics_1.metrics.snapshot();
        const errorRate = snap.gauges['http.errors.5xx.rate_5m_per_min'] || 0;
        const latencyP95Anom = snap.gauges['http.latency.p95.anomaly_score'] || 0;
        // If severe anomaly or high 5xx, scale down allowed burst to shed load
        let factor = 1;
        if (errorRate > 10)
            factor = 0.4; // heavy errors
        else if (errorRate > 5)
            factor = 0.6;
        if (latencyP95Anom > 4)
            factor = Math.min(factor, 0.5);
        else if (latencyP95Anom > 2.5)
            factor = Math.min(factor, 0.7);
        const target = Math.max(50, Math.round(baseMax * factor));
        adaptiveMax = target;
    }
    catch { /* ignore */ }
}
metrics_1.metrics.registerGauge?.('ratelimit.global.adaptive_max', () => adaptiveMax);
async function globalRateLimit(req, res, next) {
    maybeTune();
    const k = key(req);
    // Redis path
    if (redisClient) {
        try {
            const redisKey = `ratelimit:${k}`;
            const val = await redisClient.multi()
                .incr(redisKey)
                .pTTL(redisKey)
                .exec();
            const count = val?.[0] ?? 1;
            let pttl = val?.[1];
            if (pttl === -1) {
                await redisClient.pExpire(redisKey, windowMs);
                pttl = windowMs;
            }
            if (count === 1)
                await redisClient.pExpire(redisKey, windowMs);
            if (count > adaptiveMax) {
                metrics_1.metrics.increment('ratelimit.blocked');
                const retryAfter = Math.ceil(pttl / 1000);
                res.setHeader('Retry-After', retryAfter);
                return res.status(429).json({ error: 'RateLimitExceeded', message: 'Too many requests', retryAfterSeconds: retryAfter });
            }
            metrics_1.metrics.increment('ratelimit.allowed');
            return next();
        }
        catch {
            // fallback silently to in-memory if redis errors
        }
    }
    const now = Date.now();
    let b = buckets.get(k);
    if (!b) {
        b = { count: 0, first: now };
    }
    if (now - b.first > windowMs) {
        b.first = now;
        b.count = 0;
    }
    b.count += 1;
    buckets.set(k, b);
    if (b.count > adaptiveMax) {
        metrics_1.metrics.increment('ratelimit.blocked');
        const retry = Math.ceil((b.first + windowMs - now) / 1000);
        res.setHeader('Retry-After', retry);
        return res.status(429).json({ error: 'RateLimitExceeded', message: 'Too many requests', retryAfterSeconds: retry });
    }
    metrics_1.metrics.increment('ratelimit.allowed');
    next();
}
