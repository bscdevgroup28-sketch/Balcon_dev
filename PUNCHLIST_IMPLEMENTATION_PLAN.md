# Bal-Con Builders Platform – Step-by-Step Punch List Implementation Plan

This plan turns the punch list into an ordered, executable sequence. Follow it top-to-bottom. Each step has clear goals, tasks (backend/frontend), acceptance criteria, and testing guidance. All work targets the enhanced architecture.

Useful references
- Backend entrypoint: `backend/src/indexEnhanced.ts` → `appEnhanced.ts`
- Models and associations: `backend/src/models/index.ts`
- Auth middleware: `backend/src/middleware/authEnhanced.ts` (use `requireRole([...])`)
- Caching helpers: `backend/src/utils/cache.ts` (`withCache`, `cache.invalidateByTag()`)
- Metrics: `backend/src/monitoring/metrics.ts` and `backend/OPERATIONS_METRICS.md`
- Cardinality governance: `backend/src/monitoring/cardinality.ts`
- Migrations: `backend/src/migrations/` (Umzug)
- Frontend state: `frontend/src/store/` (Redux Toolkit slices)
- Dashboards: `frontend/src/components/dashboard/`
- Socket.io: `backend/src/services/webSocketService.ts`, `frontend/src/services/socketService.ts`

Conventions and guard rails
- Always add new data models via migrations; run `npm run migrate` before tests.
- Register new routes in `appEnhanced.ts` and protect them with `requireRole`.
- Invalidate caches on mutations with the right tags.
- Instrument metrics for new flows; avoid label explosion. If adding labels, set/update budgets in cardinality governance.
- Add backend integration tests and minimal frontend tests for each new feature.
- Document any new env vars in `DEPLOYMENT_SETUP.md`.

Prerequisites (once per dev machine)
- Ensure you can run both apps with enhanced mode.
- Initialize enhanced DB and run migrations.

Optional commands (Windows, from repo root)
- Backend dev: `cd backend && npm run dev:enhanced`
- Frontend dev: `cd frontend && npm start`
- DB setup (enhanced): `cd backend && npm run setup:enhanced`
- Reset DB (enhanced): `cd backend && npm run db:reset:enhanced`
- Tests: `npm test` or `npm run test:backend` / `npm run test:frontend`

---

## 0) Foundation: Test ergonomics and CI hygiene (COMPLETED)

Goal
- Speed local iteration and keep CI thorough and green.

Backend tasks
- Add a fast test script that runs unit + selected integration tests. Keep existing full suite for CI.
- Ensure pretest verification doesn’t block local fast runs (support `SKIP_VERIFY=1`).

Frontend tasks
- Add `test:ci` script (non-watch) and keep local watch mode.

Acceptance criteria
- Running fast tests locally completes within ~60s on a fresh DB. ✅ Verified via `test:backend:fast` (~6–7s)
- CI runs the full backend + frontend tests with migrations. (scripts ready)

Testing guidance
- Verify both scripts locally. In CI, confirm artifacts (alerts bundle) still upload.

Notes
- This step can be done in parallel with step 1; listed first because it accelerates everything else.

---

## 1) UX foundation: PageHeader and AttentionList (COMPLETED)

Goal
- Standardize page headers and surface action-required items across dashboards (owner/admin/PM/shop/team leader).

Frontend tasks
- Create `frontend/src/components/common/PageHeader.tsx`
  - Props: `title: string`, `subtitle?: string`, `actions?: ReactNode`, `breadcrumbs?: Array<{label:string; to?:string}>`.
  - Ensure a11y: landmarks, heading levels, aria-labels.
- Create `frontend/src/components/common/AttentionList.tsx`
  - Fetches items via `GET /api/attention` (to implement in backend) or composes from slices initially.
  - Shows badges for priority/severity; supports filter by role.
- Integrate into dashboards under `frontend/src/components/dashboard/`.

Backend tasks
- Implemented `GET /api/attention` returning role-bucketed items (quotes expired, receivables, low stock, blocked/overdue work orders).
  - File: `backend/src/routes/attention.ts`.
  - Registered in `appEnhanced.ts` under `/api/attention` (JWT required).
  - Cache with `withCache('attention:<bucket>', 60s, ...)` and `cacheTags.attention`.
  - Metrics: `attention.requests`, `attention.errors`, `attention.latency.ms`.

