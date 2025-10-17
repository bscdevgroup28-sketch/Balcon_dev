# Configuration & Runtime Hardening (Phase 4)

## Overview
Phase 4 introduces stricter runtime safety, adaptive rate limiting, brute force protection, and surfaced security metrics.

## Environment Variables (New/Extended)
- ADV_METRICS_ENABLED (default: true unless set to 'false')
- PROM_DEFAULT_METRICS (true enables prom-client default collectors)
- AUTH_MAX_ATTEMPTS_WINDOW (default 5)
- AUTH_ATTEMPT_WINDOW_MS (default 900000 / 15m)
- AUTH_BASE_LOCK_MS (default 300000 / 5m)
- AUTH_MAX_LOCK_MS (default 3600000 / 1h)
- GLOBAL_RATE_LIMIT_WINDOW_MS (default 60000)
- GLOBAL_RATE_LIMIT_MAX (default 900 requests per IP+user/window)

## Runtime Validation
A lightweight self-check (`validateRuntime`) ensures critical settings exist (JWT secret, DB URL) and flags unsafe extremes (e.g., too-low auth attempt thresholds).

## Rate Limiting Layers
1. express-rate-limit (coarse IP window in `appEnhanced`)
2. `globalRateLimit` (LRU-based adaptive per IP+user bucket)
3. `bruteForceProtector` (credential-specific exponential backoff & lock)

## Brute Force Protection
- Tracks attempt count per (IP + email) key.
- On threshold crossing, applies exponential lock: lock = BASE_LOCK_MS * 2^(overflow-1) capped at AUTH_MAX_LOCK_MS.
- Locked responses return HTTP 429 + Retry-After header.
- Counters: `security_authLockouts`, `security_authLockActive`.

## Security Metrics
Exported via `/api/metrics/prometheus`:
- security_loginSuccess / security_loginFailure
- security_authLockouts / security_authLockActive
- refresh & token lifecycle counters
- plus process/system gauges and advanced prom-client histograms/counters.

## Tuning Guidance
| Scenario | Adjust | Notes |
|----------|--------|-------|
| Frequent false lockouts | Increase AUTH_MAX_ATTEMPTS_WINDOW | Keep reasonable (<10) to remain protective |
| High sustained throughput legitimate | Raise GLOBAL_RATE_LIMIT_MAX | Profile typical peak first |
| Observability overhead | Set ADV_METRICS_ENABLED=false | Disables advanced histograms while keeping basic metrics |

## Testing Aids
For faster lockout testing: set `AUTH_MAX_ATTEMPTS_WINDOW=3` before running `authLockout.test`.

## Future Enhancements (Phase 5+ candidates)
- Redis-backed distributed counters.
- Structured rate limit headers (X-RateLimit-Remaining etc.).
- Config lint script in CI to block unsafe prod overrides.

---
Generated as part of Phase 4 implementation.
