"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.createTable('idempotency_records', {
            id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            key: { type: sequelize_1.DataTypes.STRING(120), allowNull: false, unique: true },
            request_hash: { type: sequelize_1.DataTypes.STRING(120), allowNull: false },
            method: { type: sequelize_1.DataTypes.STRING(10), allowNull: false },
            path: { type: sequelize_1.DataTypes.STRING(300), allowNull: false },
            status_code: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
            response: { type: sequelize_1.DataTypes.JSONB || sequelize_1.DataTypes.JSON, allowNull: false },
            user_id: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            expires_at: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        });
        await queryInterface.addIndex('idempotency_records', ['key'], { name: 'idemp_key_unique', unique: true });
        await queryInterface.addIndex('idempotency_records', ['expires_at'], { name: 'idemp_expires_idx' });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('idempotency_records');
    }
};
