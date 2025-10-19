# Migration Template with Safety Checks

## Overview
This template provides a safe migration pattern with data integrity checks. Use this template when creating new migrations to ensure data loss prevention and rollback safety.

---

## Basic Migration Template

### File Naming Convention
```
YYYYMMDD-HHMM-descriptive-name.ts
```

Example: `20251019-1200-add-user-preferences.ts`

---

## Template: Adding a Column

```typescript
import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // ✅ SAFETY CHECK: Count rows before migration
    const tableName = 'users';
    const [[beforeResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountBefore = (beforeResult as any).count;
    console.log(`[Migration] Pre-migration ${tableName} count: ${rowCountBefore}`);

    // Run migration: Add column
    await queryInterface.addColumn(tableName, 'preferences', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string of user preferences'
    });

    // ✅ SAFETY CHECK: Verify row count unchanged
    const [[afterResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountAfter = (afterResult as any).count;
    console.log(`[Migration] Post-migration ${tableName} count: ${rowCountAfter}`);

    if (rowCountAfter !== rowCountBefore) {
      throw new Error(
        `Migration data integrity error! Row count changed from ${rowCountBefore} to ${rowCountAfter}`
      );
    }

    console.log(`[Migration] ✅ Data integrity verified`);
  },

  down: async (queryInterface: QueryInterface) => {
    // ✅ SAFETY CHECK: Count rows before rollback
    const tableName = 'users';
    const [[beforeResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountBefore = (beforeResult as any).count;
    console.log(`[Rollback] Pre-rollback ${tableName} count: ${rowCountBefore}`);

    // Rollback: Remove column
    await queryInterface.removeColumn(tableName, 'preferences');

    // ✅ SAFETY CHECK: Verify row count unchanged
    const [[afterResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountAfter = (afterResult as any).count;
    console.log(`[Rollback] Post-rollback ${tableName} count: ${rowCountAfter}`);

    if (rowCountAfter !== rowCountBefore) {
      throw new Error(
        `Rollback data integrity error! Row count changed from ${rowCountBefore} to ${rowCountAfter}`
      );
    }

    console.log(`[Rollback] ✅ Data integrity verified`);
  }
};
```

---

## Template: Creating a Table

