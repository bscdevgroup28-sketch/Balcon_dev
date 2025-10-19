# Database Migration Rollback Procedures

## Overview
This document provides comprehensive procedures for safely rolling back database migrations in the Bal-Con Builders platform. Always test rollbacks in staging before executing in production.

---

## Pre-Rollback Checklist

Before initiating any rollback, complete the following:

- [ ] **Create database backup**
  ```bash
  # PostgreSQL (Production)
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  
  # SQLite (Development)
  cp enhanced_database.sqlite backup_enhanced_$(date +%Y%m%d_%H%M%S).sqlite
  ```

- [ ] **Check current migration status**
  ```bash
  cd backend
  npm run migrate:status
  ```

- [ ] **Identify target migration**
  - Review migration manifest: `backend/migration-manifest.json`
  - Confirm the migration file to rollback
  - Verify the `down()` method exists and is properly implemented

- [ ] **Review data impact**
  - Check if rollback will drop columns with data
  - Verify if foreign key relationships will be affected
  - Document any data that may be lost

- [ ] **Notify stakeholders**
  - Inform team of planned rollback window
  - Set maintenance mode if necessary
  - Prepare incident communication if emergency rollback

---

## Rollback Steps

### Step 1: Staging Environment Test

**Always test rollback on staging before production!**

```bash
# 1. Create staging database copy from production
pg_dump production_db > staging_test_$(date +%Y%m%d).sql
psql staging_db < staging_test_$(date +%Y%m%d).sql

# 2. Verify staging database state
psql staging_db -c "SELECT COUNT(*) FROM users;"
psql staging_db -c "\dt"  # List tables

# 3. Test rollback on staging
cd backend
DATABASE_URL=postgresql://user:pass@host:5432/staging_db npm run migrate:down

# 4. Verify rollback success
npm run migrate:status  # Check migration state
psql staging_db -c "\d users"  # Verify schema changes reverted

# 5. Run integration tests
npm run test:integration

# 6. Verify application startup
npm run dev:enhanced
# Check http://localhost:8082/api/health/deep
```

**If staging test fails:**
- Do NOT proceed to production
- Investigate rollback script issues
- Fix `down()` method in migration file
- Repeat staging test

---

### Step 2: Production Rollback

**Only proceed if staging rollback was successful!**

```bash
# 1. Create production backup
pg_dump $DATABASE_URL > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# Verify backup file size (should not be 0 bytes)
ls -lh backup_prod_*.sql

# 2. Enable maintenance mode (Railway/Deployment Platform)
# Option A: Railway Dashboard → Set MAINTENANCE_MODE=true
# Option B: Railway CLI
railway variables set MAINTENANCE_MODE=true

# 3. Verify maintenance mode active
curl https://your-api-url.railway.app/api/health
# Should return maintenance message

# 4. Run migration rollback
cd backend
npm run migrate:down

# 5. Verify migration status
npm run migrate:status

# 6. Test database health
curl https://your-api-url.railway.app/api/health/deep

# 7. Run smoke tests
npm run test:integration -- --testNamePattern="health"

# 8. Disable maintenance mode
railway variables set MAINTENANCE_MODE=false

# 9. Monitor application logs
railway logs --tail

# 10. Verify critical endpoints
curl https://your-api-url.railway.app/api/auth/me
curl https://your-api-url.railway.app/api/projects
```

**Post-Rollback Verification:**
- [ ] All critical API endpoints responding
- [ ] Database queries executing successfully
- [ ] No error spikes in logs
- [ ] Frontend application loads correctly
- [ ] User authentication working

---

## Emergency Recovery

### If Rollback Fails

**Scenario 1: Migration Rollback Script Errors**

```bash
# 1. Immediately restore from backup
psql $DATABASE_URL < backup_prod_YYYYMMDD_HHMMSS.sql

# 2. Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 3. Restart application
railway restart

# 4. Verify health
curl https://your-api-url.railway.app/api/health/deep
```

**Scenario 2: Data Corruption Detected**

```bash
# 1. Enable maintenance mode immediately
railway variables set MAINTENANCE_MODE=true

# 2. Assess corruption scope
psql $DATABASE_URL -c "SELECT tablename, n_live_tup FROM pg_stat_user_tables;"

# 3. Restore from last known good backup
psql $DATABASE_URL < backup_prod_YYYYMMDD_HHMMSS.sql

# 4. Contact DBA for manual verification
# Run integrity checks on critical tables
```

**Scenario 3: Partial Rollback (Some Tables Reverted, Others Failed)**

```bash
# 1. DO NOT attempt to re-run migration or rollback
# 2. Document current database state
pg_dump $DATABASE_URL > partial_state_$(date +%Y%m%d_%H%M%S).sql

# 3. Restore from pre-rollback backup
psql $DATABASE_URL < backup_prod_YYYYMMDD_HHMMSS.sql

# 4. Manual schema correction may be required
# Contact senior developer or DBA
```

---

## Rollback-Specific Commands

### Rolling Back Single Migration

```bash
# Rollback last migration
npm run migrate:down

# Check what was rolled back
npm run migrate:status
```

### Rolling Back Multiple Migrations

