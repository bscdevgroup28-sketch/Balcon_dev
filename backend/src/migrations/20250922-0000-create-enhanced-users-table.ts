import { QueryInterface, DataTypes } from 'sequelize';

// Initial explicit creation for enhanced_users table (idempotent)
// If table already exists (previously created via sync), migration is a no-op.

export async function up({ context }: { context: QueryInterface }) {
  const tableName = 'enhanced_users';
  const tableExists = await context.sequelize.getQueryInterface().showAllTables()
    .then((tables: string[] | unknown) => {
      const list = Array.isArray(tables) ? tables.map(t => (typeof t === 'string' ? t : '')) : [];
      return list.includes(tableName);
    });

  if (tableExists) return; // Skip creation if already present

  await context.createTable(tableName, {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    first_name: { type: DataTypes.STRING(50), allowNull: false },
    last_name: { type: DataTypes.STRING(50), allowNull: false },
    role: { type: DataTypes.ENUM('owner','office_manager','shop_manager','project_manager','team_leader','technician','customer'), allowNull: false, defaultValue: 'customer' },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    last_login_at: { type: DataTypes.DATE, allowNull: true },
    password_reset_token: { type: DataTypes.STRING(255), allowNull: true },
    password_reset_expires_at: { type: DataTypes.DATE, allowNull: true },
    email_verification_token: { type: DataTypes.STRING(255), allowNull: true },
    email_verification_expires_at: { type: DataTypes.DATE, allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    date_of_birth: { type: DataTypes.DATE, allowNull: true },
    profile_image_url: { type: DataTypes.STRING(500), allowNull: true },
    employee_id: { type: DataTypes.STRING(20), allowNull: true, unique: true },
    department: { type: DataTypes.STRING(50), allowNull: true },
    position: { type: DataTypes.STRING(100), allowNull: true },
    hire_date: { type: DataTypes.DATE, allowNull: true },
    salary: { type: DataTypes.DECIMAL(10,2), allowNull: true },
    permissions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    can_access_financials: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_manage_projects: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    can_manage_users: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    projects_assigned: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    projects_completed: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    total_revenue: { type: DataTypes.DECIMAL(12,2), allowNull: true, defaultValue: 0 },
    performance_rating: { type: DataTypes.DECIMAL(3,2), allowNull: true },
    must_change_password: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await context.addIndex(tableName, ['email'], { unique: true, name: 'enhanced_users_email_idx' });
  await context.addIndex(tableName, ['employee_id'], { unique: true, name: 'enhanced_users_employee_id_idx' });
  await context.addIndex(tableName, ['role'], { name: 'enhanced_users_role_idx' });
  await context.addIndex(tableName, ['is_active'], { name: 'enhanced_users_is_active_idx' });
  await context.addIndex(tableName, ['is_verified'], { name: 'enhanced_users_is_verified_idx' });
  await context.addIndex(tableName, ['password_reset_token'], { name: 'enhanced_users_prt_idx' });
  await context.addIndex(tableName, ['email_verification_token'], { name: 'enhanced_users_evt_idx' });
}

export async function down({ context }: { context: QueryInterface }) {
  // Only drop if table exists
  const tableName = 'enhanced_users';
  const qi = context.sequelize.getQueryInterface();
  const tables = await qi.showAllTables();
  if (Array.isArray(tables) && tables.includes(tableName)) {
    await context.dropTable(tableName);
  }
}
