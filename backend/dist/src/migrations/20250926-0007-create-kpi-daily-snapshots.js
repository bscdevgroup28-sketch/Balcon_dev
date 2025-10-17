"use strict";
const sequelize_1 = require("sequelize");
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.createTable('kpi_daily_snapshots', {
            id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            date: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false, unique: true },
            quotes_sent: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            quotes_accepted: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            quote_conversion_rate: { type: sequelize_1.DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
            orders_created: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            orders_delivered: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            avg_order_cycle_days: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: true },
            inventory_net_change: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
            created_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW },
            updated_at: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW }
        });
        await queryInterface.addIndex('kpi_daily_snapshots', ['date'], { unique: true, name: 'kpi_daily_snapshots_date_idx' });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('kpi_daily_snapshots');
    }
};
