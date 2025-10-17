import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface: QueryInterface, sequelize?: Sequelize): Promise<void> => {
  // If projects table doesn't exist yet (early minimal test schema), skip quietly
  let projectDesc: any = {};
  try {
    projectDesc = await queryInterface.describeTable('projects');
  } catch (e) {
    // Table missing; nothing to do in this migration context
    return;
  }
  // Add inquiry tracking fields (skip if already present due to baseline)
  const dialect = (queryInterface as any).sequelize?.getDialect?.() || sequelize?.getDialect?.();
  if (!projectDesc['inquiryNumber']) {
    if (dialect === 'sqlite') {
      // SQLite cannot ALTER TABLE ADD COLUMN with UNIQUE constraint reliably.
      // Perform table rebuild preserving existing data.
      // 1. Read existing rows
      const rows: any[] = await (queryInterface as any).sequelize.query('SELECT * FROM projects', { type: (queryInterface as any).sequelize.QueryTypes.SELECT });
      // 2. Rename original
      await queryInterface.renameTable('projects', 'projects__old_inquiry_tmp');
      // 3. Recreate with new schema
      await queryInterface.createTable('projects', {
        // Reconstruct minimal baseline + new columns. Fallback to dynamic describe for flexibility.
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING },
        description: { type: DataTypes.TEXT },
        status: { type: DataTypes.STRING },
        createdAt: { type: DataTypes.DATE },
        updatedAt: { type: DataTypes.DATE },
        // New unique inquiryNumber
        inquiryNumber: { type: DataTypes.STRING, allowNull: false, defaultValue: 'INQ-2024-000001', unique: true },
        assignedSalesRepId: { type: DataTypes.INTEGER, allowNull: true },
        assignedAt: { type: DataTypes.DATE, allowNull: true },
      });
      // 4. Copy data (assign a generated inquiryNumber sequentially)
      let counter = 1;
      for (const r of rows) {
        const inquiry = `INQ-2024-${String(counter).padStart(6,'0')}`;
        counter++;
        await (queryInterface as any).sequelize.query(
          'INSERT INTO projects (id, name, description, status, createdAt, updatedAt, inquiryNumber) VALUES (?,?,?,?,?,?,?)',
          { replacements: [r.id, r.name, r.description, r.status, r.createdAt, r.updatedAt, inquiry] }
        );
      }
      // 5. Drop old
      await queryInterface.dropTable('projects__old_inquiry_tmp');
    } else {
      await queryInterface.addColumn('projects', 'inquiryNumber', {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        defaultValue: 'INQ-2024-000001',
      });
    }
  }

  if (!projectDesc['assignedSalesRepId']) {
    await queryInterface.addColumn('projects', 'assignedSalesRepId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }
  if (!projectDesc['assignedAt']) {
    await queryInterface.addColumn('projects', 'assignedAt', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  // Add sales rep capabilities to users table
  const userDesc = await queryInterface.describeTable('users');
  if (!userDesc['isSalesRep']) {
    await queryInterface.addColumn('users', 'isSalesRep', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  }
  if (!userDesc['salesCapacity']) {
    await queryInterface.addColumn('users', 'salesCapacity', {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
    });
  }

  // Create index for better query performance
  // Index may already exist (baseline). Wrap in try.
  try {
    await queryInterface.addIndex('projects', ['inquiryNumber'], {
      name: 'projects_inquiry_number_idx',
      unique: true,
    });
  } catch (e) { /* ignore duplicate index */ }

  try {
    await queryInterface.addIndex('projects', ['assignedSalesRepId'], {
      name: 'projects_assigned_sales_rep_idx',
    });
  } catch (e) { /* ignore duplicate */ }

  try {
    await queryInterface.addIndex('users', ['isSalesRep'], {
      name: 'users_is_sales_rep_idx',
    });
  } catch (e) { /* ignore duplicate index */ }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Remove indexes first
  await queryInterface.removeIndex('projects', 'projects_inquiry_number_idx');
  await queryInterface.removeIndex('projects', 'projects_assigned_sales_rep_idx');
  await queryInterface.removeIndex('users', 'users_is_sales_rep_idx');

  // Remove columns from projects table
  await queryInterface.removeColumn('projects', 'inquiryNumber');
  await queryInterface.removeColumn('projects', 'assignedSalesRepId');
  await queryInterface.removeColumn('projects', 'assignedAt');

  // Remove columns from users table
  await queryInterface.removeColumn('users', 'isSalesRep');
  await queryInterface.removeColumn('users', 'salesCapacity');
};
