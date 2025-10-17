"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadToken = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class DownloadToken extends sequelize_1.Model {
}
exports.DownloadToken = DownloadToken;
DownloadToken.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    token: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, unique: true },
    fileKey: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    usedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true }
}, {
    sequelize: database_1.sequelize,
    tableName: 'download_tokens',
    modelName: 'DownloadToken',
    underscored: true,
    indexes: [{ fields: ['token'] }, { fields: ['fileKey'] }]
});
exports.default = DownloadToken;
