# Alert Examples & Suggested Thresholds

This file provides starter guidance for building alert rules (e.g., Prometheus / Alertmanager). Tune thresholds after establishing real baselines.

## Conventions
- Window choices (5m / 10m) assume moderate traffic; adjust for volume.
- Use burn-rate multi-window strategies for SLO-based alerts where possible.
- Replace metric names with underscore form if your Prometheus exposition replaces `.` with `_`.

## Core Alerts

### 1. High 5xx Error Rate
```
# Alert when > 5 5xx responses per minute for 5 minutes
rate(http_errors_5xx[5m]) > 5
```
Stronger SLO-based variant:
```
# If 5xx exceed 1% of total requests over 5m
(rate(http_errors_5xx[5m]) / rate(http_requests_total[5m])) > 0.01
```

### 2. Sustained 5xx (Multi-Window Burn Rate)
```
(rate(http_errors_5xx[5m]) / rate(http_requests_total[5m])) > 0.02
and
(rate(http_errors_5xx[30m]) / rate(http_requests_total[30m])) > 0.01
```

### 3. Slow Query Surge
```
increase(db_slow_query_total[10m]) > 10
```
If pattern labeling retained:
```
# New dominant slow pattern emergent (>5 occurrences in last 10m)
(sum by (pattern_hash) (increase(db_slow_query_pattern_total[10m])) > 5)
```
(Your current pattern metric is hashed as part of the metric name, not a label; to use label-based aggregation you'd refactor later.)

### 4. Token Cleanup Stalled
```
(time() * 1000 - tokens_cleanup_last_run_epoch_ms) > 3600000
```
(> 1 hour since last cleanup when interval expected more frequently.)

### 5. High Rate Limiting (Potential Abuse)
```
rate(http_errors_429[5m]) > 20
```
Or relative:
```
(rate(http_errors_429[5m]) / rate(http_requests_total[5m])) > 0.05
```

### 6. WebSocket Connection Collapse
```
predict_linear(ws_connections_active[5m], 300) < (ws_connections_active offset 5m) * 0.2
```
(Projects a sharp downward trend 5m into the future as an early warning.)

### 7. Export Failures Spike
```
increase(exports_failed[15m]) > 3 and (increase(exports_failed[15m]) / increase(exports_completed[15m])) > 0.2
```

### 8. Webhook Delivery Degradation
```
webhooks_failure_rate > 0.3
```
(Immediate check; consider smoothing with `avg_over_time(webhooks_failure_rate[5m]) > 0.2`.)

### 9. Slow Pool Acquire (DB Saturation Indicator)
```
(sum(increase(db_pool_acquire_wait_ms_le_500[5m])) / sum(increase(db_pool_acquire_wait_ms_le_inf[5m]))) < 0.9
```
(>10% of acquires exceeding 500ms; refine after baseline.)

### 10. Auth Failure Ratio Spike
```
auth_failures_ratio > 0.25
```
Or smoothed with window:
```
avg_over_time(auth_failures_ratio[5m]) > 0.2
```
(Tune after observing normal failure ratios; initial benign traffic often <5–10%.)

### 11. Auth Failure Anomaly Score
```
auth_failures_anomaly_score > 3
```
Multi-window (reduce noise):
```
(max_over_time(auth_failures_anomaly_score[2m]) > 3) and (avg_over_time(auth_failures_anomaly_score[5m]) > 2)
```
(Use in tandem with absolute rate guard: auth_failures_rate_5m_per_min > 5.)

### 12. 5xx Error Anomaly (Early Spike Detector)
```
http_errors_5xx_anomaly_score > 3
```
Hybrid with baseline request rate:
```
(http_errors_5xx_anomaly_score > 3) and (rate(http_requests_total[5m]) > 5)
```
This catches sharp deviations faster than simple static thresholds, especially during low traffic periods.

### 13. DB Pool Saturation
```
db_pool_utilization_ratio > 0.85 and db_pool_pending_acquires > 2
```
Multi-window confirmation:
```
avg_over_time(db_pool_utilization_ratio[5m]) > 0.8 and max_over_time(db_pool_pending_acquires[5m]) > 3
```

### 14. Circuit Breaker Open (S3)
```
increase(circuit_s3_transition_open[5m]) > 0
```
Or persistent open:
```
max_over_time(circuit_s3_state_code[2m]) == 1
```

### 15. Cache Miss Surge (Potential Upstream Strain)
```
increase(cache_miss[5m]) > (increase(cache_hit[5m]) * 0.5)
```
Refine once typical hit ratio baseline established.

### 16. Latency p95 Anomaly Spike
```
http_latency_p95_anomaly_score > 3
```
Pair with absolute p95 guard (if you export p95 separately or use this gauge directly):
```
http_latency_p95_anomaly_score > 3 and http_latency_p95_ms > 400
```

### 17. Adaptive Rate Limiter Engaged (Significant Contraction)
```
ratelimit_global_adaptive_max < (BASE_LIMIT * 0.6)
```
Where `BASE_LIMIT` is your configured nominal max (e.g., 1000). Investigate upstream dependency health & error spikes.

### 18. Webhook Delivery Circuit Open
```
max_over_time(circuit_webhook_delivery_state_code[2m]) == 1
```
Or transition detection:
```
increase(circuit_webhook_delivery_transition_open[5m]) > 0
```

## Severity Tiers (Example)
| Severity | Typical Triggers |
|----------|------------------|
| Critical | Sustained 5xx burn rate, total outage, connection collapse |
| High | Slow query surge + latency deterioration |
| Medium | Rising 429 abuse, export failure ratio spike |
| Low | Token cleanup stalled, intermittent webhook failures |

## Runbook Linkage
Each alert should link to remediation steps:
- 5xx / availability: Check recent deploy → gather support bundle → review logs.
- Slow queries: Inspect `/api/metrics/patterns` (if temporarily enabled) → evaluate missing indices → create migration.
- Cleanup stalled: Restart service or inspect scheduler logs; verify interval env vars.
- Rate limit spike: Identify offending IPs (add IP logging to rate limiter if needed) → block / adjust policy.

## Future Enhancements
- Convert pattern hash counter into labeled metric (pattern_hash label) for richer PromQL.
- Add rolling rate gauges to reduce PromQL complexity.
- Integrate alert configs into infra-as-code repository with versioning.

---
Adjust these as real production baselines emerge. Open an ops ticket to refine thresholds after first week of live traffic.
