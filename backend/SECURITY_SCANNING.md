# Security Scanning & Error Monitoring Integration Plan

This document outlines recommended tooling and integration steps for runtime error monitoring and dependency/security scanning.

## 1. Runtime Error Monitoring (Sentry)

Environment variables:
| Variable | Purpose |
|----------|---------|
| SENTRY_DSN | Sentry project DSN to enable ingestion |
| SENTRY_TRACES_SAMPLE_RATE | Fraction (0.0–1.0) of transactions for performance tracing (default 0.1) |

Implementation status:
- Sentry initialization hook present in `monitoring/metrics.ts` (`initSentry` function) invoked during app start.
- If `SENTRY_DSN` not set, initialization is skipped with an info log.

Recommended next steps:
1. Create project in Sentry (Backend / Node).
2. Add `SENTRY_DSN` secret to deployment platform.
3. Optionally adjust sample rate via `SENTRY_TRACES_SAMPLE_RATE` (start 0.05–0.1 to reduce volume).
4. (Later) Add manual breadcrumbs for critical domain events (exports, webhooks, rotation anomalies).

## 2. Dependency Vulnerability Scanning

Options:
- GitHub Advanced Security (Dependabot + CodeQL) if available.
- Snyk (`snyk test` on CI) – requires adding token secret.
- npm audit (lightweight; already implicitly available) – can add explicit CI stage.

Proposed minimal integration:
1. Add GitHub workflow: weekly `npm audit --production` for backend and frontend.
2. (Optional) Add CodeQL workflow if languages supported (JavaScript/TypeScript already). CodeQL catches common vulnerability patterns.
3. Document remediation flow (issue created → patch version bump → retest).

## 3. Static Application Security Testing (SAST)
- ESLint security plugins (e.g., eslint-plugin-security) can be added to detect insecure patterns.
- Consider adding `npm run lint:security` script bundling these rules.

## 4. Secret Leak Prevention
Current mitigations:
- `.env` in gitignore.
- Documentation warns not to commit secrets.
Future enhancements:
- Add secret scanning pre-commit hook (git-secrets or detect-secrets) & CI job.

## 5. Supply Chain Integrity
- Pin critical packages or use lockfile integrity checks (lockfile already in repo).
- Add CI step verifying `npm ci` produces no modified lockfile diffs.

## 6. Container / Deployment (If Containerizing Later)
- Use distroless or minimal base image.
- Run as non-root; drop capabilities.
- Add image scanning (Trivy / Grype) in pipeline.

## 7. Operational Alerts for Security-Sensitive Events
Leverage existing metrics or add new counters:
| Event | Metric (add if missing) | Action |
|-------|-------------------------|--------|
| Rate limit abuse | http.errors.429 | Alert if sustained high rate |
| Auth failures spike | auth.failures (planned) | Investigate credential stuffing |
| Token cleanup anomalies | tokens.cleanup.removed | Audit rotation & retention logic |

## 8. Roadmap Items
| Priority | Item | Notes |
|----------|------|-------|
| High | Enable Sentry DSN in production | Immediate visibility into runtime exceptions |
| High | Add weekly audit workflow | Detect vulnerable transitive deps |
| Medium | Add CodeQL workflow | Deeper static analysis |
| Medium | Add auth failure counter | Extend metrics instrumentation |
| Low | Secret scanning CI | Defense-in-depth |
| Low | SAST lint rules | Quick wins for common pitfalls |

---
Update this document as each layer is implemented. PRs modifying security posture should reference it.
