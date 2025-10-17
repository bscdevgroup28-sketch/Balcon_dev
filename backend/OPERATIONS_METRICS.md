# Operations Metrics Guide

This document explains the purpose of the core runtime / infrastructure metrics exposed by the backend and how to interpret them.

## Accessing Metrics

- JSON snapshot: `GET /api/metrics` (or `/api/metrics/raw`) – returns single JSON object.
- Prometheus format: `GET /api/metrics/prometheus` (requires `METRICS_AUTH_TOKEN` if configured).
- Diagnostics (if `DIAG_ENDPOINTS_ENABLED=true`):
  - `/api/metrics/patterns` – aggregated slow DB query patterns.
  - `/api/metrics/slow-queries` – recent individual slow queries (truncated SQL).

Production recommendation: disable diagnostics (`DIAG_ENDPOINTS_ENABLED=false`) and secure Prom scrape with `METRICS_AUTH_TOKEN`.

## Metric Families

### HTTP
| Metric | Type | Meaning | Notes |
|--------|------|---------|-------|
| http.requests.total | counter | Total HTTP requests received | Increments on every request early in pipeline |
| http.response.status.<code> | counter | Per-status code counts (e.g. 200, 404) | High cardinality over very long retention; aggregate if needed |
| http.errors.total | counter | Requests with status >= 400 | Includes client + server errors |
| http.errors.5xx | counter | Server error responses | Primary availability indicator |
| http.errors.429 | counter | Rate limited responses | Watch for abuse or mis-configured limits |
| http.latency.lt_100ms / lt_300ms / lt_1000ms / ge_1000ms | counter | Distribution buckets by request duration | Crude latency classification (can derive % of fast requests) |
| http.response.status_class.<n>xx | counter | Aggregated status class counts (1xx–5xx) | Lower-cardinality alternative to per-code |
| http.errors.5xx.rate_5m_per_min | gauge | Rolling 5-minute per-minute rate of 5xx | Internal rolling window |
| http.errors.5xx.anomaly_score | gauge | EMA-based upward anomaly score for 5xx (early spike detector) | Experimental |

### Tokens / Auth
| Metric | Type | Meaning |
|--------|------|---------|
| tokens.refresh.total | gauge | Total refresh tokens (cached snapshot) |
| tokens.refresh.active | gauge | Active (non-revoked) refresh tokens |
| tokens.cleanup.runs | counter | Number of cleanup executions since process start |
| tokens.cleanup.removed | counter | Total removed token rows by cleanup |
| tokens.cleanup.removed_last_run | gauge | Rows removed by most recent cleanup |
| tokens.cleanup.last_run_epoch_ms | gauge | Epoch ms timestamp of last cleanup run |
| auth.success | counter | Successful JWT validations |
| auth.failures | counter | Failed auth attempts (missing / invalid / expired) |
| auth.failures.ratio | gauge | auth.failures / (auth.failures + auth.success) |
| auth.failures.rate_5m_per_min | gauge | Rolling 5m per-minute rate of auth failures |
| auth.failures.anomaly_score | gauge | EMA-based upward anomaly score (0=normal; >3 potential spike) |

Observability Note: A sudden spike in `auth.failures` without corresponding `auth.success` growth can indicate credential stuffing or automation. Pair with lockout metrics (see security metrics export) and consider temporarily enabling diagnostics for deeper investigation.

### Database
| Metric | Type | Meaning |
|--------|------|---------|
| db.query.duration.ms (histogram) | histogram counters | Query latency distribution (buckets) |
| db.pool.acquire.wait.ms (histogram) | histogram counters | Connection pool acquisition wait times |
| db.slow_query.total | counter | Count of slow queries (>= threshold) since start |
| db.slow_query.pattern.<hash> | counter | Per normalized slow query pattern occurrence | Hash is MD5(first 8) of normalized query text |
| db.slow_query.rate_5m_per_min | gauge | Rolling 5-minute per-minute rate of slow queries | Derived in-process |
| db.pool.in_use | gauge | Currently checked-out pool clients |
| db.pool.free | gauge | Currently idle available clients |
| db.pool.pending_acquires | gauge | Requests waiting for a connection |
| db.pool.size_configured | gauge | Configured max pool size |
| db.pool.utilization_ratio | gauge | in_use / size_configured |

