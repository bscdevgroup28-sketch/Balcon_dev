# Bal-Con Builders – Release Checklist (RC → Customer Preview)

Use this checklist before sharing a build with a prospective customer. Complete all items or explicitly waive with rationale and owner.

References
- Backend: `backend/` (Enhanced app `src/appEnhanced.ts`), port 8082
- Frontend: `frontend/` (React app), port 3000
- Observability: `/api/metrics/prometheus`, `backend/OPERATIONS_METRICS.md`, `backend/RUNBOOKS.md`
- Security: `backend/src/middleware/*`, `backend/src/config/environment.ts`

---

## 1) Pre-Release QA Gate
- [ ] Clean clone build succeeds (backend + frontend) on Windows
- [ ] All migrations applied; DB seeded for demo
- [ ] Test suites pass (backend + frontend)
- [ ] Smoke test pass list captured (owner/admin basic flows)

Optional commands (Windows, from repo root):
```cmd
cd backend && npm run migrate && cd ..
cd backend && npm run test:ci && cd ..
cd frontend && npm test -- --watchAll=false && cd ..
```

## 2) Security & Compliance
- [ ] Helmet/CSP active; verify no unsafe-inline in production unless allowed
- [ ] CSRF enforced on unsafe methods; public approval routes exempted as intended
- [ ] Auth rate limiters active; global limiter active
- [ ] Secrets present and strong: `JWT_SECRET`, any webhook secrets
- [ ] Idempotency middleware mounted and working on critical mutations

## 3) Configuration & Secrets
- [ ] `.env` or platform vars set (see `DEPLOYMENT_SETUP.md`)
- [ ] `DATABASE_URL` correct (SQLite allowed only for dev/demo per docs)
- [ ] `REACT_APP_API_URL` set for the frontend build
- [ ] Optional: `RETENTION_CLEANUP_INTERVAL_MS` tuned (default daily ok)

## 4) Database & Migrations
- [ ] `npm run migrate:status` shows no pending migrations
- [ ] Seed data present for demo flows (owners/admins, sample projects/materials)
- [ ] Backup plan or snapshot strategy documented for staging

## 5) Observability & Alerts
- [ ] Metrics endpoint reachable and exports expected counters/gauges
- [ ] Cardinality budgets verified (no label explosions)
- [ ] Runbooks checked against alert categories (`backend/RUNBOOKS.md`)

## 6) Performance & Capacity
- [ ] Quick p95 latency smoke (projects list, create order, invoice send)
- [ ] Job queue latency within expectations; retries not excessive
- [ ] DB pool settings sensible for environment

## 7) Functional Acceptance (Happy Paths)
- [ ] Create Project → Quote → Approval link → Approve/Reject
- [ ] Create Invoice → Send (HTML) → Mark Paid; AR list shows expected items
- [ ] Work Order scheduling: move item, verify WebSocket updates
- [ ] Inventory shortage → Create PO → Receive PO → Stock updates
- [ ] Exports: run at least one CSV (projects/materials/invoices)

## 8) Accessibility (Baseline)
- [ ] jest-axe suites pass for Owner Dashboard, Project Detail, Approval Portal
- [ ] Keyboard navigation verified for at least one dialog/drawer
- [ ] Progress indicators and lists have accessible names

## 9) Offline & Idempotency
- [ ] Offline queue stores mutations and flushes on reconnect
- [ ] Idempotency-Key persists across retries (no duplicates)

## 10) Integrations
- [ ] Slack test endpoint behaves (enabled/disabled by config)
- [ ] Webhook redelivery via Ops Console succeeds on a sample failed delivery

## 11) Data Retention
- [ ] Manual run: `POST /api/ops/retention/run` returns success
- [ ] Metrics show `retention.*` increments
- [ ] Scheduler cadence acceptable for environment

## 12) Deployment & Rollback
- [ ] Deployment plan rehearsed (staging/preview)
- [ ] Rollback path identified (previous image/tag or migration rollback plan)
- [ ] Ops Console reachable for admins post-deploy

## 13) Customer Demo Prep
- [ ] Demo user credentials validated
- [ ] `CUSTOMER_DEMO_GUIDE.md` steps verified
- [ ] Data reset plan ready if demo environment shared

---

Sign-offs
- QA: ____________________  Date: ________
- Security: ______________  Date: ________
- Product: _______________  Date: ________
- Engineering: ___________  Date: ________
