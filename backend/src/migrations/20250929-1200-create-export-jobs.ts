import { QueryInterface, DataTypes } from 'sequelize';

// Creates export_jobs table including fileKey column required by ExportJob model.
// Idempotent: checks for existence before creating.

export async function up(queryInterface: QueryInterface) {
  const tables = await queryInterface.showAllTables();
  const exists = (tables || []).map(t => (typeof t === 'string' ? t.toLowerCase() : '')).includes('export_jobs');
  if (exists) {
    // Ensure missing column fileKey exists (retrofit older environments)
    try {
      const desc: any = await (queryInterface as any).describeTable('export_jobs');
      if (!desc.fileKey) {
        await queryInterface.addColumn('export_jobs', 'fileKey', { type: DataTypes.STRING, allowNull: true });
      }
    } catch { /* ignore */ }
    return;
  }
  await queryInterface.createTable('export_jobs', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.STRING(100), allowNull: false },
    status: { type: DataTypes.ENUM('pending','processing','partial','completed','failed'), allowNull: false, defaultValue: 'pending' },
    params: { type: DataTypes.JSON, allowNull: true },
    resultUrl: { type: DataTypes.TEXT, allowNull: true },
    fileKey: { type: DataTypes.STRING, allowNull: true },
    errorMessage: { type: DataTypes.TEXT, allowNull: true },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  });
  await queryInterface.addIndex('export_jobs', ['status']);
  await queryInterface.addIndex('export_jobs', ['type']);
}

export async function down(queryInterface: QueryInterface) {
  // Drop table (safe rollback) – enum cleanup implicit for most dialects
  try { await queryInterface.dropTable('export_jobs'); } catch { /* ignore */ }
}
