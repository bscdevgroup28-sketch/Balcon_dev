import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('work_orders', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT },
      status: { type: DataTypes.ENUM('pending','assigned','in_progress','blocked','completed','cancelled'), allowNull: false, defaultValue: 'pending' },
      priority: { type: DataTypes.ENUM('low','medium','high','urgent'), allowNull: false, defaultValue: 'medium' },
      assignedUserId: { type: DataTypes.INTEGER, allowNull: true },
      estimatedHours: { type: DataTypes.FLOAT },
      actualHours: { type: DataTypes.FLOAT },
      startDate: { type: DataTypes.DATE },
      dueDate: { type: DataTypes.DATE },
      completedAt: { type: DataTypes.DATE },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    });
    await queryInterface.addIndex('work_orders', ['projectId']);
    await queryInterface.addIndex('work_orders', ['status']);
    await queryInterface.addIndex('work_orders', ['assignedUserId']);
    await queryInterface.addIndex('work_orders', ['priority']);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('work_orders');
  }
};
