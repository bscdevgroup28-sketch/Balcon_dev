# BalCon Platform Monorepo

This repository houses the BalCon (Bal-Con Builders) platfo### **Phase 2: Advanced Features & Integration** (IN PROGRESS)
- ✅ **WebSocket Real-Time Features**: Complete Socket.IO integration for live updates
- 🔄 Add mobile optimization and PWA capabilities
- 🔄 Implement comprehensive testing suite (unit, integration, e2e)
- 🔄 Add performance monitoring and error tracking
- 🔄 Integrate third-party services (payment processing, document management)ebase in a single monorepo containing:

- `backend/` – Node.js / Express / Sequelize API (SQLite for local + test; configurable for other DBs)
- `frontend/` – React (CRA) client application (Redux Toolkit, MUI)

## High-Level Features

## Tech Stack
Key operational resources now available:
- `backend/OPERATIONS_METRICS.md` – Runtime metric catalog & interpretation.
- `backend/ALERTS_EXAMPLES.md` – Starter Prometheus-style alert rules.
- `backend/SECURITY_SCANNING.md` – Runtime error monitoring & dependency scanning plan.
- Support bundle script: `npm run ops:support-bundle` (backend) for triage snapshot.
- Perf baselines: `npm run perf:health:save`, `npm run perf:auth:save`, `npm run perf:projects:save` with history in `backend/perf-history/` and comparison via `npm run perf:compare`.
- CI Ops workflow: `.github/workflows/ops-phase4.yml` runs perf smoke + bundle validation.
- Weekly security audit workflow: `.github/workflows/security-audit.yml` (npm audit) – non-blocking report.
- Static analysis & secret scanning:
  - CodeQL: `.github/workflows/codeql.yml` (JS/TS security & quality queries, weekly + on PRs)
  - Gitleaks: `.github/workflows/secret-scan.yml` (scheduled + PR secret detection, SARIF upload)
- New auth observability: counters `auth.success` / `auth.failures` with integration test coverage (`authTokenValidationMetrics.test.ts`).
| Area | Technology |
|------|------------|
| Frontend | React 18, Redux Toolkit, React Router v6, MUI 5 |
| Testing (frontend) | React Testing Library, Jest |
| Tooling | TypeScript, npm workspaces |

## Local Development (Windows PowerShell)
Prerequisites: Node.js >= 18.

Install (root will install workspaces):
```powershell
npm install
```

Run backend & frontend concurrently (scripts wrap startup):
```powershell
npm run dev
```

Run tests:
```powershell
# Backend tests
npm run test:backend

# Frontend tests (non-watch)
npm run test:frontend

# All
npm test
```

Type checking:
```powershell
npm run typecheck
```

## Project Structure (excerpt)
  src/
  public/
Key internal docs (see `/docs`):
- `feature_flags.md` – Flag model, API, rollout strategies
- `migrations_runbook.md` – Database migration process & operational checklist

Backend environment variables (examples):
- `PORT` (default 3001)

## Scripts (root)

## Current Status & Roadmap

- Custom metrics + prom-client histograms combined at single endpoint
- Security metric exposure & validation tests
- Structured logging enhancements

- Security metrics (lockouts, policy hits) covered by tests

- Invalidation wired to material mutations
- Next Steps: add invalidation assertion test for categories, optional Redis adapter, extend to KPI snapshots

### 📋 Phase 6: Asynchronous Work & Background Optimization (PLANNED)

### 🚀 Phase 7: Advanced Analytics & Reporting (COMPLETED)
- KPI Summary endpoint with caching + ETag
- Trends endpoint (30/90/365d) with rolling 7‑day averages & deltas
- Material distribution (category/status) + CSV exports (trends & distribution)
- Auth protection + metrics instrumentation (analytics.* counters, cache.analytics.*)
- OpenAPI & README updated

### 🌐 Phase 8: Mobile & Client Optimization (COMPLETED)
Deliverables:
- Analytics dashboard UI (/analytics) + CSV export actions
- PWA install banner, update notification indicator
- Service worker with offline shell, API/network strategies, background sync scaffold
- Anomaly detection endpoint with caching + fallback logic
- CSV export rate limiting (per-user/IP) and metrics
- OpenAPI updated for anomalies; README updated

### 🔮 Phase 9: Data Export & External Integrations (COMPLETED)
Delivered:
1. Export Subsystem
  - `ExportJob` model with statuses: pending, processing, partial, completed, failed
  - Streaming CSV generation (memory efficient) for materials/orders/projects
  - Multi-part incremental exports with deterministic pagination (updatedAt + id composite cursor)
  - Parts manifest (`params.parts`) + final webhook payload includes part list
