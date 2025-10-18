import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('customer_approval_tokens', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: { type: DataTypes.INTEGER, allowNull: false },
      quoteId: { type: DataTypes.INTEGER, allowNull: true },
      orderId: { type: DataTypes.INTEGER, allowNull: true },
      token: { type: DataTypes.STRING(200), allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      consumedAt: { type: DataTypes.DATE, allowNull: true },
      createdByUserId: { type: DataTypes.INTEGER, allowNull: false },
      actionAuditId: { type: DataTypes.INTEGER, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addIndex('customer_approval_tokens', ['token']);
    await queryInterface.addIndex('customer_approval_tokens', ['expiresAt']);
    await queryInterface.addIndex('customer_approval_tokens', ['projectId']);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('customer_approval_tokens');
  }
};