Acceptance criteria
- Owner & PM dashboards render an AttentionList with at least 3 item types. ✅
- API responds quickly and is cache-backed (60s TTL). ✅

Testing guidance
- Frontend: render tests ensuring header landmarks exist and lists render items.
- Backend: integration test for `/api/attention` covering role-based content and caching headers.

---

## 2) Customer approvals portal (tokenized link + audit) (COMPLETED)

Goal
- Customers can view and approve/reject a project quote/order via a signed, expiring link without full login. Actions are audited.

Backend tasks
- Migration: `customer_approval_tokens` table created with indexes
- Model: `CustomerApprovalToken` added and exported
- Service: create/verify/consume with HMAC token gen and 7-day default TTL
- Routes:
  - `POST /api/projects/:id/approvals/token` (owner/admin/PM) → returns URL
  - `GET /api/approvals/:token` public → read-only
  - `POST /api/approvals/:token/decision` public → approve/reject and consume
- Metrics: issuance, approvals/rejections, route latency
- Webhook: `approval.completed` emitted
- Security: token HMAC; audit logging placeholder

Frontend tasks
- Public route `/portal/approval/:token` renders token info and Approve/Reject UI
- Success/error states wired

Acceptance criteria
- Token link works (public), view loads, decision posts and is recorded; webhook fired. ✅
- Duplicate or expired tokens handled with proper error. ✅

Testing guidance
- Backend integration: token lifecycle, expiry, duplicate consume, audit fields.
- Frontend: snapshot test for read-only view; action button disables after click; error state on expired/invalid.

---

## 3) CSRF protection for cookie-based auth (COMPLETED)

Goal
- Protect state-changing endpoints when using httpOnly cookies.

Backend tasks
- Implemented double-submit CSRF protection
  - `GET /api/auth/csrf` issues a token cookie and returns JSON
  - Global middleware enforces `X-CSRF-Token` on POST/PUT/PATCH/DELETE
  - Public approval endpoints bypassed to allow tokenized flows

Frontend tasks
- Axios interceptor best-effort fetches CSRF and attaches `X-CSRF-Token` for unsafe methods

Acceptance criteria
- Cookie-based unsafe requests require a valid CSRF token; public tokenized routes unaffected. ✅

Testing guidance
- Backend: tests verifying 403 on missing/invalid token; 200 on valid.
- Frontend: interceptor attaches token and handles refresh.

---

## 4) Change Orders (model, API, UI)

Goal
- Track change orders linked to projects/quotes; approvals and budget impact.

Backend tasks
- COMPLETED: Migration + model `ChangeOrder` with fields: `id`, `projectId`, `quoteId?`, `code`, `title`, `description?`, `status ('draft'|'sent'|'approved'|'rejected')`, `amount`, `createdByUserId`, `approvedAt?`, `approvedByUserId?`.
- COMPLETED: Associations wired in `models/index.ts` (Project, Quote, User relations).
- COMPLETED: Routes `/api/change-orders` for list/get/create/update/delete and `/send`, `/approve`, `/reject` transitions with policy checks and CSRF.
- COMPLETED: Cache invalidation (analytics tag) on mutations and metrics counters for actions.
- IN PROGRESS: Hook change order impact into project budget summary endpoints (analytics/UI wiring to follow).

Frontend tasks
- Slice: `changeOrdersSlice` with thunks for CRUD and status updates.
- UI: Project detail tab “Change Orders” with list/table and details; send for approval action.
- Integrate with AttentionList (pending approvals).

Acceptance criteria
- Create, send, approve/reject change orders via API; totals affect project budget summaries.
  - API portion ✅ implemented and covered by integration tests.
  - Budget summary impact will be wired during frontend/UI integration.

Testing guidance
- Backend: migration and API integration tests ✅ added (`backend/tests/integration/changeOrders.test.ts`). Transitions enforce rules (no updates after sent; delete only in draft).
- Frontend: list rendering and optimistic update on status change.

---

## 5) Invoicing (PDF, email, AR list)

Goal
- Generate invoices, email to customer, track accounts receivable.

Backend tasks
- COMPLETED: Migration + model `Invoice` with fields and indexes; associated to `Project`.
- COMPLETED: Routes under `/api/invoices` for list/get/create/update/send/mark-paid and HTML invoice (`/pdf`).
- COMPLETED: Email send via outbox table (`email_outbox`) as fallback, metrics counters for send/paid, AR list endpoint.
- NOTE: PDF is HTML placeholder (ready to swap for a PDF engine in deployment).