2. Secure Delivery
  - One-time download tokens (issue & redeem endpoints)
  - Storage abstraction (local filesystem + S3 provider with presigned URLs & auto-refresh heuristic)
3. Webhooks Framework
  - `WebhookSubscription` & `WebhookDelivery` models
  - HMAC SHA256 signature (`X-Webhook-Signature`), retry w/ backoff schedule, delivery job queue
  - CRUD API for subscriptions (list/create/get/patch/delete/rotate-secret)
4. Metrics & Observability
  - Counters: exports.enqueued|completed|failed, webhooks.enqueued|delivered|failed|retried, ratelimit.allowed|blocked
  - Histogram: export.duration.ms
  - Gauges: jobs.queue.length, jobs.queue.running, jobs.pending.oldest_age_ms (with persistence sampling)
5. OpenAPI
  - Updated schema for export status (partial + parts[])
  - Added webhook subscription endpoints
6. Tests
  - Integration coverage for export flows (single + multi-part) and webhook CRUD

### 🛠 Phase 10: Scalability & Persistence Hardening (COMPLETED)
Delivered:
- Persistent job scaffolding (`JobRecord`) with recovery & graceful shutdown requeue
- Redis integration (cache layer groundwork + rate limiter atomic counters)
- Incremental export batching loop + composite cursor + self re-enqueue
- S3 storage provider & presigned URL refresh on status fetch
- Oldest pending job age sampler (DB-based)
- Enhanced rate limiter instrumentation (allowed vs blocked)
- Webhook delivery management (list/retry endpoints)
- Export archive consolidation (zip multi-part files)
- OpenAPI enriched with component schemas
- SECURITY.md added
- LICENSE (MIT) added
- Postgres migration guidance
- Stale-while-revalidate caching (`withCacheSWR`)
- Additional metrics (webhook failure rate gauge, idempotency keys)
- Webhook replay safeguards (idempotency key in payloads)

### Environment Variables (New / Relevant to Phases 9 & 10)
| Name | Purpose | Default |
|------|---------|---------|
| EXPORT_BATCH_LIMIT | Max rows per export batch | 5000 |
| PERSIST_JOBS | Enable job persistence (JobRecord) | false |
| JOBS_OLDEST_AGE_SAMPLE_MS | Sampling interval for pending job age gauge | 30000 |
| STORAGE_DRIVER | 'local' or 's3' | local |
| S3_BUCKET | S3 bucket name (when STORAGE_DRIVER=s3) | (none) |
| S3_REGION | AWS region | (none) |
| S3_ACCESS_KEY_ID | AWS access key | (none) |
| S3_SECRET_ACCESS_KEY | AWS secret key | (none) |
| S3_PRESIGN_REFRESH_MS | Age threshold to refresh presigned URL | 600000 |
| REDIS_URL | Redis connection string for rate limit/cache | (none) |
| JOBS_CONCURRENCY | Concurrent job handlers | 2 |
| JOBQUEUE_NO_SIG | Disable signal handlers (tests) | unset |

### Webhook Security
Each delivery includes:
 - Header `X-Webhook-Signature`: HMAC SHA256 of JSON body using subscription secret
 - Header `X-Webhook-Event`: event type (e.g. export.completed)
Recommended consumer verification:
1. Recompute hex digest using stored secret
2. Constant-time compare
3. Enforce reasonable timestamp skew on payload.timestamp (if added later)

### Incremental Export Flow
1. Client POST /api/exports (optionally with params.since)
2. First batch processes -> status partial (if more rows), manifest includes first part
3. Queue auto-enqueues continuation until final batch < batch limit
4. Final status completed; webhook fired with full parts list
5. Clients may combine part files; future enhancement: on-demand archive endpoint

### Postgres Migration Guide

To migrate from SQLite (dev/test) to PostgreSQL (production):

1. **Install PostgreSQL**: Use Railway, AWS RDS, or local instance.
2. **Update Environment**:
   - Set `DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require`
   - Ensure `PGSSLMODE=require` for SSL.
3. **Run Migrations**:
   - The app auto-runs migrations on startup via `migrationLoader.ts`.
   - For manual: `node backend/src/scripts/migrate.ts`
4. **Data Migration** (if needed):
   - Export SQLite data: `sqlite3 enhanced_database.sqlite .dump > dump.sql`
   - Import to Postgres: `psql -h host -U user -d dbname < dump.sql`
   - Adjust for dialect differences (e.g., autoincrement → serial).
5. **Test**:
   - Run full test suite: `npm run test:backend`
   - Verify exports, webhooks, jobs persist across restarts.
6. **Production Checklist**:
   - Enable SSL.
   - Set connection pool limits.
   - Monitor slow queries.
   - Backup regularly.

See `RAILWAY_DEPLOYMENT.md` for Railway-specific setup.

