import { QueryInterface, DataTypes } from 'sequelize';

// Migration: persistent security audit events table
// Idempotent: checks for existence before creation.
export async function up(arg: { context: QueryInterface } | QueryInterface) {
  const qi: QueryInterface = (arg as any).context || (arg as any);
  const tableName = 'security_audit_events';
  const tables = await qi.showAllTables();
  const exists = Array.isArray(tables) && tables.includes(tableName);
  if (exists) return;

  await qi.createTable(tableName, {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    action: { type: DataTypes.STRING(120), allowNull: false },
    outcome: { type: DataTypes.STRING(24), allowNull: false },
    actor_user_id: { type: DataTypes.INTEGER, allowNull: true },
    actor_role: { type: DataTypes.STRING(60), allowNull: true },
    target_user_id: { type: DataTypes.INTEGER, allowNull: true },
    ip: { type: DataTypes.STRING(64), allowNull: true },
    request_id: { type: DataTypes.STRING(64), allowNull: true },
    meta: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });

  await qi.addIndex(tableName, ['action'], { name: 'audit_action_idx' });
  await qi.addIndex(tableName, ['outcome'], { name: 'audit_outcome_idx' });
  await qi.addIndex(tableName, ['actor_user_id'], { name: 'audit_actor_user_idx' });
  await qi.addIndex(tableName, ['target_user_id'], { name: 'audit_target_user_idx' });
  await qi.addIndex(tableName, ['created_at'], { name: 'audit_created_at_idx' });
}

export async function down(arg: { context: QueryInterface } | QueryInterface) {
  const qi: QueryInterface = (arg as any).context || (arg as any);
  const tableName = 'security_audit_events';
  const tables = await qi.showAllTables();
  if (Array.isArray(tables) && tables.includes(tableName)) {
    await qi.dropTable(tableName);
  }
}
