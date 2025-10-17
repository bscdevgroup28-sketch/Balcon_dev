import { QueryInterface, DataTypes } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('kpi_daily_snapshots', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
      quotes_sent: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      quotes_accepted: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      quote_conversion_rate: { type: DataTypes.DECIMAL(6,4), allowNull: false, defaultValue: 0 },
      orders_created: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      orders_delivered: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      avg_order_cycle_days: { type: DataTypes.DECIMAL(10,2), allowNull: true },
      inventory_net_change: { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addIndex('kpi_daily_snapshots', ['date'], { unique: true, name: 'kpi_daily_snapshots_date_idx' });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('kpi_daily_snapshots');
  }
};