## Contributing
Internal team only at this stage. Contribution guidelines & code ownership files will be added.

## License
License selection pending (MIT / Apache-2.0 / Proprietary). Until added, all rights reserved internally.

## Security
Do not commit secrets. Use environment variables or deployment platform secret stores. SECURITY.md to be added.

---
Generated bootstrap README – update sections as the platform evolves.

## Performance & Caching Overview

An in-memory LRU cache (Phase 5) accelerates read-heavy endpoints while keeping data fresh:

Features:
- TTL-based entries (per-call configurable) + max size 500
- Tag invalidation (materials mutations bust related keys)
- Single-flight suppression prevents duplicate concurrent DB queries
- Metrics: generic (cache.hit/miss/set/invalidate) + per-key (e.g. cache.hit.materials_categories) + gauges (cache.entries, cache.tags, cache.inflight)

Current Cached Endpoints:
| Endpoint | Key | TTL (default) | Invalidation Tag |
|----------|-----|---------------|------------------|
| GET /api/materials/categories | materials:categories | 30s (env override) | materials |
| GET /api/materials/low-stock | materials:lowStock | 15s (env override) | materials |

Environment Variables:
- `CACHE_TTL_MATERIAL_CATEGORIES_MS` – override categories TTL
- `CACHE_TTL_MATERIALS_LOW_STOCK_MS` – override low-stock TTL
- (Planned) `CACHE_REDIS_URL` – activate Redis-backed adapter (future)

Extending Caching:
1. Import helpers: `withCache, cacheKeys, cacheTags`
2. Wrap DB/aggregation: `const data = await withCache(key, ttlMs, async () => {...}, [cacheTags.materials])`
3. Invalidate on writes: `invalidateTag(cacheTags.materials)`

Observability:
Fetch `/api/metrics/prometheus` and look for counters:
- `cache_hit_total`, `cache_hit_materials_categories` (per-key)
- `cache_entries` gauge etc.

Planned Enhancements:
- Redis adapter / distributed invalidation
- Stale-while-revalidate for heavier analytics
- Prefetch hot keys at startup

## Background Jobs (Phase 6 In Progress)
An in-memory job queue handles async/offloaded tasks.

Implemented:
- In-memory runner with concurrency control & retries
- Metrics: jobs.enqueued / processed / failed / retried + gauges (jobs.queue.length, jobs.queue.running)
- KPI snapshot aggregation job handler (`kpi.snapshot`)
- Simple interval scheduler (`scheduler.schedule`) with metrics (scheduler.scheduled / triggered / cancelled)
- Delayed job enqueue API (feature flag `ENABLE_DELAYED_JOBS=true`) supporting `delayMs`
- Latency histogram for job processing (`jobs.latency.ms` buckets)
- Analytics summary cache warming job (flag via `ANALYTICS_SUMMARY_WARM_INTERVAL_MS`)

Env Flags:
- `ENQUEUE_KPI_ON_START=true` to enqueue a KPI snapshot at boot
- `ENABLE_JOB_ENQUEUE=true` exposes POST `/api/jobs/kpi-snapshot`
- `KPI_SNAPSHOT_INTERVAL_MS` recurring enqueue interval
- `ENABLE_DELAYED_JOBS=true` enables `/api/jobs/enqueue` endpoint
- `ANALYTICS_SUMMARY_WARM_INTERVAL_MS` warms analytics summary cache

Extending:
1. Register new handler in `initializeJobs()` or external module
2. `jobQueue.enqueue('type', { payload })`
3. Add tests under `tests/unit/`

## Upcoming Work (Refined Phase Roadmap)

Phase 5 Status: Core caching complete (categories + low-stock), invalidation verified, write-through optimization added. Remaining (deferred): Redis adapter, stale-while-revalidate, pre-warm.

Phase 6 Next Steps:
- Add simple interval scheduler (e.g., setInterval wrapper) to enqueue `kpi.snapshot` periodically (configurable env var).
- Implement delayed job enqueue API with validation (optional feature flag).
- Add background task for proactive cache warming of analytics summary.

Phase 7 Initial Targets:
- Analytics trends endpoint (e.g., rolling 7/30-day material category counts).
- Category distribution & turnover metrics (materials created vs. consumed placeholder logic).
- CSV export for KPI snapshots and materials list with streaming response and ETag.
- Apply caching + ETag pattern across new analytics routes (reuse `withCache`).

Phase 8 (Preview): PWA shell, offline caching strategy, responsive refinements.

Testing Strategy Additions Planned:
- Unit tests for scheduler logic.
- Integration tests for analytics trend endpoints and CSV export (content-type & row count assertions).
- Performance smoke test measuring cache hit rate after warm-up.
