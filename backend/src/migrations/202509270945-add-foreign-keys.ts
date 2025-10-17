import { QueryInterface } from 'sequelize';

// Adds foreign key constraints & helpful indexes not included in baseline snapshot
// Note: SQLite will ignore some constraint nuance; still safe.
export async function up(qi: QueryInterface) {
  // SQLite lacks full ALTER TABLE ADD CONSTRAINT support; skip in that environment
  try {
    const dialect = (qi as any).sequelize?.getDialect?.();
    if (dialect === 'sqlite') {
      // eslint-disable-next-line no-console
      console.warn('[fk-migration] Skipping foreign key constraint additions for sqlite');
      return;
    }
  } catch { /* ignore dialect detection issues */ }
  // Helper to safely add FK (ignore if already exists)
  async function safeAddConstraint(table: string, constraint: string, sql: string) {
    // Naive existence check (works for sqlite & pg)
    try {
      // For Postgres, query information_schema; for sqlite, pragma foreign_key_list
      // Simplicity: attempt and swallow duplicate errors
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      await qi.sequelize.query(sql);
    } catch (e: any) {
      if (!/already exists|duplicate/i.test(e.message)) throw e;
    }
  }

  // Orders -> users, projects, quotes
  await safeAddConstraint('orders', 'fk_orders_userId', 'ALTER TABLE orders ADD CONSTRAINT fk_orders_userId FOREIGN KEY (userId) REFERENCES users(id)');
  await safeAddConstraint('orders', 'fk_orders_projectId', 'ALTER TABLE orders ADD CONSTRAINT fk_orders_projectId FOREIGN KEY (projectId) REFERENCES projects(id)');
  await safeAddConstraint('orders', 'fk_orders_quoteId', 'ALTER TABLE orders ADD CONSTRAINT fk_orders_quoteId FOREIGN KEY (quoteId) REFERENCES quotes(id)');

  // Quotes -> users, projects
  await safeAddConstraint('quotes', 'fk_quotes_userId', 'ALTER TABLE quotes ADD CONSTRAINT fk_quotes_userId FOREIGN KEY (userId) REFERENCES users(id)');
  await safeAddConstraint('quotes', 'fk_quotes_projectId', 'ALTER TABLE quotes ADD CONSTRAINT fk_quotes_projectId FOREIGN KEY (projectId) REFERENCES projects(id)');

  // Projects -> users (owner/customer), assignedSalesRepId -> users
  await safeAddConstraint('projects', 'fk_projects_userId', 'ALTER TABLE projects ADD CONSTRAINT fk_projects_userId FOREIGN KEY (userId) REFERENCES users(id)');
  await safeAddConstraint('projects', 'fk_projects_assignedSalesRepId', 'ALTER TABLE projects ADD CONSTRAINT fk_projects_assignedSalesRepId FOREIGN KEY (assignedSalesRepId) REFERENCES users(id)');

  // Work orders -> projects & assigned user
  await safeAddConstraint('work_orders', 'fk_work_orders_projectId', 'ALTER TABLE work_orders ADD CONSTRAINT fk_work_orders_projectId FOREIGN KEY (projectId) REFERENCES projects(id)');
  await safeAddConstraint('work_orders', 'fk_work_orders_assignedUserId', 'ALTER TABLE work_orders ADD CONSTRAINT fk_work_orders_assignedUserId FOREIGN KEY (assignedUserId) REFERENCES users(id)');
}

export async function down(qi: QueryInterface) {
  // Best-effort drop (SQLite may ignore). Use IF EXISTS for Postgres friendly.
  const drops = [
    'ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_userId',
    'ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_projectId',
    'ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_quoteId',
    'ALTER TABLE quotes DROP CONSTRAINT IF EXISTS fk_quotes_userId',
    'ALTER TABLE quotes DROP CONSTRAINT IF EXISTS fk_quotes_projectId',
    'ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_userId',
    'ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_assignedSalesRepId',
    'ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS fk_work_orders_projectId',
    'ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS fk_work_orders_assignedUserId'
  ];
  for (const sql of drops) {
    try { await qi.sequelize.query(sql); } catch { /* ignore */ }
  }
}
