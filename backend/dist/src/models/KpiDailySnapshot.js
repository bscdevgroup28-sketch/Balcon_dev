"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiDailySnapshot = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class KpiDailySnapshot extends sequelize_1.Model {
}
exports.KpiDailySnapshot = KpiDailySnapshot;
KpiDailySnapshot.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    date: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false, unique: true },
    quotesSent: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    quotesAccepted: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    quoteConversionRate: { type: sequelize_1.DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
    ordersCreated: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ordersDelivered: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    avgOrderCycleDays: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: true },
    inventoryNetChange: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 }
}, {
    sequelize: database_1.sequelize,
    tableName: 'kpi_daily_snapshots',
    modelName: 'KpiDailySnapshot',
    underscored: true,
    indexes: [{ fields: ['date'], unique: true }]
});
exports.default = KpiDailySnapshot;
