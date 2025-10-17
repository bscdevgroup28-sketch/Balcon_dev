"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
// Creates export_jobs table including fileKey column required by ExportJob model.
// Idempotent: checks for existence before creating.
async function up(queryInterface) {
    const tables = await queryInterface.showAllTables();
    const exists = (tables || []).map(t => (typeof t === 'string' ? t.toLowerCase() : '')).includes('export_jobs');
    if (exists) {
        // Ensure missing column fileKey exists (retrofit older environments)
        try {
            const desc = await queryInterface.describeTable('export_jobs');
            if (!desc.fileKey) {
                await queryInterface.addColumn('export_jobs', 'fileKey', { type: sequelize_1.DataTypes.STRING, allowNull: true });
            }
        }
        catch { /* ignore */ }
        return;
    }
    await queryInterface.createTable('export_jobs', {
        id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        type: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
        status: { type: sequelize_1.DataTypes.ENUM('pending', 'processing', 'partial', 'completed', 'failed'), allowNull: false, defaultValue: 'pending' },
        params: { type: sequelize_1.DataTypes.JSON, allowNull: true },
        resultUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        fileKey: { type: sequelize_1.DataTypes.STRING, allowNull: true },
        errorMessage: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        attempts: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        startedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        completedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
    });
    await queryInterface.addIndex('export_jobs', ['status']);
    await queryInterface.addIndex('export_jobs', ['type']);
}
async function down(queryInterface) {
    // Drop table (safe rollback) – enum cleanup implicit for most dialects
    try {
        await queryInterface.dropTable('export_jobs');
    }
    catch { /* ignore */ }
}
