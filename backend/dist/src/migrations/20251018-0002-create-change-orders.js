"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.createTable('change_orders', {
            id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            projectId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
            quoteId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            code: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true },
            title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            status: { type: sequelize_1.DataTypes.ENUM('draft', 'sent', 'approved', 'rejected'), allowNull: false, defaultValue: 'draft' },
            amount: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
            createdByUserId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
            approvedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            approvedByUserId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        });
        await queryInterface.addIndex('change_orders', ['projectId']);
        await queryInterface.addIndex('change_orders', ['quoteId']);
        await queryInterface.addIndex('change_orders', ['status']);
        await queryInterface.addIndex('change_orders', ['createdByUserId']);
        await queryInterface.addIndex('change_orders', ['approvedByUserId']);
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('change_orders');
    }
};
