"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerApprovalToken = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class CustomerApprovalToken extends sequelize_1.Model {
}
exports.CustomerApprovalToken = CustomerApprovalToken;
CustomerApprovalToken.init({
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
    updatedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: database_1.sequelize,
    tableName: 'customer_approval_tokens',
    modelName: 'CustomerApprovalToken'
});
exports.default = CustomerApprovalToken;
