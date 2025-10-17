import { QueryInterface } from 'sequelize';

// Align quotes.userId & orders.userId foreign keys to users table (was enhanced_users in legacy models)
export async function up(qi: QueryInterface) {
  const dialect = qi.sequelize.getDialect();
  if (dialect === 'postgres') {
    // Drop old constraints if they exist; names may vary, so attempt multiple
    const attempts = [
      'ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_userId_fkey',
      'ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_userId_fkey'
    ];
    for (const sql of attempts) { try { await qi.sequelize.query(sql); } catch { /* ignore */ } }
    await qi.sequelize.query('ALTER TABLE quotes ADD CONSTRAINT fk_quotes_userId FOREIGN KEY ("userId") REFERENCES users(id)');
    await qi.sequelize.query('ALTER TABLE orders ADD CONSTRAINT fk_orders_userId FOREIGN KEY ("userId") REFERENCES users(id)');
  }
  // SQLite auto-handles without explicit alteration (would require table rebuild); skip.
}

export async function down(qi: QueryInterface) {
  const dialect = qi.sequelize.getDialect();
  if (dialect === 'postgres') {
    // Cannot reliably restore old enhanced_users reference; no-op.
  }
}
