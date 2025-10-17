"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.createTable('work_orders', {
            id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            projectId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
            title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
            description: { type: sequelize_1.DataTypes.TEXT },
            status: { type: sequelize_1.DataTypes.ENUM('pending', 'assigned', 'in_progress', 'blocked', 'completed', 'cancelled'), allowNull: false, defaultValue: 'pending' },
            priority: { type: sequelize_1.DataTypes.ENUM('low', 'medium', 'high', 'urgent'), allowNull: false, defaultValue: 'medium' },
            assignedUserId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            estimatedHours: { type: sequelize_1.DataTypes.FLOAT },
            actualHours: { type: sequelize_1.DataTypes.FLOAT },
            startDate: { type: sequelize_1.DataTypes.DATE },
            dueDate: { type: sequelize_1.DataTypes.DATE },
            completedAt: { type: sequelize_1.DataTypes.DATE },
            createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
        });
        await queryInterface.addIndex('work_orders', ['projectId']);
        await queryInterface.addIndex('work_orders', ['status']);
        await queryInterface.addIndex('work_orders', ['assignedUserId']);
        await queryInterface.addIndex('work_orders', ['priority']);
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('work_orders');
    }
};