Frontend tasks
- Slice: `invoicesSlice`.
- UI: Project tab “Invoices” and global AR list for office manager.
- Actions: generate, send, download PDF, mark paid.

Acceptance criteria
- Can create and send an invoice; AR list shows overdue; PDF(HTML) renders with correct totals. ✅

Testing guidance
- Backend: integration test added (`backend/tests/integration/invoices.test.ts`) covering create → send → AR list → pdf(HTML) → mark paid.
- Frontend: rendering tests; action button flows; mock PDF download.

---

## 6) Scheduling (kanban/board)

Goal
- Visual scheduling of work orders across dates/teams.

Backend tasks
- COMPLETED: Scheduling list endpoint `/api/work-orders/schedule?start=&end=&team=` (orders by start/due).
- COMPLETED: Move endpoint `/api/work-orders/:id/move` updates dates/team/status.
- COMPLETED: WebSocket broadcast on update/move.

Frontend tasks
- Board component: columns by week/day; draggable cards (e.g., `react-beautiful-dnd` if already used; otherwise implement simple drag handles).
- Persist moves via API; optimistic updates and rollback on failure.

Acceptance criteria
- Drag-and-drop backed by endpoints; changes persist and broadcast in real-time. ✅

Testing guidance
- Backend: integration test added (`backend/tests/integration/scheduling.test.ts`).
- Frontend: basic drag interactions with mocked API.

---

## 7) Inventory shortages → Purchase Orders

Goal
- Detect shortages for work orders and create POs.

Backend tasks
- COMPLETED: Migration + model `PurchaseOrder` with vendor, items, status, receivedAt.
- COMPLETED: Routes under `/api/purchase-orders`:
  - `GET /shortages` lists materials at/below reorderPoint with suggested quantities.
  - `POST /` create a PO (policy: shop_manager+).
  - `POST /:id/receive` receive a PO, create inventory transactions, and bump material stock (policy: shop_manager+).
- COMPLETED: Cache invalidation for materials after create/receive; metrics `po.created` and `po.received`.
- NEXT: Add shortage computation scoped to a specific work order’s required bill of materials (optional enhancement).

Frontend tasks
- UI in Work Order/Materials area: “Check shortages” → “Create PO”.
- PO list and details; receive flow.

Acceptance criteria
- Shortage endpoint surfaces expected items from seeded data; POs adjust inventory when received. ✅ (backend)

Testing guidance
- Backend: integration test added (`backend/tests/integration/purchaseOrders.test.ts`) covering shortages → create → receive → inventory updated. ✅
- Frontend: PO create/receive happy path.

---

## 8) Field/mobile Work Order execution (offline queue)

Goal
- Allow technicians to execute tasks offline and sync later.

Frontend tasks
- COMPLETED: Client-side queue for mutations (IndexedDB) with retry/backoff and basic give-up policy after N attempts.
- COMPLETED: Service `frontend/src/services/offlineQueue.ts` exposing `enqueue`, `flush`, and `onStatusChange`.
- COMPLETED: Global UI indicator `OfflineIndicator` added to `Layout` to show offline/queued state.
- NEXT: Add a simple “Queued changes” drawer to list and retry specific items (optional UX polish).

Backend tasks
- Idempotency keys support (see step 11) to make retries safe.

Acceptance criteria
- Turning off network enqueues mutations; when back online, the queue flushes and requests succeed without creating duplicates (idempotency keys in Step 11 will harden this). ✅

Testing guidance
- Frontend: unit smoke test added for enqueue/flush (`frontend/src/services/offlineQueue.test.ts`).
- Integration test can be extended later with mocked offline/online events.

---

## 9) Integrations: Slack notifications and Accounting exports

Goal
- Notify team channels and export accounting data.

Backend tasks
- COMPLETED: Slack test endpoint `POST /api/integrations/slack/test` (roles: owner/admin/office_manager) using `SLACK_WEBHOOK_URL` env; metrics `integrations.slack.sent/failed`.
- COMPLETED (existing): Export jobs system under `/api/exports` for materials/orders/projects with job queue, storage, and metrics; partial and archive flows supported.
- NEXT: Add event hooks (approval completed, invoice sent/paid) to post Slack notifications when configured (behind a feature flag).
- NEXT: Add accounting exports for invoices and payments (CSV/JSONL), leveraging the existing export job framework.

