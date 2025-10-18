import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('change_orders', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: { type: DataTypes.INTEGER, allowNull: false },
      quoteId: { type: DataTypes.INTEGER, allowNull: true },
      code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      title: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.ENUM('draft','sent','approved','rejected'), allowNull: false, defaultValue: 'draft' },
      amount: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      createdByUserId: { type: DataTypes.INTEGER, allowNull: false },
      approvedAt: { type: DataTypes.DATE, allowNull: true },
      approvedByUserId: { type: DataTypes.INTEGER, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('change_orders', ['projectId']);
    await queryInterface.addIndex('change_orders', ['quoteId']);
    await queryInterface.addIndex('change_orders', ['status']);
    await queryInterface.addIndex('change_orders', ['createdByUserId']);
    await queryInterface.addIndex('change_orders', ['approvedByUserId']);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('change_orders');
  }
};
