"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
// Migration: persistent security audit events table
// Idempotent: checks for existence before creation.
async function up(arg) {
    const qi = arg.context || arg;
    const tableName = 'security_audit_events';
    const tables = await qi.showAllTables();
    const exists = Array.isArray(tables) && tables.includes(tableName);
    if (exists)
        return;
    await qi.createTable(tableName, {
        id: { type: sequelize_1.DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        action: { type: sequelize_1.DataTypes.STRING(120), allowNull: false },
        outcome: { type: sequelize_1.DataTypes.STRING(24), allowNull: false },
        actor_user_id: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        actor_role: { type: sequelize_1.DataTypes.STRING(60), allowNull: true },
        target_user_id: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
        ip: { type: sequelize_1.DataTypes.STRING(64), allowNull: true },
        request_id: { type: sequelize_1.DataTypes.STRING(64), allowNull: true },
        meta: { type: sequelize_1.DataTypes.JSON, allowNull: true },
        created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
    });
    await qi.addIndex(tableName, ['action'], { name: 'audit_action_idx' });
    await qi.addIndex(tableName, ['outcome'], { name: 'audit_outcome_idx' });
    await qi.addIndex(tableName, ['actor_user_id'], { name: 'audit_actor_user_idx' });
    await qi.addIndex(tableName, ['target_user_id'], { name: 'audit_target_user_idx' });
    await qi.addIndex(tableName, ['created_at'], { name: 'audit_created_at_idx' });
}
async function down(arg) {
    const qi = arg.context || arg;
    const tableName = 'security_audit_events';
    const tables = await qi.showAllTables();
    if (Array.isArray(tables) && tables.includes(tableName)) {
        await qi.dropTable(tableName);
    }
}
