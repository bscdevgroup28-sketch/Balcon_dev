import { metrics } from '../monitoring/metrics';
import { getRedisCache } from './cacheRedis';
// Reuse existing lru-cache dependency already used elsewhere
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LRUCache = require('lru-cache');

interface CacheEntry<T=any> { value: T; expiresAt: number; tags?: string[] }

interface InFlightEntry { promise: Promise<any>; started: number }

const MAX_ENTRIES = 500;

const store: any = new LRUCache({ max: MAX_ENTRIES });
const tagIndex: Map<string, Set<string>> = new Map();
const inFlight: Map<string, InFlightEntry> = new Map();

function now() { return Date.now(); }

function record(metric: string) {
  try { metrics.increment(metric); } catch { /* ignore */ }
}

function sanitize(key: string) {
  return key.replace(/[^a-zA-Z0-9_.]/g, '_');
}

function recordKeyed(base: string, key: string) {
  record(`${base}.${sanitize(key)}`);
}

export function get<T=any>(key: string): T | undefined {
  const entry: CacheEntry<T> | undefined = store.get(key);
  if (!entry) { record('cache.miss'); recordKeyed('cache.miss', key); return undefined; }
  if (entry.expiresAt < now()) { store.delete(key); record('cache.miss'); recordKeyed('cache.miss', key); return undefined; }
  record('cache.hit');
  recordKeyed('cache.hit', key);
  if (key.startsWith('analytics:')) record('cache.analytics.hit');
  return entry.value;
}

export function set<T=any>(key: string, value: T, ttlMs: number, tags?: string[]) {
  const entry: CacheEntry<T> = { value, expiresAt: now() + ttlMs, tags };
  store.set(key, entry);
  record('cache.set');
  recordKeyed('cache.set', key);
  if (key.startsWith('analytics:')) record('cache.analytics.set');
  if (tags) {
    for (const t of tags) {
      if (!tagIndex.has(t)) tagIndex.set(t, new Set());
      tagIndex.get(t)!.add(key);
    }
  }
}

export function del(key: string) {
  const entry: CacheEntry | undefined = store.get(key);
  if (entry?.tags) {
    for (const t of entry.tags) tagIndex.get(t)?.delete(key);
  }
  store.delete(key);
  record('cache.invalidate');
  recordKeyed('cache.invalidate', key);
}

export function invalidateTag(tag: string) {
  const keys = tagIndex.get(tag);
  if (!keys) return;
  for (const k of keys) store.delete(k);
  tagIndex.delete(tag);
  record('cache.invalidate');
  recordKeyed('cache.invalidate', tag);
}

export async function withCache<T>(key: string, ttlMs: number, loader: () => Promise<T>, tags?: string[]): Promise<T> {
  // Try in-memory first
  const mem = get<T>(key);
  if (mem !== undefined) return mem;
  // Try Redis second (if configured) - we purposely do not store tags remotely in this simple version
  const redis = getRedisCache();
  if (redis) {
    try {
      const val = await redis.get<T>(key);
      if (val !== undefined) {
        // hydrate local for faster subsequent access respecting TTL remainder (not tracked precisely here)
        set(key, val as any, ttlMs, tags);
        return val;
      }
    } catch { /* ignore */ }
  }
  if (key.startsWith('analytics:')) record('cache.analytics.miss');
  // Single flight: if another request is already loading it, await it
  const existing = inFlight.get(key);
  if (existing) {
    try { return await existing.promise; } finally { /* leave single flight owner to clean */ }
  }
  const p = (async () => {
    try {
      const val = await loader();
      set(key, val, ttlMs, tags);
      if (redis) {
        try { await redis.set(key, val as any, ttlMs); } catch { /* ignore */ }
      }
      return val;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, { promise: p, started: now() });
  return p;
}

export async function withCacheSWR<T>(key: string, ttlMs: number, loader: () => Promise<T>, tags?: string[]): Promise<T> {
  // Try in-memory first
  const mem = get<T>(key);
  if (mem !== undefined) {
    // If within grace period (e.g., 80% of TTL), return immediately and refresh async
    const entry: CacheEntry<T> | undefined = store.get(key);
    if (entry && entry.expiresAt - now() > ttlMs * 0.2) return mem; // fresh enough
    // Stale but serve it, refresh in background
    loader().then(val => {
      set(key, val, ttlMs, tags);
      const redis = getRedisCache();
      if (redis) try { redis.set(key, val as any, ttlMs); } catch { /* ignore */ }
    }).catch(() => { /* ignore refresh errors */ });
    return mem;
  }
  // No cache, load fresh
  return withCache(key, ttlMs, loader, tags);
}

export function snapshot() {
  return {
    size: store.size,
    tags: Array.from(tagIndex.keys()),
    inFlight: inFlight.size
  };
}

// Expose a helper for materials categories specific key
export const cacheKeys = {
  materialCategories: 'materials:categories',
  materialLowStock: 'materials:lowStock',
  analyticsSummary: 'analytics:summary:latest'
};

export const cacheTags = {
  materials: 'materials',
  analytics: 'analytics'
};

// Gauges for observability
try {
  metrics.registerGauge('cache.entries', () => store.size);
  metrics.registerGauge('cache.tags', () => tagIndex.size);
  metrics.registerGauge('cache.inflight', () => inFlight.size);
  metrics.registerGauge('cache.hit_ratio', () => {
    const hits = (metrics as any).snapshot().counters['cache.hit'] || 0;
    const misses = (metrics as any).snapshot().counters['cache.miss'] || 0;
    const denom = hits + misses;
    return denom === 0 ? 0 : hits / denom;
  });
} catch { /* ignore */ }