### Jobs / Exports / Webhooks
| Metric | Type | Meaning |
| jobs.queue.length | gauge | Current queued jobs |
| jobs.queue.running | gauge | Actively running jobs |
| jobs.pending.oldest_age_ms | gauge | Age of oldest pending job |
| jobs.latency.ms | histogram | Job execution duration |
| export.duration.ms | histogram | Export execution duration |
| exports.completed / exports.failed | counter | Export result counts |
| webhook.delivery.latency.ms | histogram | Webhook delivery time |
| webhooks.delivered / webhooks.failed | counter | Webhook delivery outcomes |
| webhooks.failure_rate | gauge | failed / (delivered+failed) |
| circuit.<name>.state_code | gauge | 0=closed,1=open,2=half-open |
| circuit.<name>.failures_consecutive | gauge | Current consecutive failures leading to open state |
| cache.hit_ratio | gauge | cache.hit / (cache.hit + cache.miss) |
| http.latency.p50_ms | gauge | Recent in-process sampled request latency p50 (rolling sample) |
| http.latency.p95_ms | gauge | Recent request latency p95 |
| http.latency.p95.anomaly_score | gauge | EMA-based z-score spike detector for p95 (>=3 considered anomalous) |
| ratelimit.global.adaptive_max | gauge | Adaptive global rate limiter current max window allowance |
| circuit.webhook_delivery.state_code | gauge | Circuit state for webhook outbound delivery |
| circuit.webhook_delivery.failures_consecutive | gauge | Consecutive failures for webhook delivery circuit |
| analytics.forecast.served | counter | Forecast endpoint successful responses |
| analytics.forecast.error | counter | Forecast endpoint errors |
| http.requests.rate_5m_per_min | gauge | Rolling request rate (per-minute over 5m window) |
| http.availability.5m_est | gauge | 1 - (5xx_rate / request_rate) over rolling 5m window |
| http.error_budget.remaining_pct | gauge | Remaining error budget percentage (target via SLO_AVAILABILITY_TARGET) |
| http.requests.rate_30m_per_min | gauge | Rolling 30m per-minute request rate |
| http.errors.5xx.rate_30m_per_min | gauge | Rolling 30m per-minute 5xx rate |
| http.availability.30m_est | gauge | 30m availability approximation |
| http.slo.burn_rate_5m_30m | gauge | Error burn ratio (5m error fraction / 30m error fraction) |
| http.slo.burn_rate_budget | gauge | (5m error fraction / error budget) >1 means budget exhausted |
| analytics.forecast.residual.<metric> | gauge | Placeholder residual (0 until forecasting residual calc added) |

### WebSocket
| Metric | Type | Meaning |
|--------|------|---------|
| ws.connections.active | gauge | Current connected authenticated users |

### Process / System
| Metric | Type | Meaning |
|--------|------|---------|
| process.uptime_ms | gauge | Process uptime |
| process.memory.rss_mb / heap_used_mb | gauge | Memory usage (MB) |
| system.load.1m / 5m / 15m | gauge | System load averages (POSIX) |
| event_loop.delay.mean_ms | gauge | Mean event loop delay (since start) |
| event_loop.delay.p95_ms | gauge | 95th percentile event loop delay | Indicates saturation / blocking |

### Security (Prometheus export)
Additional metrics from `securityMetricsToPrometheus()` appear only on `/prometheus` and cover auth attempts, lockouts, etc. (See security metrics utility for details.)

## Interpreting & Acting

| Scenario | Signals | Suggested Action |
|----------|---------|------------------|
| Surge in 5xx | http.errors.5xx rate > normal baseline | Inspect recent deploy, check logs, gather support bundle |
| Rate limit spike | http.errors.429 climbing quickly | Investigate abusive clients or mis-sized limits |
| Slow DB emerging | db.slow_query.total increasing + new pattern hash | Fetch `/api/metrics/patterns` if diagnostics enabled, add index or optimize query |
| Auth failure spike | auth.failures increasing faster than auth.success | Investigate source IPs / user agents, check rate limiting & lockout counters |
| Rising auth failure ratio | auth.failures.ratio > baseline + threshold | Potential credential stuffing or brute force attempt |
| Token table bloat | tokens.refresh.total rising steadily while active flat | Shorten retention or investigate rotation anomalies |
| Cleanup stalled | tokens.cleanup.last_run_epoch_ms stale (> interval * 2) | Restart pod / inspect scheduler logs |
| WebSocket disconnect wave | ws.connections.active drops sharply | Network incident or backend restart – correlate with deploys |

