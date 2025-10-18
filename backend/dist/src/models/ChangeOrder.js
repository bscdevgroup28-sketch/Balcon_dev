"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeOrder = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class ChangeOrder extends sequelize_1.Model {
}
exports.ChangeOrder = ChangeOrder;
ChangeOrder.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    projectId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, references: { model: 'projects', key: 'id' } },
    quoteId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, references: { model: 'quotes', key: 'id' } },
    code: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true },
    title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    status: { type: sequelize_1.DataTypes.ENUM('draft', 'sent', 'approved', 'rejected'), allowNull: false, defaultValue: 'draft' },
    amount: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
    createdByUserId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, references: { model: 'enhanced_users', key: 'id' } },
    approvedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    approvedByUserId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, references: { model: 'enhanced_users', key: 'id' } },
    createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
}, {
    sequelize: database_1.sequelize,
    modelName: 'ChangeOrder',
    tableName: 'change_orders',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['code'] },
        { fields: ['projectId'] },
        { fields: ['quoteId'] },
        { fields: ['status'] },
        { fields: ['createdByUserId'] },
        { fields: ['approvedByUserId'] },
        { fields: ['createdAt'] },
    ],
});
exports.default = ChangeOrder;
