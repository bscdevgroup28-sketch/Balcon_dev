# Phase 5 / Sprint 5 – Performance & Caching Plan

Goal: Reduce response latency and repetitive database load for read‑heavy endpoints while preserving data freshness and security.

## Objectives
1. Introduce unified caching abstraction (in‑memory LRU first; pluggable Redis later).
2. Add request‑scoped idempotent query helpers for common list/lookups (materials categories, active materials list, feature flags snapshot).
3. Provide cache instrumentation metrics (hits, misses, invalidations, stale serves) exposed via existing Prometheus endpoint.
4. Implement selective cache busting on write (create/update/delete affecting cached keys).
5. Add lightweight load test harness (optional) to compare cold vs warm timings.

## Initial Scope (MVP in this sprint)
- In‑memory cache module with TTL + max size (LRU eviction) and tag/namespace support.
- Wrap `/api/materials/categories` with 30s cache (configurable via env `CACHE_TTL_MATERIAL_CATEGORIES_MS`).
- Bust categories cache on material create/update/delete or status change.
- Expose cache metrics: `cache_hits_total`, `cache_misses_total`, `cache_sets_total`, `cache_evictions_total`, `cache_invalidations_total` (namespaced per key group via label suffix).
- Provide convenience helper `cache.withCache(key, ttlMs, loader)`.

## Deferred / Nice to Have
- Redis adapter (`CACHE_REDIS_URL`) with identical API.
- Stale‑while‑revalidate pattern for expensive aggregations.
- Query plan logging (Sequelize `.options.logging`).
- Automatic per‑endpoint micro-profiler middleware (histogram already partly exists via advanced metrics).

## Design Notes
- Keep cache synchronous (Promise wrapper only for loader) to avoid race conditions; implement single-flight (in‑progress promise reused).
- Tag invalidation: each entry stores array of tags; invalidation by tag iterates index map.
- Minimal dependency footprint: reuse existing installed `lru-cache` (already present for rate limiting) for storage.
- Metrics: integrate with existing custom metrics registry (`metrics.increment`). Use dotted key pattern `cache.hit.materialCategories` etc.

## Rollout Steps
1. Implement `utils/cache.ts` abstraction + metrics hooks.
2. Wire categories endpoint to use cache.
3. Add invalidation calls in materials mutation routes.
4. Add integration test validating cache behavior (warm call faster / metrics increment) – optional if timing brittle; at least assert metrics counters change after two calls.
5. Document usage in this file and (optionally) README performance section.

## Risk Mitigation
- TTL short (30s) to limit stale exposure.
- Write paths always invalidate relevant tags before responding.
- If cache layer throws, fail open and proceed with DB query (never fail request due to cache).

## Next Iteration Ideas
- Add server-side ETag generation with If-None-Match handling for large lists.
- Pre-compute daily KPI snapshot caching.
- Background refresh worker for hottest keys.

---
Document version: 1.0 (initial commit)