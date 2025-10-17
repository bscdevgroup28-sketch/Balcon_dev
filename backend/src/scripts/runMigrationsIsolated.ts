// Run migrations against an explicitly provided sqlite database file name.
// Usage: ts-node src/scripts/runMigrationsIsolated.ts kpi_fresh.sqlite
// Must set DATABASE_URL before importing config/database or migration loader that imports it.

const dbFileArg = process.argv[2] || 'kpi_fresh.sqlite';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `sqlite:./${dbFileArg}`;
  // For visibility
  console.log('[isolate] DATABASE_URL=', process.env.DATABASE_URL);
}

async function main() {
  const { runAllMigrations, migrationStatus } = await import('./migrationLoader');
  const before = await migrationStatus();
  console.log('[isolate] before status pending:', before.pending.map((m:any)=>m.name));
  await runAllMigrations();
  const after = await migrationStatus();
  console.log('[isolate] after status pending:', after.pending.map((m:any)=>m.name));
}

main().catch(err => { console.error(err); process.exit(1); });