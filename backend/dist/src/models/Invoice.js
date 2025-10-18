"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Invoice extends sequelize_1.Model {
}
exports.Invoice = Invoice;
Invoice.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    projectId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, references: { model: 'projects', key: 'id' } },
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
    createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
}, {
    sequelize: database_1.sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['number'] },
        { fields: ['projectId'] },
        { fields: ['status'] },
        { fields: ['dueDate'] },
        { fields: ['createdAt'] },
    ]
});
exports.default = Invoice;
