import { QueryInterface, DataTypes } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('inventory_transactions', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      material_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'materials', key: 'id' },
        onDelete: 'CASCADE'
      },
      type: { type: DataTypes.ENUM('adjustment','receipt','consumption','return','correction'), allowNull: false },
      quantity: { type: DataTypes.DECIMAL(12,2), allowNull: false },
      direction: { type: DataTypes.ENUM('in','out'), allowNull: false },
      reference_type: { type: DataTypes.STRING, allowNull: true },
      reference_id: { type: DataTypes.INTEGER, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      resulting_stock: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      user_id: { type: DataTypes.INTEGER, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });

  await queryInterface.addIndex('inventory_transactions', ['material_id']);
    await queryInterface.addIndex('inventory_transactions', ['type']);
    await queryInterface.addIndex('inventory_transactions', ['reference_type','reference_id']);
    await queryInterface.addIndex('inventory_transactions', ['created_at']);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('inventory_transactions');
  }
};