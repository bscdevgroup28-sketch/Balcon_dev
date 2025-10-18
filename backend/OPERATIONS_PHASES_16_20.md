# Phases 16–20 Roadmap & Implementation Notes

## Phase 16: Automated Operational Guard Rails & Adaptive Tuning

Objectives:
- Enforce metrics schema & performance regression gates in CI.
- Nightly analytics + capacity pipeline automation.
- Provide artifacts (support bundle, perf history) for audit.

Deliverables Implemented:
- `.github/workflows/ci-guard.yml` (build, smoke, schema drift, perf guard, support bundle artifact).
- `.github/workflows/nightly-analytics.yml` (scheduled residual/anomaly/capacity/scaling chain + artifacts).

Deferred (optional follow-up):
- Auto-comment on PR summarizing guard results.
- Adaptive threshold auto-tuner (dynamic multiplier) – placeholder for Phase 18 refinement.

## Phase 17: Latency Attribution Mini-Spans (Implemented)
Approach:
- Lightweight timing inside request lifecycle (middleware start, controller execution, DB query aggregate) stored in in-process rolling stats.
- Gauges: `latency.attr.sample_count`, `latency.attr.avg_total_ms`, `latency.attr.db_pct`, `latency.attr.handlers_pct`, `latency.attr.other_pct`, and per-bucket averages: `latency.attr.total.ms.avg`, `latency.attr.db.ms.avg`, `latency.attr.handlers.ms.avg`, `latency.attr.other.ms.avg`, `latency.attr.count`.
Implementation:
- Middleware `middleware/latencyAttribution.ts` records per-request buckets.
- Sequelize patch `instrumentation/queryMonitor.ts` attributes DB time per request and logs slow patterns.
- `appEnhanced.ts` wraps route handlers to measure controller time excluding DB.
Usage:
- Scrape `/api/metrics/prometheus` and plot the attribution gauges to identify DB-bound vs handler-bound latency shifts.
- Use slow query diagnostics endpoints (if enabled) to correlate DB-bound spikes with query patterns.
Status: Complete.

## Phase 18: Cardinality Governance & Dimension Budgets (Implemented)
- Track unique counts of dynamic label sets (e.g., HTTP status codes, route paths [sampled], webhook event types, slow DB query pattern hashes) and expose `cardinality.dimension.<name>` gauges for unique, budget, and remaining.
- Violation counters: `cardinality.budget_violation` and per-dimension `cardinality.budget_violation.<dim>`.
- Threshold env vars: `CARDINALITY_MAX_<DIM>` for each dimension (defaults to 1000 if unset). See DEPLOYMENT_SETUP.md for recommended values.
Usage:
- Scrape Prometheus metrics and alert on `cardinality.budget_violation` or set dashboards on `cardinality.dimension.<dim>.budget_utilization_pct`.
Status: Complete.

## Phase 19: Self-Healing Advisory Hooks (Planned)
- Emit structured advisory events when `scaling.advice.code` >= 3 for sustained windows.
- Optional webhook: POST to `OPS_ADVISORY_WEBHOOK` with JSON payload.
Status: Pending.

## Phase 20: Forecast Quality & Model Upgrade (Planned)
- Introduce baseline vs improved residual quality metrics (MAPE / WAPE gauges).
- Optional ARIMA-lite or exponential smoothing attempt with fallback on degradation.
Status: Pending.

## Next Immediate Implementation Candidates
1. Phase 17 latency attribution instrumentation.
2. Phase 18 cardinality gauges + budgets.
3. Add ARIMA-lite stub & error fallback (Phase 20 foundation).
4. Advisory webhook integration (Phase 19) with retry + backoff.

## Operational KPI Targets Post Phase 16
- Schema drift incidents: 0 in main branch.
- Perf guard failures resolved before merge (>95% pass rate on merged PRs).
- Nightly analytics artifacts retained (last 7 snapshots).
- Capacity gauges present & updated within 24h of any deploy.

---
Generated: 2025-09-29