## Deriving Simple SLOs (Example)

```
Availability (5xx focused) = 1 - (rate(http_errors_5xx[5m]) / rate(http_requests_total[5m]))
Fast Request % = (http_latency_lt_300ms) / http_requests_total (windowed difference)
Slow Query Rate = increase(db_slow_query_total[10m])
Auth Failure Ratio = increase(auth_failures[5m]) / (increase(auth_success[5m]) + 1)
Auth Failure Rolling Rate = auth_failures_rate_5m_per_min (direct gauge)
```

## Support Bundle
Generate quick triage snapshot:
```
npm run ops:support-bundle > bundle.json
```
Contains metrics snapshot, slow patterns, recent slow queries, token cleanup state, manifest hash and selected env flags.

## Best Practices
- Keep `DIAG_ENDPOINTS_ENABLED=false` in production.
- Always set `METRICS_AUTH_TOKEN` in production to protect `/prometheus`.
- Use a dedicated metrics/observability namespace in infrastructure for scraping.
- Treat pattern hash counters as ephemeral (not suitable for long-term cardinality-sensitive backends unless whitelisted).
- Review token cleanup removals; unexpected spikes can indicate credential churn or abuse.
 - Track `auth.failures` baseline per minute; define an alert once real traffic stabilizes (e.g., > 5x baseline for 5m or failure ratio > 0.2).
 - Use anomaly scores (`auth.failures.anomaly_score`, `http.errors.5xx.anomaly_score`) for early spike detection; start with alert threshold ~3 and refine after observing noise.
 - Watch `db.pool.utilization_ratio`; sustained >0.8 plus rising `db.pool.pending_acquires` indicates need to scale DB or app replicas.
 - Alert on circuit breaker openings (`increase(circuit_s3_transition_open[5m]) > 0`) correlated with upstream dependency issues.
- Establish multi-window burn-rate pattern for 5xx vs request volume (see `ALERTS_EXAMPLES.md`).

## Roadmap Enhancements (Planned)
- Rolling 5m rate gauges for http.errors.5xx & db.slow_query.total
 (Implemented) Rolling 5m rate gauges for http.errors.5xx & db.slow_query.total
 (Implemented) Event loop delay gauges
 (Implemented) Aggregated status-class counters (1xx–5xx)
- Optional disable flag for pattern metrics
- Formal Prometheus alert rule bundle (initial draft below)
 - Sentry performance transaction sampling & release health linking
 (Implemented) Basic anomaly gauges (auth.failures / http.errors.5xx) with configurable alpha & log thresholds (`ANOMALY_ALPHA`, `ANOMALY_LOG_THRESHOLD`, `ANOMALY_LOG_SUPPRESS_MS`)

## Sentry Integration
Sentry is optionally initialized if `SENTRY_DSN` is present at startup (see `initSentry` in `monitoring/metrics.ts`).

Environment Variables:
- `SENTRY_DSN` – Enables Sentry error & performance capture when set.
- `SENTRY_TRACES_SAMPLE_RATE` – (Default 0.1) Adjust for transaction sampling overhead.
- `SENTRY_RELEASE` – Optional release identifier (e.g. git SHA or semver) for release health & issue correlation.

Operational Guidance:
- Start with low sample rate (0.1) and adjust after profiling overhead.
- Tag releases by setting `SENTRY_RELEASE` (extend `initSentry` if release tracking desired).
- For high-volume noisy errors, add server-side filtering or grouping rules in Sentry.

## Starter Prometheus Alert Rules (Inline Reference)
See `ALERTS_EXAMPLES.md` for rationale. A deployable rule group example (convert metric names if dots are replaced with underscores):

