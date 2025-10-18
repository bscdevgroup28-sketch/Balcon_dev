"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheTags = exports.cacheKeys = void 0;
exports.get = get;
exports.set = set;
exports.del = del;
exports.invalidateTag = invalidateTag;
exports.withCache = withCache;
exports.withCacheSWR = withCacheSWR;
exports.snapshot = snapshot;
const metrics_1 = require("../monitoring/metrics");
const cacheRedis_1 = require("./cacheRedis");
// Reuse existing lru-cache dependency already used elsewhere
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LRUCache = require('lru-cache');
const MAX_ENTRIES = 500;
const store = new LRUCache({ max: MAX_ENTRIES });
const tagIndex = new Map();
const inFlight = new Map();
function now() { return Date.now(); }
function record(metric) {
    try {
        metrics_1.metrics.increment(metric);
    }
    catch { /* ignore */ }
}
function sanitize(key) {
    return key.replace(/[^a-zA-Z0-9_.]/g, '_');
}
function recordKeyed(base, key) {
    record(`${base}.${sanitize(key)}`);
}
function get(key) {
    const entry = store.get(key);
    if (!entry) {
        record('cache.miss');
        recordKeyed('cache.miss', key);
        return undefined;
    }
    if (entry.expiresAt < now()) {
        store.delete(key);
        record('cache.miss');
        recordKeyed('cache.miss', key);
        return undefined;
    }
    record('cache.hit');
    recordKeyed('cache.hit', key);
    if (key.startsWith('analytics:'))
        record('cache.analytics.hit');
    return entry.value;
}
function set(key, value, ttlMs, tags) {
    const entry = { value, expiresAt: now() + ttlMs, tags };
    store.set(key, entry);
    record('cache.set');
    recordKeyed('cache.set', key);
    if (key.startsWith('analytics:'))
        record('cache.analytics.set');
    if (tags) {
        for (const t of tags) {
            if (!tagIndex.has(t))
                tagIndex.set(t, new Set());
            tagIndex.get(t).add(key);
        }
    }
}
function del(key) {
    const entry = store.get(key);
    if (entry?.tags) {
        for (const t of entry.tags)
            tagIndex.get(t)?.delete(key);
    }
    store.delete(key);
    record('cache.invalidate');
    recordKeyed('cache.invalidate', key);
}
function invalidateTag(tag) {
    const keys = tagIndex.get(tag);
    if (!keys)
        return;
    for (const k of keys)
        store.delete(k);
    tagIndex.delete(tag);
    record('cache.invalidate');
    recordKeyed('cache.invalidate', tag);
}
async function withCache(key, ttlMs, loader, tags) {
    // Try in-memory first
    const mem = get(key);
    if (mem !== undefined)
        return mem;
    // Try Redis second (if configured) - we purposely do not store tags remotely in this simple version
    const redis = (0, cacheRedis_1.getRedisCache)();
    if (redis) {
        try {
            const val = await redis.get(key);
            if (val !== undefined) {
                // hydrate local for faster subsequent access respecting TTL remainder (not tracked precisely here)
                set(key, val, ttlMs, tags);
                return val;
            }
        }
        catch { /* ignore */ }
    }
    if (key.startsWith('analytics:'))
        record('cache.analytics.miss');
    // Single flight: if another request is already loading it, await it
    const existing = inFlight.get(key);
    if (existing) {
        try {
            return await existing.promise;
        }
        finally { /* leave single flight owner to clean */ }
    }
    const p = (async () => {
        try {
            const val = await loader();
            set(key, val, ttlMs, tags);
            if (redis) {
                try {
                    await redis.set(key, val, ttlMs);
                }
                catch { /* ignore */ }
            }
            return val;
        }
        finally {
            inFlight.delete(key);
        }
    })();
    inFlight.set(key, { promise: p, started: now() });
    return p;
}
async function withCacheSWR(key, ttlMs, loader, tags) {
    // Try in-memory first
    const mem = get(key);
    if (mem !== undefined) {
        // If within grace period (e.g., 80% of TTL), return immediately and refresh async
        const entry = store.get(key);
        if (entry && entry.expiresAt - now() > ttlMs * 0.2)
            return mem; // fresh enough
        // Stale but serve it, refresh in background
        loader().then(val => {
            set(key, val, ttlMs, tags);
            const redis = (0, cacheRedis_1.getRedisCache)();
            if (redis)
                try {
                    redis.set(key, val, ttlMs);
                }
                catch { /* ignore */ }
        }).catch(() => { });
        return mem;
    }
    // No cache, load fresh
    return withCache(key, ttlMs, loader, tags);
}
function snapshot() {
    return {
        size: store.size,
        tags: Array.from(tagIndex.keys()),
        inFlight: inFlight.size
    };
}
// Expose a helper for materials categories specific key
exports.cacheKeys = {
    materialCategories: 'materials:categories',
    materialLowStock: 'materials:lowStock',
    analyticsSummary: 'analytics:summary:latest'
};
exports.cacheTags = {
    materials: 'materials',
    analytics: 'analytics',
    attention: 'attention'
};
// Gauges for observability
try {
    metrics_1.metrics.registerGauge('cache.entries', () => store.size);
    metrics_1.metrics.registerGauge('cache.tags', () => tagIndex.size);
    metrics_1.metrics.registerGauge('cache.inflight', () => inFlight.size);
    metrics_1.metrics.registerGauge('cache.hit_ratio', () => {
        try {
            const counters = metrics_1.metrics.counters || {};
            const hits = counters['cache.hit'] || 0;
            const misses = counters['cache.miss'] || 0;
            const denom = hits + misses;
            return denom === 0 ? 0 : hits / denom;
        }
        catch {
            return 0;
        }
    });
}
catch { /* ignore */ }
