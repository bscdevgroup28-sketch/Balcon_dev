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

## Phase 17: Latency Attribution Mini-Spans (Planned)
Planned Approach:
- Lightweight timing inside request lifecycle (middleware start, controller execution, DB query aggregate) stored in in-memory rolling stats.
- New gauges (planned): `latency.attr.http.controller_pct`, `latency.attr.db.query_pct`, `latency.attr.other_pct`.
Status: Not yet implemented (guard rails prioritized first). Can be merged after confirming CI stability.

## Phase 18: Cardinality Governance & Dimension Budgets (Planned)
- Track unique counts of dynamic label sets (e.g., distinct status codes, dynamic event types) and expose `cardinality.dimension.<name>` gauges.
- Threshold env vars: `CARDINALITY_MAX_<DIM>` (alert when exceeded).
Status: Pending; design in progress.

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
