import { QueryInterface } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface) => {
    const dialect = (queryInterface.sequelize.getDialect && queryInterface.sequelize.getDialect()) || 'unknown';
    if (dialect !== 'postgres') {
      return; // no-op for sqlite
    }
    // Use raw query with IF NOT EXISTS pattern; CONCURRENTLY cannot be inside a transaction (our loader does not wrap in tx)
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens (user_id, token_hash) WHERE revoked_at IS NULL');
  },
  down: async (queryInterface: QueryInterface) => {
    const dialect = (queryInterface.sequelize.getDialect && queryInterface.sequelize.getDialect()) || 'unknown';
    if (dialect !== 'postgres') return;
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_refresh_tokens_active');
  }
};