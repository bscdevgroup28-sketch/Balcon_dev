# Performance Baseline (Auth & Core API)

Initial target baselines (to be filled after first load test run):

| Scenario | p50 (ms) | p95 (ms) | Notes |
|----------|----------|----------|-------|
| Login (POST /api/auth/login) | TBD | TBD | Includes password hash + token issue |
| Refresh (POST /api/auth/refresh) | TBD | TBD | Should be cheaper than login |
| Protected fetch (GET /api/projects) | TBD | TBD | Uses access token verification |
| Health deep (GET /api/health) | TBD | TBD | DB ping + lightweight checks |

## Load Test Plan
Tool: autocannon (script harness) or k6 (future)

Scripts (after build):
```
# Login baseline (expects seeded admin credentials or override via env)
npm run perf:auth

# Projects listing (requires PERF_ACCESS_TOKEN obtained via login call)
set PERF_ACCESS_TOKEN=eyJ... && npm run perf:projects

# Adjust concurrency and duration
set PERF_CONN=25
set PERF_DURATION=30
npm run perf:auth
```
Environment variables:
- BASE_URL (default http://localhost:8082)
- PERF_EMAIL / PERF_PASSWORD (for auth baseline)
- PERF_CONN (connections)
- PERF_DURATION (seconds)
- PERF_ACCESS_TOKEN (Bearer token for projects scenario)

Output: JSON summary printed last; copy p50/p95 into table above.

## Success Indicators
- No slow pool acquire warnings during steady load
- db.query.duration.ms histogram shows majority < 50ms
- No spike in slow query log above threshold except known heavy aggregation endpoints
 - Slow query log now includes a normalized `pattern` field (literals replaced) for easier aggregation

## After Each Significant Schema or Index Change
1. Re-run baseline scripts
2. Update table above
3. Commit diff with summarized JSON (optional store raw in reports/ if needed)

## Future Enhancements
- Segment latencies by route (middleware tagging)
- Track auth vs data endpoints separately
- Capture GC pauses if latency anomalies emerge

---
Scaffold generated; populate after first formal run.