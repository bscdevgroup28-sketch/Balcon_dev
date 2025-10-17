"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.createTable('event_log', {
            id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            name: { type: sequelize_1.DataTypes.STRING(150), allowNull: false },
            version: { type: sequelize_1.DataTypes.STRING(20) },
            timestamp: { type: sequelize_1.DataTypes.DATE, allowNull: false },
            payload: { type: sequelize_1.DataTypes.JSONB || sequelize_1.DataTypes.JSON, allowNull: false },
            correlationId: { type: sequelize_1.DataTypes.STRING(100) },
            created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
        });
        await queryInterface.addIndex('event_log', ['name']);
        await queryInterface.addIndex('event_log', ['timestamp']);
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('event_log');
    }
};
