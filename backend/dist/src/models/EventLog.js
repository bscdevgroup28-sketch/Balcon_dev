"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventLog = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class EventLog extends sequelize_1.Model {
}
exports.EventLog = EventLog;
EventLog.init({
    id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: sequelize_1.DataTypes.STRING(150), allowNull: false },
    version: { type: sequelize_1.DataTypes.STRING(20), allowNull: true },
    timestamp: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    payload: { type: sequelize_1.DataTypes.JSONB || sequelize_1.DataTypes.JSON, allowNull: false },
    correlationId: { type: sequelize_1.DataTypes.STRING(100), allowNull: true }
}, {
    sequelize: database_1.sequelize,
    tableName: 'event_log',
    modelName: 'EventLog',
    underscored: true
});
exports.default = EventLog;