```
groups:
  - name: balcon-core
    interval: 30s
    rules:
      - alert: High5xxErrorRate
        expr: rate(http_errors_5xx[5m]) > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High 5xx error volume
          runbook: https://internal/runbooks/balcon#5xx
      - alert: SlowQuerySurge
        expr: increase(db_slow_query_total[10m]) > 10
        for: 10m
        labels:
          severity: high
        annotations:
          summary: Slow DB queries increasing
          runbook: https://internal/runbooks/balcon#db-slow
      - alert: AuthFailureSpike
        expr: (increase(auth_failures[5m]) > 50) and (increase(auth_failures[5m]) / (increase(auth_success[5m]) + 1) > 0.3)
        for: 5m
        labels:
          severity: high
        annotations:
          summary: Authentication failures spiking
          runbook: https://internal/runbooks/balcon#auth-failures
      - alert: TokenCleanupStalled
        expr: (time() * 1000 - tokens_cleanup_last_run_epoch_ms) > 3600000
        for: 15m
        labels:
          severity: medium
        annotations:
          summary: Token cleanup has not run in >1h
          runbook: https://internal/runbooks/balcon#token-cleanup
```

For production commit these rules into infrastructure-as-code (Terraform / Helm) rather than relying on this inline snippet.

## Security Scanning & Static Analysis Triage
Automated workflows (CodeQL, secret scanning via Gitleaks) run in CI. Expectations:
- Pull Requests must address new HIGH or CRITICAL CodeQL findings before merge.
- Secret scan failures (true positives) block merge; regenerate & revoke any leaked credentials immediately.
- Document false positive suppression rationale in PR description referencing rule identifier.

## Incident Triage Quick Steps
1. Generate support bundle (`npm run ops:support-bundle`).
2. Check rolling rates: `http.errors.5xx.rate_5m_per_min`, compare to baseline.
3. Inspect auth failure ratio; if anomalous, enable enhanced request/body logging (feature flag TBD) for short window.
4. Review slow query patterns (temporarily enable diagnostics if disabled) then disable again.
5. Escalate with metrics snapshots attached to ticket.

## Performance Regression Guard
Automated check to catch degradations between the last two saved performance baselines (stored in `perf-history/`).

Workflow Example:
1. Run/load system locally or in ephemeral env.
2. Capture fresh baselines:
   - `npm run perf:auth:save`
   - `npm run perf:projects:save` (requires `PERF_ACCESS_TOKEN`)
3. Commit or archive the new `perf-history/*.json` files (in CI you may artifact them instead of committing).
4. Execute guard: `npm run perf:guard`

Default Thresholds (override via env):
- `MAX_P95_INCREASE_PCT` (default 20)
- `MAX_P50_INCREASE_PCT` (default 15)
- `MAX_RPS_DROP_PCT` (default 15) – absolute drop percentage allowed; larger drop fails.

Example CI Gate (pseudo YAML):
```
steps:
  - run: npm run build
  - run: npm run perf:auth:save
  - run: npm run perf:projects:save
  - run: npm run perf:guard
```

If the guard fails it prints JSON with violations and exits non‑zero. Adjust thresholds after establishing real baselines; keep initial values conservative to avoid noise.

### Golden Baseline Mode
An optional median-based “golden” baseline is generated with `goldenBaseline.ts` (median of last N=5 by default). Enable comparison against both previous and golden by setting `USE_GOLDEN=1`. The guard then uses the worse (more regressing) delta between previous and golden to decide violations.

Environment Variables:
- `USE_GOLDEN=1` – activate golden comparison.
- `GOLDEN_WINDOW` – number of historical runs to include (default 5).

Golden file: `perf-history/golden-baseline.json` (auto-generated in CI workflow before guard execution).

### Regression Guard Markdown Summary
When `GITHUB_STEP_SUMMARY` is exposed (GitHub Actions) or `PERF_MD=1`, a Markdown table is emitted to `perf-history/regression-summary.md` (and appended to the step summary in CI) showing per-scenario deltas and violations.

### Adaptive Rate Limiting
`ratelimit.global.adaptive_max` shrinks below configured static max when either `http.errors.5xx.rate_5m_per_min` exceeds 5–10 or `http.latency.p95.anomaly_score` exceeds 2.5–4, shedding load proactively. Floor of 50 requests per window to avoid total lockout.

