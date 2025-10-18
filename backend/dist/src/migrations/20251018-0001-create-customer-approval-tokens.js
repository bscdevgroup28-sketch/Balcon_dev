"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.createTable('customer_approval_tokens', {
            id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            projectId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
            quoteId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            orderId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            token: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, unique: true },
            expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
            consumedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            createdByUserId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
            actionAuditId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
        });
        await queryInterface.addIndex('customer_approval_tokens', ['token']);
        await queryInterface.addIndex('customer_approval_tokens', ['expiresAt']);
        await queryInterface.addIndex('customer_approval_tokens', ['projectId']);
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('customer_approval_tokens');
    }
};
