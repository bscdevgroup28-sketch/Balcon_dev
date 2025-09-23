import { QueryInterface } from 'sequelize';

// Baseline migration: ensures migrations system is initialized without altering existing schema.
// Future structural changes should be added in subsequent numbered files.

export async function up({ context }: { context: QueryInterface }) {
  // Example: ensure migrations_meta table will be created by Umzug storage automatically.
  // Could optionally verify a core table exists.
  // No-op to establish baseline.
}

export async function down({ context }: { context: QueryInterface }) {
  // Intentionally noop; baseline should not be reverted.
}
