"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRecord = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class JobRecord extends sequelize_1.Model {
}
exports.JobRecord = JobRecord;
JobRecord.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: sequelize_1.DataTypes.STRING(120), allowNull: false },
    payload: { type: sequelize_1.DataTypes.JSON, allowNull: false },
    status: { type: sequelize_1.DataTypes.ENUM('pending', 'running', 'completed', 'failed'), allowNull: false, defaultValue: 'pending' },
    attempts: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    maxAttempts: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
    enqueuedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
    scheduledFor: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    lastError: { type: sequelize_1.DataTypes.TEXT, allowNull: true }
}, {
    sequelize: database_1.sequelize,
    tableName: 'job_records',
    modelName: 'JobRecord',
    underscored: true,
    indexes: [{ fields: ['status'] }, { fields: ['type'] }, { fields: ['scheduledFor'] }]
});
exports.default = JobRecord;
