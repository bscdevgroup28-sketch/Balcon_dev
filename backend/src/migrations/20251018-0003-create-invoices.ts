import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('invoices', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      projectId: { type: DataTypes.INTEGER, allowNull: false },
      number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      date: { type: DataTypes.DATE, allowNull: false },
      dueDate: { type: DataTypes.DATE, allowNull: false },
      lineItems: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      subtotal: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      tax: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.ENUM('draft','sent','paid','overdue'), allowNull: false, defaultValue: 'draft' },
      sentAt: { type: DataTypes.DATE, allowNull: true },
      paidAt: { type: DataTypes.DATE, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('invoices', ['projectId']);
    await queryInterface.addIndex('invoices', ['status']);
    await queryInterface.addIndex('invoices', ['dueDate']);

    // Simple email outbox table to simulate email send fallback
    await queryInterface.createTable('email_outbox', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      to: { type: DataTypes.STRING(200), allowNull: false },
      subject: { type: DataTypes.STRING(500), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      relatedType: { type: DataTypes.STRING(50), allowNull: true },
      relatedId: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.ENUM('pending','sent','failed'), allowNull: false, defaultValue: 'pending' },
      errorMessage: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      sentAt: { type: DataTypes.DATE, allowNull: true },
    });
    await queryInterface.addIndex('email_outbox', ['status']);
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('email_outbox');
    await queryInterface.dropTable('invoices');
  }
};