### Analytics Forecast Endpoint
`GET /api/analytics/forecast?metric=ordersCreated&horizon=14` returns a lightweight naive linear forecast across historical KPI snapshots. Metrics emitted: `analytics.forecast.served`, `analytics.forecast.error`. Cached with TTL (`CACHE_TTL_ANALYTICS_FORECAST_MS`) and limited to horizon <= 60 days. This is a placeholder for future more robust forecasting.

### SLO & Error Budget Metrics (Phase 8)
`http.availability.5m_est` approximates availability using rolling 5xx vs total request rate. Configure `SLO_AVAILABILITY_TARGET` (e.g., 0.995). The remaining error budget gauge expresses how much of the allowed error window remains (100% = no budget consumed). When `http.error_budget.remaining_pct` drops below 50%, raise an early warning; below 0% triggers a burn alert.

### Synthetic Probes
`syntheticProbe.ts` script can be scheduled externally (or in a lightweight cron job) to produce independent availability measurements across critical endpoints. Persisted history (`probe-history/probe-history.json`) offers quick trend review during incidents.

### Phase 9 Enhancements
- 30m window availability & rates: `http.requests.rate_30m_per_min`, `http.errors.5xx.rate_30m_per_min`, `http.availability.30m_est`.
- Burn rate gauges: `http.slo.burn_rate_5m_30m` (ratio > 2 sustained indicates fast burn), `http.slo.burn_rate_budget` (>1 => error budget exhausted for SLO target).
- Forecast residual placeholders for future anomaly-on-residual detection: `analytics.forecast.residual.*` (currently 0 until model integration).
- Flag `DISABLE_HTTP_STATUS_CODE_METRICS=true` to suppress per-status code counters if cardinality pressure arises (status_class counters continue).

### Phase 10 Additions
- Metrics health endpoint: `GET /api/metrics/health` returning consolidated availability, burn rate, error budget remaining, anomaly scores (auth failures, 5xx, latency p95) and derived status (healthy|degraded|critical).
- Forecast residual pipeline: `computeForecastResiduals.ts` + `updateResidualGauges.ts` populate `analytics.forecast.residual.*` gauges and directional counters `analytics.forecast.residual_positive.*` / `analytics.forecast.residual_negative.*`.
- Use residuals to build next-phase anomaly-on-residual (reduces noise vs raw metric anomalies).

CI Integration: The GitHub Actions workflow `perf-regression.yml` (daily + PR trigger) runs auth & projects baselines, persists results, executes the guard, and uploads `perf-history` artifacts. Tune `PERF_CONN` / `PERF_DURATION` in the workflow if test time or stability needs adjustment.

### Phase 11 Additions
- Residual anomaly score gauges: `analytics.forecast.residual_anom_score.<metric>` (z-score like; +3 or higher => significant positive deviation, -3 => significant negative deviation). These are computed from the set of current residuals across metrics (simple population z-score). Use in tandem with directional residual counters to reduce false positives vs raw anomalies.
- Capacity derivation metrics from step load tests:
  - `capacity.max_rps` – Highest stable requests/sec observed before first error/timeout step.
  - `capacity.optimal_connections` – Concurrency level achieving `capacity.max_rps`.
  - `capacity.scale_suggestion_code` – 0=healthy headroom, 1=approaching limit (consider scale planning), 2=scale recommended soon (max stable RPS below minimal threshold).

Capacity Workflow Example:
1. Run step load: `ts-node src/scripts/perf/stepLoadTest.ts http://localhost:8082/api/projects 120 10 > perf-history/step-load-<ts>.json` (or via future npm script).
2. Build & run derive: `npm run build && npm run capacity:derive`.
3. Update gauges: `npm run capacity:update` (loads `capacity-derived/capacity-latest.json` into in-process cache gauges).
4. Scrape metrics: verify `capacity.*` values appear.

Residual Anomaly Flow:
1. Compute residuals: `npm run analytics:residuals`.
2. Update residual gauges: `npm run analytics:residuals:update`.
3. Compute residual anomaly scores: `npm run analytics:residuals:anom`.
4. Update anomaly score gauges: `npm run analytics:residuals:anom:update`.

