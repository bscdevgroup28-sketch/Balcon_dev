"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up({ context }) {
    const table = 'feature_flags';
    const tables = await context.showAllTables();
    if (Array.isArray(tables) && tables.includes(table))
        return;
    await context.createTable(table, {
        id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        key: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, unique: true },
        enabled: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        description: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
        rollout_strategy: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, defaultValue: 'boolean' },
        percentage: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        audience_roles: { type: sequelize_1.DataTypes.JSON, allowNull: true },
        metadata: { type: sequelize_1.DataTypes.JSON, allowNull: true },
        created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
    });
    await context.addIndex(table, ['key'], { unique: true, name: 'feature_flags_key_idx' });
    await context.addIndex(table, ['enabled'], { name: 'feature_flags_enabled_idx' });
}
async function down({ context }) {
    const table = 'feature_flags';
    const tables = await context.showAllTables();
    if (Array.isArray(tables) && tables.includes(table)) {
        await context.dropTable(table);
    }
}
