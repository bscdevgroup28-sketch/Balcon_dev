import { QueryInterface } from 'sequelize';

// Baseline migration: ensures migrations system is initialized without altering existing schema.
// Future structural changes should be added in subsequent numbered files.

export async function up(arg: { context: QueryInterface } | QueryInterface) {
  const _context: QueryInterface = (arg as any).context || (arg as any);
  // Example: ensure migrations_meta table will be created by Umzug storage automatically.
  // Could optionally verify a core table exists.
  // No-op to establish baseline.
}

export async function down(arg: { context: QueryInterface } | QueryInterface) {
  const _context: QueryInterface = (arg as any).context || (arg as any);
  // Intentionally noop; baseline should not be reverted.
}