Alerting Starters:
```
 - alert: ResidualAnomalyOrdersCreatedHigh
   expr: analytics_forecast_residual_anom_score_ordersCreated > 3
   for: 10m
   labels: { severity: warning }
   annotations:
     summary: Orders created residual anomaly high (positive deviation)
 - alert: CapacityScaleSoon
   expr: capacity_scale_suggestion_code == 2
   for: 5m
   labels: { severity: high }
   annotations:
     summary: Capacity threshold reached – scaling recommended
```

Interpretation:
- Positive residual anomaly score means actual exceeded forecast; negative means underperformed. Focus on large magnitude sustained deviations, not single-sample noise.
- Capacity suggestion code 1 is an early planning signal; code 2 should trigger either horizontal scaling or service optimization action items.

### Phase 12 Additions (Adaptive Residual Thresholding)
Objective: Reduce alert fatigue and contextualize residual deviations per metric by computing dynamic (mean ± K·std) bands over rolling residual history.

New Scripts:
- `analytics:residuals:history` – Append latest residuals into rolling history (bounded by RESIDUAL_HISTORY_MAX_SAMPLES, default 500).
- `analytics:residuals:adaptive` – Compute per-metric thresholds (mean/std/upper/lower) from history.
- `analytics:residuals:adaptive:update` – Load thresholds into in-process cache for gauges.

New Gauges:
- `analytics.forecast.residual_dev_pct.<metric>` – Percent deviation of latest residual vs adaptive mean ( (residual - mean)/|mean| * 100 ). Only non-zero when sufficient samples (>= RESIDUAL_THRESHOLD_MIN_SAMPLES; default 20) and threshold set is ready.

Workflow (Extended Residual Pipeline):
1. `npm run analytics:residuals` – Compute residuals.
2. `npm run analytics:residuals:update` – Load residual gauges.
3. `npm run analytics:residuals:history` – Append to history store.
4. `npm run analytics:residuals:adaptive` – Recompute adaptive thresholds.
5. `npm run analytics:residuals:adaptive:update` – Load threshold cache for deviation gauges.
6. (Optional) `npm run analytics:residuals:anom` + `npm run analytics:residuals:anom:update` – Maintain z-score anomaly layer in parallel.

Environment Variables:
- `RESIDUAL_HISTORY_MAX_SAMPLES` (default 500) – Cap per-metric stored samples.
- `RESIDUAL_THRESHOLD_STD_K` (default 3) – Multiplier for std when computing upper/lower.
- `RESIDUAL_THRESHOLD_MIN_SAMPLES` (default 20) – Minimum sample count required before a metric is considered "ready".

Alerting Example (Adaptive Deviation):
```
 - alert: OrdersResidualHighAdaptive
   expr: analytics_forecast_residual_dev_pct_ordersCreated > 40
   for: 15m
   labels: { severity: warning }
   annotations:
     summary: Orders created residual >40% above adaptive mean
```

Guidance:
- Use adaptive deviation for sustained shifts; use residual_anom_score for spike detection.
- Consider multi-condition alerts (both deviation % and anomaly score) to reduce noise.
- Store history artifact periodically for forensic reviews (e.g., archive analytics-derived/residual-history.json daily).

### Phase 13 Additions (Predictive Scaling Advisory)
Objective: Provide proactive scaling signals combining capacity headroom, SLO burn, and growth anomaly indicators to reduce reactive firefighting.

New Gauges:
| Metric | Meaning |
|--------|---------|
| scaling.headroom.rps_pct | Percentage of remaining RPS headroom (0–100%) relative to derived capacity.max_rps. |
| scaling.scale_trigger_threshold_rps | Static 80% of max_rps threshold (informational) |
| scaling.advice.code | 0=none,1=monitor,2=scale_soon,3=scale_now |
| scaling.advice.reason_code | 0=none,1=headroom_low(<30%),2=burn_budget_exceeded,3=burn_ratio_high,4=headroom+burn_ratio,5=headroom+burn_budget |
| scaling.forecast.max_rps_next | Simple projected next max_rps using residual anomaly (ordersCreated) as a growth proxy |