Frontend tasks
- Admin UI for configuring Slack webhook URL and triggering test; export UI with date range.

Acceptance criteria
- Slack sends on key events when configured; exports download files matching schema.

Testing guidance
- Backend: integration test added for Slack route config behavior (`backend/tests/integration/slackIntegration.test.ts`).
- For exports, existing `exportJobs.test.ts` covers enqueuing and completion.
- Frontend: form wiring and error handling.

---

## 10) Audit viewer (COMPLETED)

Goal
- View audit history for entities.

Backend tasks
- Ensured consistent audit entries by emitting domain events for invoices (created, updated, sent, paid) and purchase orders (created, received). These are persisted via the existing `EventLog` listener.
- Implemented endpoint: `GET /api/audit?entityType=project&entityId=...` (supports project, quote, order, invoice, purchase_order, work_order) with pagination.
  - File: `backend/src/routes/audit.ts`, registered under `/api/audit` in `appEnhanced.ts`.
  - Filters by event name prefix and payload keys (e.g., projectId, orderId) to support SQLite and Postgres.

Frontend tasks
- Generic `AuditTimeline` component; add to Project/Invoice/PO details. (Pending UI wiring)

Acceptance criteria
- Timeline shows chronologically ordered events with actor and metadata. ✅ (API implemented; UI pending)

Testing guidance
- Backend: verify `/api/audit` pagination and filtering by sample events. ✅
- Frontend: render with long lists; virtualization if needed. (Pending)

---

## 11) Idempotency keys for mutations (COMPLETED)

Goal
- Make client retries safe, enabling offline queue and robust integrations.

Backend tasks
- Implemented `IdempotencyRecord` model and migration to persist key, requestHash, method, path, statusCode, response, userId, expiresAt.
- Added middleware `idempotencyMiddleware` to read `Idempotency-Key`, compute request hash, and store/replay with TTL; returns 409 on hash mismatch.
- Applied to high-value endpoints (orders, invoices, purchase-orders, approvals) and mounted in `appEnhanced.ts` after CSRF.

Frontend tasks
- Axios interceptor now attaches `Idempotency-Key` to mutating requests; the offline queue preserves the key so retries reuse the same value.

Acceptance criteria
- Retries return the same response; conflicting bodies return 409. ✅

Testing guidance
- Backend: Added `backend/tests/integration/idempotency.test.ts` covering replay and conflict using invoice create. ✅

---

## 12) Admin Ops Console (COMPLETED)

Goal
- Provide operational controls for owners/admins.

Frontend tasks
- Page under `/dashboard/admin/ops` implemented (`frontend/src/pages/admin/AdminOpsConsole.tsx`).
  - Shows metrics snapshot/gauges and job queue status.
  - Actions: Re-deliver failed webhooks by deliveryId, invalidate caches by tag(s), pause/resume job queue.
  - Wired route at `/admin/ops` in `AppEnhanced.tsx` (admin-only via `ProtectedRoute`).

Backend tasks
- Added admin-only ops routes at `/api/ops`:
  - `GET /api/ops/summary` (metrics + jobs stats)
  - `GET /api/ops/jobs/status`, `POST /api/ops/jobs/pause`, `POST /api/ops/jobs/resume`
  - `POST /api/ops/cache/invalidate` (tags[])
  - `POST /api/ops/webhooks/redeliver` (deliveryId)
- Extended job queue with `pause()`, `resume()`, and `getStats()`.
- CSRF required for POSTs; role guard: owner/admin.

Acceptance criteria
- Admin can see system state (metrics + jobs) and perform safe operational actions (cache invalidate, webhook re-delivery, pause/resume jobs). ✅

Testing guidance
- Backend: Added `backend/tests/integration/opsConsole.test.ts` validating summary, status, pause/resume with admin auth and CSRF. ✅
- Frontend: basic page renders and triggers actions (manual verification acceptable for now).

---

## 13) A11y baseline and tests (COMPLETED)

Goal
- Meet a practical accessibility baseline.

Frontend tasks
- Add `jest-axe` tests for 3 key pages (Owner dashboard, Project detail, Approval portal) and fix critical issues (color contrast, labels).
- Ensure focus management on dialogs/drawers; ARIA attributes for key widgets.

Acceptance criteria
- No critical violations in jest-axe for chosen pages; keyboard navigation verified. ✅

