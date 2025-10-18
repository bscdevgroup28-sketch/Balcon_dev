import { invalidateTag } from './cache';
import { cacheTags } from './cache';
import { getRedisCache } from './cacheRedis';
import { logger } from '../utils/logger';

// Best-effort invalidation for analytics caches across memory and Redis
export async function invalidateAnalyticsCaches(reason?: string) {
  try {
    // In-memory tag-based invalidation
    invalidateTag(cacheTags.analytics);
  } catch (e:any) {
    // non-fatal
    logger.warn('[cache] failed to invalidate analytics tag', { error: e?.message });
  }

  // Redis fallback lacks tags: delete known analytics keys explicitly
  const redis = getRedisCache();
  if (!redis) return;
  try {
    const ranges = ['30d','90d','365d'];
    const forecastMetrics = ['quotesSent','quotesAccepted','ordersCreated','ordersDelivered','inventoryNetChange'];
    const horizons = ['14','30','60'];
    const distFields = ['category','status'];
    const keys: string[] = [];
    // Summary
    keys.push('analytics:summary:latest');
    // Trends
    for (const r of ranges) keys.push(`analytics:trends:${r}`);
    // Anomalies (base keys; threshold variants will be rebuilt by traffic)
    for (const r of ['30d','90d']) keys.push(`analytics:anomalies:${r}`);
    // Forecasts
    for (const m of forecastMetrics) for (const h of horizons) keys.push(`analytics:forecast:${m}:${h}`);
    // Distributions
    for (const f of distFields) keys.push(`analytics:distribution:materials:${f}`);
    // Fire deletes (best-effort)
    await Promise.all(keys.map(k => redis.del(k).catch(()=>{})));
  } catch (e:any) {
    logger.warn('[cache] failed to invalidate analytics keys in redis', { error: e?.message });
  }
}
