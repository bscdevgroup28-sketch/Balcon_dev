import { QueryInterface, DataTypes } from 'sequelize';

// Baseline creation of core tables (users, projects) to allow later add-column migrations
// Idempotent: skips creation if table already exists.

async function ensureTable(qi: QueryInterface, name: string, define: () => Promise<void>) {
  const tables = await qi.showAllTables();
  const list = Array.isArray(tables) ? tables.map(t => (typeof t === 'string' ? t : '') ) : [];
  if (list.includes(name)) return false;
  await define();
  return true;
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  // users (pre-sales fields, minimal)
  await ensureTable(queryInterface, 'users', async () => {
    await queryInterface.createTable('users', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING },
      company: { type: DataTypes.STRING },
      role: { type: DataTypes.ENUM('admin','user','sales','fabrication','owner','office_manager','shop_manager','project_manager','team_leader','technician'), allowNull: false, defaultValue: 'user' },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      isSalesRep: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      salesCapacity: { type: DataTypes.INTEGER },
      lastLoginAt: { type: DataTypes.DATE },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addIndex('users', ['email'], { unique: true, name: 'users_email_idx' });
  });

  // projects (pre-inquiry enhancements)
  await ensureTable(queryInterface, 'projects', async () => {
    await queryInterface.createTable('projects', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      inquiryNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      projectType: { type: DataTypes.ENUM('residential','commercial','industrial'), allowNull: false },
      status: { type: DataTypes.ENUM('inquiry','quoted','approved','in_progress','completed','cancelled'), allowNull: false, defaultValue: 'inquiry' },
      priority: { type: DataTypes.ENUM('low','medium','high','urgent'), allowNull: false, defaultValue: 'medium' },
      estimatedBudget: { type: DataTypes.DECIMAL(12,2) },
      actualCost: { type: DataTypes.DECIMAL(12,2) },
      startDate: { type: DataTypes.DATE },
      targetCompletionDate: { type: DataTypes.DATE },
      actualCompletionDate: { type: DataTypes.DATE },
      location: { type: DataTypes.STRING },
      requirements: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      materials: { type: DataTypes.JSON, defaultValue: [] },
      notes: { type: DataTypes.TEXT },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addIndex('projects', ['inquiryNumber'], { unique: true, name: 'projects_inquiry_number_idx_base' });
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Intentionally DO NOT drop baseline tables automatically to avoid data loss if rolled back inadvertently.
  // Could implement conditional drop if absolutely required.
}
