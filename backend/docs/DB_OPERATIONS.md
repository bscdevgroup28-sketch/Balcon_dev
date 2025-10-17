# Database Operations Guide

## Overview
Operational handbook for schema changes, performance tuning, retention hygiene, and diagnostics.

## 1. Adding a Migration
1. Create file `src/migrations/<timestamp>-<description>.ts`
2. Implement `up` (and `down` only if safe/necessary)
3. Run locally:
```
npm run build && node dist/src/scripts/migrate.js status (if script exists) 
```
4. Generate manifest:
```
npm run migrations:manifest
```
5. Commit migration + updated `migration-manifest.json`
6. Open PR (CI will later run `migrations:verify` when integrated)

## 2. Rules of Thumb
| Topic | Rule |
|-------|------|
| Editing old migration | Forbidden (hash check will fail) |
| Destructive change | Require backup & sign-off; prefer additive followed by backfill & swap |
| Large table modifications | Break into multiple smaller migrations |
| Index creation | Add separately from heavy DDL to isolate risk |

## 3. Performance Diagnostics
| Signal | Action |
|--------|--------|
| Slow query log `[db] slow query` | Inspect SQL pattern; consider composite/partial index |
| High latency spike | Check connection pool saturation & DB CPU |
| Frequent deadlocks | Review transaction scoping/order |

### In-Process Diagnostics (Ephemeral)
| Endpoint | Purpose |
|----------|---------|
| `GET /api/metrics/patterns` | Aggregated slow query patterns (top, normalized) |
| `GET /api/metrics/slow-queries?limit=50` | Recent slow queries ring buffer (truncated raw + pattern) |
These endpoints are for ad-hoc debugging; avoid exposing publicly without auth controls.

Feature Flags / Env Controls:
- `DIAG_ENDPOINTS_ENABLED` (false in production): Enables the diagnostic endpoints above.
- `METRICS_AUTH_TOKEN`: If set, required as `Authorization: Bearer <token>` for `/api/metrics/prometheus`.

### Enable More Verbose Logging
Set `DB_QUERY_LOGGING=true` (non-prod) to always log slow queries above threshold.

### Adjust Threshold
`DB_SLOW_QUERY_THRESHOLD_MS=300` (example)

## 4. Index Review Workflow
1. Capture slow query logs for 24h
2. Group by normalized pattern
3. Verify existing indexes with `EXPLAIN ANALYZE` (in staging)
4. Add migration with new index (use IF NOT EXISTS)
5. Monitor before/after latency

## 5. Retention & Cleanup
Refresh tokens:
- Automatic cleanup every `REFRESH_TOKEN_CLEANUP_INTERVAL_MS`
- Retains active + last 30 days (configurable via `REFRESH_TOKEN_RETENTION_DAYS`)

## 6. Capacity & Pooling
| Env | Max Connections (DB) | App Pool Max | Notes |
|-----|----------------------|--------------|-------|
| Production (example) | 20 | 5 | Keep headroom for admin tools |
| Staging | 10 | 3 | Lower footprint |

Adjust using env: `DB_POOL_MAX`, `DB_POOL_MIN` (if supported; extend config if needed).

## 7. Manual Token Table Inspection
```
SELECT COUNT(*) FROM refresh_tokens;
SELECT COUNT(*) FROM refresh_tokens WHERE revoked_at IS NULL;
```
If ratio > ~8:1 (total:active) consider retention reduction or investigate abnormal issuance.

## 8. Schema Drift Detection
- Startup logs print table counts.
- Unexpected table or row explosion → investigate migrations or accidental sync usage.

## 9. Emergency Migration Abort (Pre-Deploy)
If a migration is problematic and not yet deployed:
1. Revert git commit (do NOT edit file in place)
2. Regenerate manifest
3. Re-run tests & build

If already in production and irreversible → write a corrective forward migration.

## 10. Future Enhancements
- Query plan capture (pg_stat_statements)
- Automatic index advisor pipeline
- Partition strategy evaluation for activity/event tables

## 11. Correlation IDs & Request Context
All slow query and slow pool acquisition logs now include `requestId` when the query occurs inside an HTTP request lifecycle. This is powered by an AsyncLocalStorage context initialized immediately after the request logging middleware.

Usage:
- `requestId` appears in: `[db] slow query`, `[db] slow pool acquire`.
- Correlate with upstream request log lines `➡️` (start) and `✅` (completion).

Edge Cases:
- Background jobs (cron, schedulers) will not have a requestId (logged as `null`).
- Test environment does not auto-install query monitor (unless explicitly enabled) to keep noise low.

Extending Context:
- Add more fields in `requestContextMiddleware` (e.g., tenantId) – safe forward addition.
- Ensure any new context keys are low-cardinality to avoid log volume explosion.

---
Maintained under database hardening initiative.