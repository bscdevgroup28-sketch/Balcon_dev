# Database Recovery & Disaster Readiness

## Objectives
Provide a clear, repeatable procedure to recover service after data loss, corruption, or accidental destructive action. Targets:
| Metric | Target |
|--------|--------|
| RPO (data freshness) | < 24h (improve later via more frequent snapshots) |
| RTO (time to restore) | < 2h (goal) |

## 1. Backup Strategy
Source: Railway managed Postgres (assumed automated snapshots). Supplement with manual pg_dump for point-in-time granularity.

### Recommended Layers
1. Daily Managed Snapshot (Railway) – retain 7 days
2. Weekly Off-site Export (pg_dump) – retain 4 weeks
3. On-demand Pre-Migration Dump – before applying risky schema changes

### Manual Logical Backup
```
pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).dump
```
Store off-platform (encrypted). For ad-hoc table export:
```
pg_dump --data-only --table=public.refresh_tokens "$DATABASE_URL" > refresh_tokens_$(date +%Y%m%d).sql
```

## 2. Restore Procedure (Staging Drill)
1. Provision a new Postgres instance (staging)
2. Set `DATABASE_URL` to staging DSN
3. Restore:
```
pg_restore --clean --if-exists --no-owner --no-privileges -d "$STAGING_DATABASE_URL" backup_xxxxx.dump
```
4. Run migrations status check:
```
npm run migrate:status
```
Expect: 0 pending.
5. Run deployment verification:
```
npm run deploy:verify -- BASE_URL=http://staging-host
```
6. Confirm core workflows (login, refresh, protected route) succeed.

## 3. Production Recovery (Catastrophic)
1. Freeze writes (temporarily disable external traffic / scale to 0 frontend / add maintenance page)
2. Provision new Postgres instance
3. Restore latest acceptable snapshot (choose backup ≤ RPO target)
4. Point `DATABASE_URL` at restored instance, redeploy backend
5. Run verification script & smoke tests
6. Re-enable traffic
7. Post-mortem: document cause, prevention, detection time

## 4. Verification Script Integration
Use existing `npm run deploy:verify` after restore. Add env var `DEFAULT_USER_PASSWORD` if seed users required.

## 5. Integrity & Drift Checks
| Check | Mechanism |
|-------|-----------|
| Migration drift | `npm run migrations:verify` (hash manifest) |
| Schema presence | Startup logs diff (table counts) |
| Token hygiene | Cleanup logs & refresh token counts |

## 6. Sensitive Data Handling
Never commit dumps. Sanitize if sharing (remove user PII). Consider row-level export of minimal fixture set for lower envs.

## 7. Future Enhancements
- Point-in-time recovery (PITR) via WAL archiving if RPO needs to shrink
- Automated weekly restore drill in ephemeral environment
- Alerting on backup age > 26h

## 8. Glossary
| Term | Definition |
|------|------------|
| RPO | Max acceptable data loss window |
| RTO | Max acceptable service downtime to restore |

---
Maintained with database hardening phase.