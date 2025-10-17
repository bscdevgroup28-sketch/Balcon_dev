import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Migration guard utility (opt-in import by runtime code)
export async function ensureMigrations(migrateIfDev = true) {
  try {
    const { migrationStatus, runAllMigrations } = await import('./migrationLoader');
    const status = await migrationStatus();
    if (process.env.NODE_ENV === 'production') {
      if (status.pending.length) {
        // Fail fast in production if migrations missing
        // eslint-disable-next-line no-console
        console.error(`[startup] ${status.pending.length} pending migrations. Abort.`);
        process.exit(1);
      }
    } else if (migrateIfDev && status.pending.length) {
      // eslint-disable-next-line no-console
      console.log(`[startup] Auto-applying ${status.pending.length} pending migrations in ${process.env.NODE_ENV}`);
      await runAllMigrations();
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[startup] Migration guard failed', e);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
}