# Bal-Con Builders – Operations Runbooks

This guide provides actionable steps for common alerts and operational tasks. Keep this file alongside `backend/OPERATIONS_METRICS.md` for metric names and meanings.

References
- API: `/api/metrics/prometheus` (Prometheus text format)
- Admin Ops API: `/api/ops/*` (owner/admin, CSRF-protected)
- Job Queue: pause/resume via ops endpoints
- Webhooks: redelivery via ops endpoint

General Triage Checklist
1) Confirm scope: one user, a tenant segment, or system-wide
2) Check `/api/metrics/prometheus` snapshot and Ops Console summary
3) Identify last code/config changes
4) Review logs around the time window (request IDs if available)

---

## 1. 5xx surges
Symptoms
- Alert on elevated 5xx rate or spike in `http_requests_total{status="5xx"}`

Immediate Actions
- Check Ops Console summary or metrics snapshot
- Look at `http_status_code` cardinality (bounded) and `latency` histograms
- Inspect recent deploys/config changes
- If needed, temporarily reduce load (pause bulk jobs): `POST /api/ops/jobs/pause`

Deep Dive
- Examine `db.query.duration.ms` histograms for anomalies
- Check `auth.failures` and `auth.success` for unusual patterns
- Review recent logs with request IDs

Recovery
- Roll back suspect change or hotfix
- Resume jobs: `POST /api/ops/jobs/resume`

---

## 2. Slow database
Symptoms
- Elevated `db.query.duration.ms` or slow query pattern counters

Immediate Actions
- Fetch slow query diagnostic endpoints if enabled
- Ensure DB capacity: check pool settings and Postgres resource usage

Deep Dive
- Identify patterns with highest latency and frequency
- Verify indexes against `EXPLAIN` in staging
- Consider temporary cache TTL increases for hot paths

Recovery
- Add or adjust indexes via migration
- Tune pool sizes (`DB_POOL_MAX/MIN`) and statement timeouts

---

## 3. Authentication spikes / abuse
Symptoms
- Rising `auth.failures`, 429s from auth limiter

Immediate Actions
- Monitor `auth.failures` vs `auth.success`
- Confirm rate limits in place (global + auth limiter)

Deep Dive
- Analyze source IPs; check WAF or upstream firewall rules
- Audit login attempts: suspicious patterns or reused emails

Recovery
- Tighten limits temporarily
- Enable additional bot protections if available

---

## 4. Cardinality violations
Symptoms
- Explosion of metric label values (memory pressure, scrape size growth)

Immediate Actions
- Check `backend/src/monitoring/cardinality.ts` budgets and sampling
- Identify which labels are growing (paths, user IDs, etc.)

Deep Dive
- Apply sampling or aggregation
- Remove high-cardinality labels from hot metrics

Recovery
- Redeploy with stricter budgets or reduced label sets

---

## 5. Advisory scaling
Symptoms
- Sustained high p95/p99 latency, queue backlog, CPU saturation

Immediate Actions
- Validate `jobs.queue.length` and `jobs.queue.running`
- Ensure caches are warm for hot endpoints

Deep Dive
- Increase concurrency for job queue via env if safe
- Consider horizontal scaling guidance from advisory tooling

Recovery
- Scale out instances or bump queue concurrency with caution

---

## 6. Webhook redelivery
Symptoms
- Failed webhooks accumulating; partner didn’t receive events

Immediate Actions
- Identify failed deliveries in DB (or Ops Console if available)
- Use: `POST /api/ops/webhooks/redeliver` with `{ deliveryId }`

Deep Dive
- Check `webhook.deliveries` metrics (delivered/failed)
- Verify endpoint reachability and secrets

Recovery
- Enable retry schedule or manual retries until partner is healthy
- Consider backoff tuning

---

## 7. Cache issues (stale/missing)
Symptoms
- Users see outdated data; cache miss rate unusually high

Immediate Actions
- Invalidate relevant tags via `POST /api/ops/cache/invalidate` `{ tags: [...] }`
- Confirm cache TTLs for affected endpoints

Deep Dive
- Trace tag assignment and invalidation in route handlers
- Check Redis connection health when enabled

Recovery
- Fix invalidation gaps; adjust TTLs; ensure tag coverage on all mutations

---

## 8. Data retention sweep
Symptoms
- Growth in token/idempotency/event tables; storage pressure

Actions
- Manual run: `POST /api/ops/retention/run`
- Verify metrics: `retention.*` counters and `retention.sweep.duration.ms`
- Adjust schedule with `RETENTION_CLEANUP_INTERVAL_MS`

---

Appendix
- Metrics catalog: see `backend/OPERATIONS_METRICS.md`
- Environment variables: `DEPLOYMENT_SETUP.md`
- Support bundle utilities: `src/scripts/supportBundle.ts`