```bash
# Rollback to specific migration (not recommended without testing)
# Use with extreme caution!

# List all executed migrations
npm run migrate:status

# Rollback multiple times (run migrate:down repeatedly)
npm run migrate:down  # Rollback 1
npm run migrate:down  # Rollback 2
npm run migrate:down  # Rollback 3
```

### Verifying Migration State

```bash
# Check current migration state
npm run migrate:status

# Output example:
# ✓ 20240101000000-initial-schema.ts (executed)
# ✓ 20240102000000-add-user-fields.ts (executed)
# ✗ 20240103000000-add-project-files.ts (pending)
```

---

## Migration Safety Checks

### Before Writing Migrations

1. **Always include `down()` method:**
   ```typescript
   export async function up({ context: queryInterface }) {
     await queryInterface.addColumn('users', 'new_field', {
       type: DataTypes.STRING(100),
       allowNull: true
     });
   }

   export async function down({ context: queryInterface }) {
     await queryInterface.removeColumn('users', 'new_field');
   }
   ```

2. **Include row count verification:**
   ```typescript
   export async function up({ context: queryInterface }) {
     // Count rows before
     const [[before]] = await queryInterface.sequelize.query(
       'SELECT COUNT(*) as count FROM users'
     );
     console.log(`Pre-migration user count: ${before.count}`);

     // Run migration
     await queryInterface.addColumn('users', 'status', {
       type: DataTypes.STRING(50),
       allowNull: true
     });

     // Count rows after
     const [[after]] = await queryInterface.sequelize.query(
       'SELECT COUNT(*) as count FROM users'
     );
     
     if (after.count !== before.count) {
       throw new Error(`Row count changed! Before: ${before.count}, After: ${after.count}`);
     }
   }
   ```

3. **Test migrations in development:**
   ```bash
   # Run migration
   npm run migrate
   
   # Verify application works
   npm run dev:enhanced
   
   # Test rollback
   npm run migrate:down
   
   # Verify application still works
   npm run dev:enhanced
   
   # Re-apply migration
   npm run migrate
   ```

---

## Incident Reporting

### If Production Rollback Required

Document the following information:

1. **Incident Details:**
   - Date and time of rollback
   - Migration(s) rolled back (filename)
   - Reason for rollback
   - Duration of maintenance window

2. **Impact Assessment:**
   - Services affected
   - Data loss (if any)
   - User impact (downtime duration)
   - Rollback success/failure

3. **Root Cause:**
   - What went wrong with the migration?
   - Was it tested in staging?
   - What was missed in code review?

4. **Action Items:**
   - Fix migration script
   - Improve testing procedures
   - Update this rollback documentation
   - Team training if needed

**Report Template:**
```markdown
## Migration Rollback Incident Report

**Date:** YYYY-MM-DD HH:MM UTC
**Migration:** 20240101000000-migration-name.ts
**Executed By:** [Name]

### Reason for Rollback
[Description of issue that required rollback]

### Actions Taken
1. Backup created: backup_prod_20240101_120000.sql
2. Staging test: [Success/Failure]
3. Production rollback: [Success/Failure]
4. Restoration required: [Yes/No]

### Impact
- Downtime: [X] minutes
- Data loss: [None/Description]
- Affected users: [Number/None]

### Root Cause
[Analysis of why migration failed]

### Prevention
- [ ] Migration script corrected
- [ ] Additional tests added
- [ ] Documentation updated
- [ ] Team notified
```

---

## Best Practices

1. **Always backup before rollback** - No exceptions
2. **Test in staging first** - Never rollback production without staging test
3. **Document everything** - Keep detailed logs of all actions
4. **Communicate early** - Notify team before starting rollback
5. **Monitor after rollback** - Watch logs for at least 15 minutes post-rollback
6. **Review and improve** - Update procedures based on lessons learned

---

## Emergency Contacts

- **Database Administrator:** [Contact info]
- **Backend Lead:** [Contact info]
- **DevOps Engineer:** [Contact info]
- **On-Call Engineer:** [Contact info]

---

## Appendix: Common Rollback Scenarios

### Scenario: Added Column with NOT NULL Constraint

**Problem:** Migration adds `NOT NULL` column without default value

**Rollback:**
```bash
npm run migrate:down  # Removes the column
```

**Prevention:** Always add columns as nullable first, populate data, then add constraint

---

### Scenario: Dropped Table with Data

**Problem:** Migration accidentally drops table with production data

**Rollback:**
```bash
# Migration rollback cannot restore data
# Must restore from backup
psql $DATABASE_URL < backup_prod_YYYYMMDD_HHMMSS.sql
```

**Prevention:** Never drop tables in migrations without data migration plan

---

### Scenario: Changed Column Type Breaking Queries

**Problem:** Changed VARCHAR(50) to VARCHAR(20), truncating data

**Rollback:**
```bash
npm run migrate:down  # Reverts column type
```

**Data Recovery:**
```sql
-- If data was truncated, restore from backup
-- Extract specific table data
pg_restore -t table_name backup_file.sql
```

---

## Version History

- **v1.0** (2025-10-19): Initial rollback procedures documentation
- **Future:** Add automated rollback testing, backup verification scripts

---

**Last Updated:** October 19, 2025
**Document Owner:** Backend Development Team
**Review Cycle:** Quarterly or after each production rollback incident
