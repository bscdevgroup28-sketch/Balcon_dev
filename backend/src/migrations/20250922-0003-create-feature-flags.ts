import { QueryInterface, DataTypes } from 'sequelize';

export async function up({ context }: { context: QueryInterface }) {
  const table = 'feature_flags';
  const tables = await context.showAllTables();
  if (Array.isArray(tables) && tables.includes(table)) return;

  await context.createTable(table, {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    rollout_strategy: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'boolean' },
    percentage: { type: DataTypes.INTEGER, allowNull: true },
    audience_roles: { type: DataTypes.JSON, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await context.addIndex(table, ['key'], { unique: true, name: 'feature_flags_key_idx' });
  await context.addIndex(table, ['enabled'], { name: 'feature_flags_enabled_idx' });
}

export async function down({ context }: { context: QueryInterface }) {
  const table = 'feature_flags';
  const tables = await context.showAllTables();
  if (Array.isArray(tables) && tables.includes(table)) {
    await context.dropTable(table);
  }
}