```typescript
import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableName = 'user_preferences';

    // ✅ SAFETY CHECK: Verify table doesn't exist
    const tables = await queryInterface.showAllTables();
    if (tables.includes(tableName)) {
      throw new Error(`Table ${tableName} already exists! Migration aborted.`);
    }

    // Create table
    await queryInterface.createTable(tableName, {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      theme: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'light'
      },
      density: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'comfortable'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex(tableName, ['userId'], { unique: true });

    // ✅ SAFETY CHECK: Verify table was created
    const tablesAfter = await queryInterface.showAllTables();
    if (!tablesAfter.includes(tableName)) {
      throw new Error(`Table ${tableName} was not created! Migration failed.`);
    }

    console.log(`[Migration] ✅ Table ${tableName} created successfully`);
  },

  down: async (queryInterface: QueryInterface) => {
    const tableName = 'user_preferences';

    // ✅ SAFETY CHECK: Verify table exists before dropping
    const tables = await queryInterface.showAllTables();
    if (!tables.includes(tableName)) {
      console.warn(`[Rollback] ⚠️  Table ${tableName} doesn't exist, nothing to rollback`);
      return;
    }

    // Drop table
    await queryInterface.dropTable(tableName);

    // ✅ SAFETY CHECK: Verify table was dropped
    const tablesAfter = await queryInterface.showAllTables();
    if (tablesAfter.includes(tableName)) {
      throw new Error(`Table ${tableName} still exists! Rollback failed.`);
    }

    console.log(`[Rollback] ✅ Table ${tableName} dropped successfully`);
  }
};
```

---

## Template: Modifying Column Type

```typescript
import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableName = 'projects';
    const columnName = 'budget';

    // ✅ SAFETY CHECK: Backup data before type change
    const [[beforeResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountBefore = (beforeResult as any).count;
    console.log(`[Migration] ${tableName} row count: ${rowCountBefore}`);

    // ✅ SAFETY CHECK: Sample data verification
    const [sampleData] = await queryInterface.sequelize.query(
      `SELECT ${columnName} FROM ${tableName} LIMIT 5`
    );
    console.log(`[Migration] Sample ${columnName} values before:`, sampleData);

    // Change column type (e.g., from DECIMAL to BIGINT for cents)
    await queryInterface.changeColumn(tableName, columnName, {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Budget in cents'
    });

    // ✅ SAFETY CHECK: Verify row count unchanged
    const [[afterResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountAfter = (afterResult as any).count;

    if (rowCountAfter !== rowCountBefore) {
      throw new Error(
        `Data integrity error! Row count changed from ${rowCountBefore} to ${rowCountAfter}`
      );
    }

    // ✅ SAFETY CHECK: Verify data still accessible
    const [sampleDataAfter] = await queryInterface.sequelize.query(
      `SELECT ${columnName} FROM ${tableName} LIMIT 5`
    );
    console.log(`[Migration] Sample ${columnName} values after:`, sampleDataAfter);

    console.log(`[Migration] ✅ Column type changed successfully with data preserved`);
  },

  down: async (queryInterface: QueryInterface) => {
    const tableName = 'projects';
    const columnName = 'budget';

    // ✅ SAFETY CHECK: Count rows before rollback
    const [[beforeResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountBefore = (beforeResult as any).count;
    console.log(`[Rollback] ${tableName} row count: ${rowCountBefore}`);

    // Revert column type back to original
    await queryInterface.changeColumn(tableName, columnName, {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Budget amount'
    });

    // ✅ SAFETY CHECK: Verify row count unchanged
    const [[afterResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountAfter = (afterResult as any).count;

    if (rowCountAfter !== rowCountBefore) {
      throw new Error(
        `Rollback data integrity error! Row count changed from ${rowCountBefore} to ${rowCountAfter}`
      );
    }

    console.log(`[Rollback] ✅ Column type reverted successfully`);
  }
};
```

---

## Template: Adding Index

```typescript
import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableName = 'projects';
    const indexName = 'idx_projects_status_created';

    // ✅ SAFETY CHECK: Verify table exists
    const tables = await queryInterface.showAllTables();
    if (!tables.includes(tableName)) {
      throw new Error(`Table ${tableName} doesn't exist! Migration aborted.`);
    }

    // ✅ SAFETY CHECK: Count rows before (indexes shouldn't affect row count)
    const [[beforeResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountBefore = (beforeResult as any).count;
    console.log(`[Migration] ${tableName} row count before index: ${rowCountBefore}`);

    // Add composite index
    await queryInterface.addIndex(tableName, ['status', 'createdAt'], {
      name: indexName,
      type: 'BTREE'
    });

    // ✅ SAFETY CHECK: Verify row count unchanged
    const [[afterResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountAfter = (afterResult as any).count;

    if (rowCountAfter !== rowCountBefore) {
      throw new Error(
        `Unexpected row count change! Before: ${rowCountBefore}, After: ${rowCountAfter}`
      );
    }

    console.log(`[Migration] ✅ Index ${indexName} created successfully`);
  },

  down: async (queryInterface: QueryInterface) => {
    const tableName = 'projects';
    const indexName = 'idx_projects_status_created';

    // Remove index
    await queryInterface.removeIndex(tableName, indexName);

    console.log(`[Rollback] ✅ Index ${indexName} removed successfully`);
  }
};
```

---

## Template: Data Migration (Complex)

```typescript
import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableName = 'users';

    // ✅ SAFETY CHECK: Count rows before migration
    const [[beforeResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const totalRows = (beforeResult as any).count;
    console.log(`[Migration] Processing ${totalRows} rows`);

    // Add new column
    await queryInterface.addColumn(tableName, 'fullName', {
      type: DataTypes.STRING(200),
      allowNull: true
    });

    // ✅ SAFETY CHECK: Track migration progress
    let processedRows = 0;
    const batchSize = 100;

    // Update data in batches
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, firstName, lastName FROM ${tableName}`
    );

    for (let i = 0; i < (users as any[]).length; i += batchSize) {
      const batch = (users as any[]).slice(i, i + batchSize);
      
      for (const user of batch) {
        await queryInterface.sequelize.query(
          `UPDATE ${tableName} SET fullName = ? WHERE id = ?`,
          { replacements: [`${user.firstName} ${user.lastName}`, user.id] }
        );
        processedRows++;
      }

      console.log(`[Migration] Processed ${processedRows}/${totalRows} rows`);
    }

    // ✅ SAFETY CHECK: Verify all rows were processed
    const [[afterResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountAfter = (afterResult as any).count;

    if (rowCountAfter !== totalRows) {
      throw new Error(
        `Row count mismatch! Expected ${totalRows}, found ${rowCountAfter}`
      );
    }

    // ✅ SAFETY CHECK: Verify data was populated
    const [[nullCount]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName} WHERE fullName IS NULL`
    );
    const nullRows = (nullCount as any).count;

    if (nullRows > 0) {
      throw new Error(`Migration incomplete! ${nullRows} rows have NULL fullName`);
    }

    console.log(`[Migration] ✅ Successfully migrated ${processedRows} rows`);
  },

  down: async (queryInterface: QueryInterface) => {
    const tableName = 'users';

    // ✅ SAFETY CHECK: Count rows before rollback
    const [[beforeResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountBefore = (beforeResult as any).count;
    console.log(`[Rollback] ${tableName} count before: ${rowCountBefore}`);

    // Remove column
    await queryInterface.removeColumn(tableName, 'fullName');

    // ✅ SAFETY CHECK: Verify row count unchanged
    const [[afterResult]] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    const rowCountAfter = (afterResult as any).count;

    if (rowCountAfter !== rowCountBefore) {
      throw new Error(
        `Rollback data loss! Row count changed from ${rowCountBefore} to ${rowCountAfter}`
      );
    }

    console.log(`[Rollback] ✅ Column removed, data preserved`);
  }
};
```

---

## Safety Check Checklist

When writing migrations, always include:

- [ ] **Row count verification** before and after schema changes
- [ ] **Table existence checks** before creating/dropping tables
- [ ] **Data sampling** for complex migrations (log sample data)
- [ ] **Batch processing** for large data migrations
- [ ] **Progress logging** (especially for migrations affecting >1000 rows)
- [ ] **Rollback validation** - Test `down()` method works correctly
- [ ] **Error messages** with specific details (table name, row counts, etc.)
- [ ] **Transaction safety** - Migrations run in transactions by default
- [ ] **Idempotency consideration** - What happens if migration runs twice?

---

## Testing Migrations

### Local Testing

```bash
# 1. Backup database
cp enhanced_database.sqlite test_migration_backup.sqlite

# 2. Run migration on test database
export DATABASE_URL=sqlite:./test_migration.sqlite
npm run migrate

# 3. Verify application works
npm run dev:enhanced
# Test critical endpoints

# 4. Test rollback
npm run migrate:down

# 5. Verify application still works
npm run dev:enhanced

# 6. Re-apply migration
npm run migrate
```

### Staging Testing

```bash
# 1. Create staging DB from production backup
pg_dump production_db > staging_test.sql
psql staging_db < staging_test.sql

# 2. Run migration
DATABASE_URL=postgresql://staging npm run migrate

# 3. Run integration tests
npm run test:integration

# 4. Test rollback
npm run migrate:down

# 5. Re-apply and monitor
npm run migrate
railway logs --tail
```

---

## Common Pitfalls

### ❌ DON'T: Add NOT NULL without default

```typescript
// BAD - Will fail if table has rows
await queryInterface.addColumn('users', 'status', {
  type: DataTypes.STRING(20),
  allowNull: false  // ❌ No default value!
});
```

### ✅ DO: Add as nullable first, populate, then add constraint

```typescript
// GOOD - Add as nullable
await queryInterface.addColumn('users', 'status', {
  type: DataTypes.STRING(20),
  allowNull: true
});

// Populate data
await queryInterface.sequelize.query(
  `UPDATE users SET status = 'active' WHERE status IS NULL`
);

// Then add constraint in separate migration if needed
```

---

### ❌ DON'T: Drop columns without backup

```typescript
// BAD - Data loss if rollback needed
await queryInterface.removeColumn('users', 'oldField');
```

### ✅ DO: Rename to deprecated first, drop in future migration

```typescript
// GOOD - Deprecate first
await queryInterface.renameColumn('users', 'oldField', 'oldField_deprecated');

// Drop in a later migration after confirming no usage
// Migration 2-3 weeks later:
await queryInterface.removeColumn('users', 'oldField_deprecated');
```

---

## Version History

- **v1.0** (2025-10-19): Initial migration template with safety checks

---

**Last Updated:** October 19, 2025
**Document Owner:** Backend Development Team
