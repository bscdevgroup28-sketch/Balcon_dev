"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportJob = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class ExportJob extends sequelize_1.Model {
}
exports.ExportJob = ExportJob;
ExportJob.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    status: { type: sequelize_1.DataTypes.ENUM('pending', 'processing', 'partial', 'completed', 'failed'), allowNull: false, defaultValue: 'pending' },
    params: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    resultUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    fileKey: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    errorMessage: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    attempts: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    startedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    completedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true }
}, {
    sequelize: database_1.sequelize,
    tableName: 'export_jobs',
    modelName: 'ExportJob',
    underscored: true,
    indexes: [{ fields: ['status'] }, { fields: ['type'] }]
});
exports.default = ExportJob;
