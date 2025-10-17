import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('event_log', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      version: { type: DataTypes.STRING(20) },
      timestamp: { type: DataTypes.DATE, allowNull: false },
      payload: { type: (DataTypes as any).JSONB || DataTypes.JSON, allowNull: false },
      correlationId: { type: DataTypes.STRING(100) },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addIndex('event_log', ['name']);
    await queryInterface.addIndex('event_log', ['timestamp']);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('event_log');
  }
};
