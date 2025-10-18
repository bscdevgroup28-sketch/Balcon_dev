"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyRecord = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class IdempotencyRecord extends sequelize_1.Model {
}
exports.IdempotencyRecord = IdempotencyRecord;
IdempotencyRecord.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: sequelize_1.DataTypes.STRING(120), allowNull: false, unique: true },
    requestHash: { type: sequelize_1.DataTypes.STRING(120), allowNull: false },
    method: { type: sequelize_1.DataTypes.STRING(10), allowNull: false },
    path: { type: sequelize_1.DataTypes.STRING(300), allowNull: false },
    statusCode: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    response: { type: sequelize_1.DataTypes.JSONB || sequelize_1.DataTypes.JSON, allowNull: false },
    userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
}, {
    sequelize: database_1.sequelize,
    tableName: 'idempotency_records',
    modelName: 'IdempotencyRecord',
    underscored: true,
    indexes: [
        { name: 'idemp_key_unique', unique: true, fields: ['key'] },
        { name: 'idemp_expires_idx', fields: ['expires_at'] },
    ]
});
exports.default = IdempotencyRecord;
