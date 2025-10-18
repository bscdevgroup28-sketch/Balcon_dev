import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('idempotency_records', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      key: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      request_hash: { type: DataTypes.STRING(120), allowNull: false },
      method: { type: DataTypes.STRING(10), allowNull: false },
      path: { type: DataTypes.STRING(300), allowNull: false },
      status_code: { type: DataTypes.INTEGER, allowNull: false },
      response: { type: (DataTypes as any).JSONB || DataTypes.JSON, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      expires_at: { type: DataTypes.DATE, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
    await queryInterface.addIndex('idempotency_records', ['key'], { name: 'idemp_key_unique', unique: true });
    await queryInterface.addIndex('idempotency_records', ['expires_at'], { name: 'idemp_expires_idx' });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('idempotency_records');
  }
};
