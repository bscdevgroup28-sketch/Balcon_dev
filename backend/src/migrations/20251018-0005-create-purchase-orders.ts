import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('purchase_orders', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      vendor: { type: DataTypes.STRING(200), allowNull: false },
      items: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      status: { type: DataTypes.ENUM('draft','sent','received','cancelled'), allowNull: false, defaultValue: 'draft' },
      receivedAt: { type: DataTypes.DATE, allowNull: true },
      totalCost: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('purchase_orders', ['status']);
    await queryInterface.addIndex('purchase_orders', ['createdAt']);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('purchase_orders');
  }
};