Testing guidance
- jest-axe tests added for Owner Dashboard, Project Detail, and Public Approval Portal; all pass locally and in CI baseline.
- Environment stabilized for tests (crypto polyfill, axios mock, IndexedDB stub, offline queue test mode).

---

## 14) Data retention and multi-tenant posture (initial) (COMPLETED)

Goal
- Lay groundwork for retention and basic tenant isolation if needed.

Backend tasks
- Implemented retention cleanup job: `backend/src/jobs/handlers/retentionJob.ts`.
  - Removes expired CustomerApprovalToken (>30d), expired/old IdempotencyRecord (>30d), revoked/expired RefreshToken (>60d), failed WebhookDelivery (>60d, no retry), and EventLog (>90d).
  - Emits metrics: `retention.*` counters and `retention.sweep.duration.ms`.
- Registered job type `retention.cleanup` in `appEnhanced.ts` and scheduled daily by default (override via `RETENTION_CLEANUP_INTERVAL_MS`).
- Admin ops trigger added: `POST /api/ops/retention/run` (owner/admin, CSRF-protected) for manual sweeps.
- If multi-tenant becomes a requirement later, plan is to add `tenantId` columns and scoping middleware; for now, documented single-tenant stance remains.

Acceptance criteria
- Retention job runs and logs; no user-visible regressions. ✅
- Admin can manually trigger retention; metrics reflect deletions. ✅

Testing guidance
- Manual: call `POST /api/ops/retention/run` (owner/admin) and verify `retention.*` metrics on `/api/metrics/prometheus`.
- Optional follow-up: add an integration test that seeds expired records, triggers retention, and asserts removals and metrics increments.

---

## 15) Runbooks for alerts and ops (COMPLETED)

Goal
- Document how to react to alerts and operate the system.

Docs tasks
- Created `backend/RUNBOOKS.md` with sections for: 5xx surges, slow DB, auth spikes, cardinality violations, advisory scaling, webhook redelivery, cache issues, and data retention sweep.
- Linked guidance to metrics in `backend/OPERATIONS_METRICS.md` and to Ops endpoints.

Acceptance criteria
- Each alert category now has a corresponding runbook section with concrete steps. ✅

Testing guidance
- Peer review and a lightweight tabletop exercise checklist. Docs-only change; no code impact.

---

## 16) Final QA, performance passes, and docs polish

Goal
- Ensure quality and readiness.

Tasks
- Re-run full tests; fix flakes.
- Verify analytics caching invalidation after new mutations.
- Validate metrics exposure and label budgets; update cardinality budgets if new labels were added.
- Update `PROJECT_STATUS.md` and `OPERATIONS_PHASES_*.md` to mark completion with short notes.

Acceptance criteria
- Builds and tests pass in CI; metrics and alerts reflect new features; docs updated.

---

## Contracts and edge cases to watch

- Inputs/outputs: Define request/response types in `backend/src/types/` and reuse on frontend.
- Edge cases: Empty datasets, expired tokens, permission checks, concurrent updates, offline retries, partial failures (webhooks, email).
- Security: Respect `requireRole` for all sensitive routes; sanitize user input; keep CSP/helmet strong.

## How to use this plan

- Work sequentially; you may run step 0 in parallel with step 1.
- For each step, land backend first (with tests), then frontend, then wire metrics and caching.
- After merging a step: run migrations in staging, verify metrics, and update runbooks/docs.

Checklist snapshot (copy into your tracker)
- [ ] 0 Test ergonomics and CI hygiene
- [ ] 1 UX foundation: PageHeader + AttentionList
- [ ] 2 Customer approvals portal
- [ ] 3 CSRF protection
- [ ] 4 Change Orders
- [ ] 5 Invoicing
- [ ] 6 Scheduling
- [ ] 7 Inventory shortages → POs
- [ ] 8 Field/mobile offline queue
- [ ] 9 Integrations: Slack + Accounting
- [ ] 10 Audit viewer
- [ ] 11 Idempotency keys
- [ ] 12 Admin Ops Console
- [ ] 13 A11y baseline and tests
- [ ] 14 Retention / multi-tenant posture
- [ ] 15 Runbooks
- [ ] 16 Final QA and docs polish

---

If project specifics differ (e.g., existing partial models), adapt steps minimally—preserve enhanced architecture, caching, metrics, and security conventions throughout.
