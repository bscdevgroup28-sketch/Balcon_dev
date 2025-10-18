import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('work_orders', 'team', { type: DataTypes.STRING(100), allowNull: true });
    // Helpful indexes for scheduling queries
  try { await queryInterface.addIndex('work_orders', ['startDate']); } catch (e) { /* ignore index errors */ }
  try { await queryInterface.addIndex('work_orders', ['dueDate']); } catch (e) { /* ignore index errors */ }
  try { await queryInterface.addIndex('work_orders', ['team']); } catch (e) { /* ignore index errors */ }
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('work_orders', 'team');
    // Index removals are optional; many dialects drop with column.
  }
};
