"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.createTable('invoices', {
            id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            projectId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
            number: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true },
            date: { type: sequelize_1.DataTypes.DATE, allowNull: false },
            dueDate: { type: sequelize_1.DataTypes.DATE, allowNull: false },
            lineItems: { type: sequelize_1.DataTypes.JSONB, allowNull: false, defaultValue: [] },
            subtotal: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
            tax: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
            total: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
            status: { type: sequelize_1.DataTypes.ENUM('draft', 'sent', 'paid', 'overdue'), allowNull: false, defaultValue: 'draft' },
            sentAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            paidAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
        });
        await queryInterface.addIndex('invoices', ['projectId']);
        await queryInterface.addIndex('invoices', ['status']);
        await queryInterface.addIndex('invoices', ['dueDate']);
        // Simple email outbox table to simulate email send fallback
        await queryInterface.createTable('email_outbox', {
            id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            to: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
            subject: { type: sequelize_1.DataTypes.STRING(500), allowNull: false },
            body: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            relatedType: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
            relatedId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            status: { type: sequelize_1.DataTypes.ENUM('pending', 'sent', 'failed'), allowNull: false, defaultValue: 'pending' },
            errorMessage: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            sentAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
        });
        await queryInterface.addIndex('email_outbox', ['status']);
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('email_outbox');
        await queryInterface.dropTable('invoices');
    }
};