Script:
- `scaling:advice` – Generates `scaling-derived/scaling-advice.json` snapshot merging capacity + snapshot metrics (if exported) for external consumers.

Decision Logic (inline in gauges):
- advice.code escalates when headroom% shrinks below thresholds or burn metrics exceed limits.
- reason_code pinpoints dominant or combined trigger.

Suggested Alerting:
```
 - alert: ScaleSoon
   expr: scaling_advice_code == 2
   for: 10m
   labels: { severity: warning }
 - alert: ScaleNow
   expr: scaling_advice_code == 3
   for: 5m
   labels: { severity: critical }
```

Operational Use:
- Pair advice.code with capacity.* gauges to open scale ticket before saturation.
- Track trend of scaling.headroom.rps_pct; falling with rising burn_rate_budget indicates risk compounding.
- scaling.forecast.max_rps_next > capacity.max_rps signals likely imminent limit (pre‑scale window).

Future Enhancements:
- Replace static 80% trigger with percentile of historical saturation onset.
- Integrate latency p95 inflection slope as an additional early signal.
- Incorporate multi-metric growth vector (orders + deliveries) rather than single metric anomaly.

### Phase 18 Additions (Cardinality Governance & Budgets)
Objective: Detect and prevent unbounded metric series growth (which drives Prometheus TS churn, memory use, and scrape amplification). Focus areas are dynamic counter name families like `db.slow_query.pattern.<hash>` and (optionally) per-status code counters.

Approach:
1. Define series groups via simple regex prefix patterns.
2. Track distinct metric names observed per group since process start.
3. Track additions within a rolling 5‑minute window (signals bursty explosions separate from cumulative total).
4. Expose per-group budgets (soft / hard) with violation gauges and utilization %.
5. Emit structured warning/error logs the first time each budget threshold is crossed (rate-limited by `CARD_GOV_LOG_SUPPRESS_MS`).

New Gauges (per group `<g>` where g = db.slow_query.pattern | http.response.status | http.response.status_class | events.dynamic):
| Metric | Meaning |
|--------|---------|
| cardinality.<g>.series_total | Distinct metric names seen matching the group pattern |
| cardinality.<g>.series_added_5m | Count of new distinct series first seen in last 5 minutes |
| cardinality.<g>.soft_budget / hard_budget | Configured budgets (soft=warning, hard=violation) |
| cardinality.<g>.budget_utilization_pct | (series_total / hard_budget)*100 (capped 100) |
| cardinality.<g>.violation_level | 0=OK,1=soft reached,2=hard exceeded |

Aggregate Governance Gauges:
| Metric | Meaning |
|--------|---------|
| cardinality.governance.groups_with_soft_violations | Count of groups currently in soft violation |
| cardinality.governance.groups_with_hard_violations | Count of groups exceeding hard budget |
| cardinality.governance.groups_total | Total configured cardinality groups |

Configuration (Environment Variables):
| Variable | Default | Scope |
|----------|---------|-------|
| CARD_SOFT_DB_SLOW_PATTERN | 50 | Soft budget for slow query pattern series |
| CARD_HARD_DB_SLOW_PATTERN | 200 | Hard budget for slow query pattern series |
| CARD_SOFT_HTTP_STATUS | 120 | Soft budget for individual HTTP status code counters |
| CARD_HARD_HTTP_STATUS | 512 | Hard budget for individual HTTP status counters |
| CARD_SOFT_EVENTS_DYNAMIC | 100 | Soft budget placeholder for future dynamic event counters |
| CARD_HARD_EVENTS_DYNAMIC | 400 | Hard budget placeholder for future dynamic event counters |
| CARD_GOV_LOG_SUPPRESS_MS | 60000 | Minimum ms between governance log batches |

Operational Guidance:
- Alert on `cardinality.<g>.violation_level == 1` (warning) sustained 10m for early remediation; page only on `== 2`.
- For slow query patterns, exceeding soft budget suggests similar queries are not normalizing (review normalization regex & parameterization). Exceeding hard likely requires hash retention reset or grouping strategy change.
- If HTTP status code cardinality exceeds soft budget, you may be generating custom pseudo-status codes or using dynamic paths mapped incorrectly. Consider disabling fine-grained status metrics via `DISABLE_HTTP_STATUS_CODE_METRICS=true`.
- Export cardinality snapshots periodically (support bundle already captures all metric names) and consider external diff for long-term trend.

