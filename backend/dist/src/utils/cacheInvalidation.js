"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateAnalyticsCaches = invalidateAnalyticsCaches;
const cache_1 = require("./cache");
const cache_2 = require("./cache");
const cacheRedis_1 = require("./cacheRedis");
const logger_1 = require("../utils/logger");
// Best-effort invalidation for analytics caches across memory and Redis
async function invalidateAnalyticsCaches(reason) {
    try {
        // In-memory tag-based invalidation
        (0, cache_1.invalidateTag)(cache_2.cacheTags.analytics);
    }
    catch (e) {
        // non-fatal
        logger_1.logger.warn('[cache] failed to invalidate analytics tag', { error: e?.message });
    }
    // Redis fallback lacks tags: delete known analytics keys explicitly
    const redis = (0, cacheRedis_1.getRedisCache)();
    if (!redis)
        return;
    try {
        const ranges = ['30d', '90d', '365d'];
        const forecastMetrics = ['quotesSent', 'quotesAccepted', 'ordersCreated', 'ordersDelivered', 'inventoryNetChange'];
        const horizons = ['14', '30', '60'];
        const distFields = ['category', 'status'];
        const keys = [];
        // Summary
        keys.push('analytics:summary:latest');
        // Trends
        for (const r of ranges)
            keys.push(`analytics:trends:${r}`);
        // Anomalies (base keys; threshold variants will be rebuilt by traffic)
        for (const r of ['30d', '90d'])
            keys.push(`analytics:anomalies:${r}`);
        // Forecasts
        for (const m of forecastMetrics)
            for (const h of horizons)
                keys.push(`analytics:forecast:${m}:${h}`);
        // Distributions
        for (const f of distFields)
            keys.push(`analytics:distribution:materials:${f}`);
        // Fire deletes (best-effort)
        await Promise.all(keys.map(k => redis.del(k).catch(() => { })));
    }
    catch (e) {
        logger_1.logger.warn('[cache] failed to invalidate analytics keys in redis', { error: e?.message });
    }
}
