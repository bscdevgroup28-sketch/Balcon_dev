# Bal-Con Builders Platform - AI Agent Instructions

## Project Overview
Full-stack construction management platform (monorepo) using npm workspaces with backend (Node.js/Express/TypeScript) and frontend (React/TypeScript). Primary database: SQLite (dev) or PostgreSQL (prod). Backend port: **8082**, Frontend: **3000**.

## Architecture Patterns

### Enhanced vs. Simple Pattern
The codebase uses an **"enhanced" architecture** as the canonical version:
- Entry point: `backend/src/indexEnhanced.ts` → `appEnhanced.ts`
- Database: `enhanced_database.sqlite` (configured in `config/environment.ts`)
- All new features target the enhanced version; simple variants exist for legacy compatibility only
- Default npm scripts (`npm run dev`, `npm run setup`) use enhanced versions

### Multi-Role Access Control
8 distinct roles with dedicated dashboards and permissions:
- **Owner/Admin** (executive level) → `/dashboard/owner`, `/dashboard/admin`
- **Office Manager** (financial/administrative) → `/dashboard/office-manager`
- **Shop Manager** (inventory/production) → `/dashboard/shop-manager`
- **Project Manager** (budget/resources) → `/dashboard/project-manager`
- **Team Leader** (field supervision) → `/dashboard/team-leader`
- **Technician** (equipment/tasks) → `/dashboard/technician`
- **Customer** (project tracking) → `/dashboard/customer`

Auth middleware: `backend/src/middleware/authEnhanced.ts` with `requireRole(['owner', 'admin'])` pattern.

### Data Models & Associations
Core models in `backend/src/models/index.ts`:
- **User** → Projects (via `userId` and `assignedSalesRepId`)
- **Project** → Quotes → Orders → WorkOrders
- **Material** → InventoryTransaction → WorkOrder
- **ProjectFile** (project attachments with access control)
- **KpiDailySnapshot** (analytics aggregation)
- **WebhookSubscription/Delivery** (event-driven integrations)

Models use Sequelize with associations defined centrally. Always check `models/index.ts` for relationship helpers (e.g., `Project.belongsTo(User, {as: 'assignedSalesRep'})`).

## Critical Workflows

### Development Startup (Windows)
```cmd
# From project root - launches both services in separate windows
start-dev.cmd

# Or PowerShell:
.\start-dev.ps1

# Manual backend start:
cd backend
npm run dev:enhanced

# Manual frontend start:
cd frontend
npm start
```

### Database Operations
```cmd
cd backend

# Initialize & seed enhanced database
npm run setup:enhanced

# Reset database (drops tables, recreates, seeds)
npm run db:reset:enhanced

# Run migrations only
npm run migrate

# Check migration status
npm run migrate:status
```

**Migration system**: Uses Umzug with TypeScript migrations in `backend/src/migrations/`. Always run `npm run migrate` before tests (`pretest` script verifies migrations). Generate manifest with `npm run migrations:manifest`.

### Testing Strategy
```cmd
# Backend: Jest with coverage
npm run test:backend          # From root
npm run test:coverage         # Backend with coverage report

# Frontend: React Testing Library
npm run test:frontend         # Non-watch mode (CI-compatible)

# All tests
npm test
```

**Test organization**:
- `backend/tests/unit/` - Service/utility unit tests
- `backend/tests/integration/` - API endpoint tests (require DB setup)
- Frontend tests colocated with components (`*.test.tsx`)

### Caching & Performance
Backend uses multi-tier caching via `backend/src/utils/cache.ts`:
```typescript
import { withCache, cacheKeys, cacheTags } from '../utils/cache';

// Cached data fetch with tag-based invalidation
const data = await withCache(
  cacheKeys.analytics.summary,
  5 * 60 * 1000, // 5 min TTL
  async () => fetchExpensiveData(),
  [cacheTags.analytics]
);
```

**Invalidation patterns**: Mutations in routes (projects, materials) invalidate via `cache.invalidateByTag()`. Redis optional (fallback to in-memory).

### Metrics & Observability
Prometheus-compatible metrics at `/api/metrics/prometheus`:
- HTTP request counters (status, latency buckets)
- Auth success/failure tracking (`auth.success`, `auth.failures`)
- Database query duration histograms (`db.query.duration.ms`)
- Job queue length, export durations, webhook circuit breaker states
- Custom analytics metrics (`analytics.forecast.served`, `cache.analytics.*`)

See `backend/OPERATIONS_METRICS.md` for full catalog. Metrics initialized in `backend/src/monitoring/metrics.ts` using `prom-client`. Use `metrics.increment()` for counters, `metrics.observe()` for histograms.

