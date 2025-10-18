"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrder = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class PurchaseOrder extends sequelize_1.Model {
}
exports.PurchaseOrder = PurchaseOrder;
PurchaseOrder.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    vendor: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    items: { type: sequelize_1.DataTypes.JSONB, allowNull: false, defaultValue: [] },
    status: { type: sequelize_1.DataTypes.ENUM('draft', 'sent', 'received', 'cancelled'), allowNull: false, defaultValue: 'draft' },
    receivedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    totalCost: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
}, { sequelize: database_1.sequelize, tableName: 'purchase_orders', modelName: 'PurchaseOrder', timestamps: true, indexes: [{ fields: ['status'] }, { fields: ['createdAt'] }] });
exports.default = PurchaseOrder;