Suggested Prometheus Alerts:
```
- alert: MetricCardinalitySoftExceeded
  expr: cardinality_db_slow_query_pattern_violation_level == 1
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: Slow query pattern series count reached soft budget
- alert: MetricCardinalityHardExceeded
  expr: cardinality_db_slow_query_pattern_violation_level == 2
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: Slow query pattern series count exceeded HARD budget
```

Remediation Playbook (Slow Query Pattern Explosion):
1. Fetch `/api/metrics/patterns` (if diagnostics allowed) – identify top N patterns.
2. Confirm normalization (numbers & quoted literals replaced) still functioning; adjust regex if necessary.
3. If legitimate new queries, evaluate adding an allowlist or raising soft budget temporarily while optimizing.
4. Consider lowering threshold for slow query logging to reduce distinct patterns (too low can inflate cardinality).
5. If emergency: temporarily disable pattern counters by feature flag (future enhancement) or short-circuit increment wrapper.

Roadmap (Post-Phase 18):
- Optional persistent ring to track eviction / aging of rarely-hit series for reporting.
- Per-group moving average of daily new series to forecast exhaustion timeline.
- Budget auto-tuning: raise soft edge if daily growth rate near zero for prolonged period.
- Export governance JSON artifact for external dashboards.

### Phase 14 Additions (Optional Tracing Integration)
Objective: Introduce lightweight, opt-in distributed tracing without hard runtime coupling, enabling span visualization & latency root cause while remaining resilient if OpenTelemetry libs are absent.

New File:
- `src/observability/tracing.ts` – Dynamic OpenTelemetry bootstrap (disabled unless `TRACING_ENABLED=true`).

New Metrics:
- `tracing.spans.http.server.total` / `tracing.spans.http.server.error`
- `tracing.spans.db.query.total` / `tracing.spans.db.query.error`

Enable Tracing:
1. Install OTel deps (example minimal set):
  - `@opentelemetry/sdk-node`
  - `@opentelemetry/auto-instrumentations-node`
  - `@opentelemetry/exporter-trace-otlp-http`
2. Set environment:
```
TRACING_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_SERVICE_NAME=balcon-backend
```
3. Start service; verify startup log `[tracing] OpenTelemetry SDK started`.

Graceful Degradation:
- If dependencies missing, a warning is logged and app continues.
- Span metrics still increment for HTTP (via wrapper) and Sequelize queries (if present).

Alerting / SLO Tie-In:
- Correlate spikes in `http.latency.p95_ms` with rise in `tracing.spans.db.query.error` to isolate DB vs app issues.
- Use span error rate as secondary condition before paging on latency anomalies.

Next Evolution:
- Add custom spans around critical business operations (quote -> order workflow) for path-level latency decomposition.
- Emit histogram for DB span durations.
- Attach trace IDs to structured logs for end-to-end correlation.

## Metrics Schema Export
Use `npm run metrics:schema` to output current metric names (counters/gauges/histograms) for drift detection or documentation sync. Set `METRICS_SCHEMA_WRITE=1` to persist timestamped schema JSON under `metrics-schema/`.
Example:
```
METRICS_SCHEMA_WRITE=1 npm run metrics:schema
```
Integrate into CI periodically to detect unexpected metric additions/removals (e.g., diff last committed schema file in a separate ops repo).

### Schema Drift Policy
Automated workflow `metrics-schema-drift.yml` runs on PRs & daily to ensure:
- No silent removals of existing metric names (removals fail the job).
- Additions are allowed but should be justified in PR description (optionally enforce via `FAIL_ON_ADDITION=1` env in future).
To intentionally update the baseline:
1. Run `npm run metrics:schema` locally.
2. Update `backend/metrics-schema/baseline.json` with new list (keep ordering & metadata fields).
3. Include rationale in commit message (e.g., "Add auth.rate_limited counter").

---
Questions or suggested additions: update this file or open an ops improvement ticket.
