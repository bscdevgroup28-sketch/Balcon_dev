# BalCon Platform Monorepo

This repository houses the BalCon (Bal-Con Builders) platform codebase in a single monorepo containing:

- `backend/` – Node.js / Express / Sequelize API (SQLite for local + test; configurable for other DBs)
- `frontend/` – React (CRA) client application (Redux Toolkit, MUI)

## High-Level Features
- Authentication & role-based access (JWT)  
- Projects / Quotes / Orders domain models  
- File upload handling  
- Notification & email scaffolding  
- Enhanced inquiry / sprint 4 features (migrations included)  

## Tech Stack
| Area | Technology |
|------|------------|
| Backend | Node.js, Express, Sequelize, SQLite (dev/test) |
| Frontend | React 18, Redux Toolkit, React Router v6, MUI 5 |
| Testing (backend) | Jest, Supertest |
| Testing (frontend) | React Testing Library, Jest |
| Tooling | TypeScript, npm workspaces |

## Local Development (Windows PowerShell)
Prerequisites: Node.js >= 18.

Install (root will install workspaces):
```powershell
npm install
```

Run backend & frontend concurrently (scripts wrap startup):
```powershell
npm run dev
```

Run tests:
```powershell
# Backend tests
npm run test:backend

# Frontend tests (non-watch)
npm run test:frontend

# All
npm test
```

Type checking:
```powershell
npm run typecheck
```

## Project Structure (excerpt)
```
backend/
  src/
  tests/
frontend/
  src/
  public/
```

## Environment & Configuration
Backend environment variables (examples):
- `PORT` (default 3001)
- `JWT_SECRET` (set in production)
- Database connection (currently SQLite files in repo for dev/demo)

Frontend environment variables (CRA naming):
- `REACT_APP_API_URL` (base URL for backend API)

## Scripts (root)
- `dev` / `start` – Launch dev environment
- `test:backend`, `test:frontend`, `test` – Test commands
- `lint:*`, `typecheck:*` – Quality gates

## Pending Tasks / Roadmap (Initial)
- [ ] Resolve frontend test invalid hook call (duplicate React instance investigation)
- [ ] Add CI workflows (backend + frontend tests, lint, typecheck)
- [ ] Add LICENSE (decision pending)
- [ ] Add CONTRIBUTING, CODEOWNERS, SECURITY docs
- [ ] Configure Dependabot & release automation

## Contributing
Internal team only at this stage. Contribution guidelines & code ownership files will be added.

## License
License selection pending (MIT / Apache-2.0 / Proprietary). Until added, all rights reserved internally.

## Security
Do not commit secrets. Use environment variables or deployment platform secret stores. SECURITY.md to be added.

---
Generated bootstrap README – update sections as the platform evolves.
