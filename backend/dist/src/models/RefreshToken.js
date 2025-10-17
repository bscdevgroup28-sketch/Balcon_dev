"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshToken = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class RefreshToken extends sequelize_1.Model {
}
exports.RefreshToken = RefreshToken;
RefreshToken.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    tokenHash: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    revokedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    replacedByToken: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
    ipAddress: { type: sequelize_1.DataTypes.STRING(64), allowNull: true },
    userAgent: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
    reuseDetected: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
    sequelize: database_1.sequelize,
    tableName: 'refresh_tokens',
    modelName: 'RefreshToken',
    underscored: true,
    indexes: [
        { fields: ['user_id'] },
        { fields: ['token_hash'] },
        { fields: ['expires_at'] }
    ]
});
exports.default = RefreshToken;
