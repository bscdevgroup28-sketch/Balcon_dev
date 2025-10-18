"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.createTable('purchase_orders', {
            id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            vendor: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
            items: { type: sequelize_1.DataTypes.JSONB, allowNull: false, defaultValue: [] },
            status: { type: sequelize_1.DataTypes.ENUM('draft', 'sent', 'received', 'cancelled'), allowNull: false, defaultValue: 'draft' },
            receivedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            totalCost: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        });
        await queryInterface.addIndex('purchase_orders', ['status']);
        await queryInterface.addIndex('purchase_orders', ['createdAt']);
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('purchase_orders');
    }
};