### Real-Time Features (WebSocket)
Socket.IO server initialized in `appEnhanced.ts` via `services/webSocketService.ts`:
- Authenticated connections (JWT validation on handshake)
- Room-based project updates: `socket.join(`project:${projectId}`)`
- Event publishing: `publishEvent('project:updated', {...})` broadcasts to webhooks + WS clients
- Frontend client: `frontend/src/services/socketService.ts`

## Frontend State Management

### Redux Toolkit Slices
State managed via `@reduxjs/toolkit` in `frontend/src/store/`:
- **authSlice**: User session, JWT, role-based permissions
- **projectsSlice**: Project CRUD with optimistic updates
- **quotesSlice**, **ordersSlice**: Quote/order lifecycle management
- **uiSlice**: Theme, notifications, layout density

Use async thunks for API calls:
```typescript
import { useDispatch } from 'react-redux';
import { fetchProjects } from '../store/slices/projectsSlice';

const dispatch = useDispatch();
dispatch(fetchProjects());
```

### Component Architecture
Dashboards follow `BaseDashboard` HOC pattern in `frontend/src/components/dashboard/`:
- Role-specific dashboards import shared widgets (KPI cards, charts, tables)
- Material-UI v5 theming via `frontend/src/theme/`
- Responsive grid layout with `LayoutDensityContext` for compact/comfortable modes

## Project-Specific Conventions

### Environment Variables
Backend requires (see `.env.example` or `DEPLOYMENT_SETUP.md`):
- `DATABASE_URL` (defaults to `sqlite:./enhanced_database.sqlite`)
- `JWT_SECRET` (min 32 chars for production)
- `PORT` (default 8082)
- Optional: `REDIS_URL`, `SENDGRID_API_KEY`, `METRICS_AUTH_TOKEN`

Frontend runtime env via `REACT_APP_API_URL` (built into bundle, not runtime-overridable without rebuild).

### Security Patterns
- **Password hashing**: bcrypt in `backend/src/services/authService.ts`
- **JWT refresh tokens**: Stored in DB with revocation support (`RefreshToken` model)
- **Rate limiting**: Global adaptive limiter in `middleware/globalRateLimit.ts` + per-endpoint limits
- **Input validation**: Express-validator middleware on all routes
- **Helmet**: CSP, HSTS, frameguard configured in `appEnhanced.ts`

### Background Jobs
Job queue system in `backend/src/jobs/`:
- **Scheduler**: `jobs/scheduler.ts` (cron-based KPI aggregation, exports, cleanup)
- **Queue**: In-memory queue with concurrency control (`jobs/jobQueue.ts`)
- **Handlers**: `jobs/handlers/` (e.g., `kpiSnapshotJob.ts` for daily analytics)

Register jobs: `jobQueue.addJob(type, handler)`. Start scheduler: `scheduler.start()` (auto-called in app startup).

## Key Documentation References

- **PROJECT_STATUS.md**: Completed features, technical architecture overview
- **DEPLOYMENT_SETUP.md**: Railway deployment, environment variables, CI/CD
- **backend/OPERATIONS_METRICS.md**: Metric definitions, interpretation, alerting
- **backend/OPERATIONS_PHASES_*.md**: Sprint history, feature implementation notes
- **CLEANUP_AND_SETUP_GUIDE.md**: Standardization decisions (enhanced vs simple)

## Common Pitfalls & Solutions

1. **Port conflicts**: Backend uses 8082 (not 3001). Check `backend/src/config/environment.ts` and `start-dev.cmd`.
2. **Migration failures**: Always run `npm run migrate:status` before adding new migrations. Use `npm run db:reset:enhanced` if schema is out of sync.
3. **Cache staleness**: Material/project updates should call `cache.invalidateByTag([cacheTags.projects])` in route handlers.
4. **Redux hydration**: Frontend auth state persists token to localStorage; verify `authSlice.ts` initialState reads from storage.
5. **TypeScript strict mode**: Both workspaces use strict TS. Use `unknown` over `any`, define API response types in `backend/src/types/`.

## When Adding Features

1. **Backend route**: Add to `backend/src/routes/`, register in `appEnhanced.ts` route initialization.
2. **Authentication**: Use `requireRole(['admin', 'owner'])` middleware from `authEnhanced.ts`.
3. **Metrics**: Increment counters in route handlers (`metrics.increment('feature.action')`).
4. **Frontend slice**: Create async thunk in `store/slices/`, wire to API via `services/` directory.
5. **Dashboard widget**: Add to role-specific dashboard (e.g., `OwnerDashboard.tsx`), use Material-UI `Card` + `Grid`.
6. **Tests**: Backend integration tests in `tests/integration/`, frontend in component directory.

---

**Default credentials** (seeded): `owner@balconbuilders.com` / `admin123` (all demo roles use same password).
