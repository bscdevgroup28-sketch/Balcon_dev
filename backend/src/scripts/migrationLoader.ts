import fs from 'fs';
import path from 'path';
import { sequelize } from '../config/database';

const MIGRATIONS_TABLE = 'migrations_meta';

interface LoadedMigration {
  name: string;
  up: (queryInterface: any) => Promise<any>;
  down?: (queryInterface: any) => Promise<any>;
}

function migrationsDir() {
  return path.join(__dirname, '../migrations');
}

function loadMigrations(): LoadedMigration[] {
  const dir = migrationsDir();
  const files = fs.readdirSync(dir)
    .filter(f => /\.(ts|js)$/.test(f) && /^[0-9]/.test(f))
    .sort();
  return files.map(file => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(path.join(dir, file));
    const up = mod.up || (mod.default && mod.default.up);
    const down = mod.down || (mod.default && mod.default.down);
    if (!up) throw new Error(`Migration ${file} missing up()`);
    return { name: file, up, down };
  });
}

async function ensureMetaTable() {
  const qi = sequelize.getQueryInterface();
  // Use raw SQL with IF NOT EXISTS for portability (works in sqlite & postgres)
  if (sequelize.getDialect() === 'sqlite') {
    await sequelize.query(`CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (name TEXT PRIMARY KEY, executed_at TEXT NOT NULL)`);
  } else {
    await sequelize.query(`CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (name VARCHAR(255) PRIMARY KEY, executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  }
  return qi;
}

async function executedNames(): Promise<string[]> {
  await ensureMetaTable();
  const [rows] = await sequelize.query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`);
  return (rows as any[]).map(r => r.name);
}

export async function runAllMigrations() {
  const qi = await ensureMetaTable();
  const already = new Set(await executedNames());
  const migrations = loadMigrations();
  const pending = migrations.filter(m => !already.has(m.name));
  if (!pending.length) {
    console.log('[migrations] None pending');
    return [] as string[];
  }
  for (const m of pending) {
    console.log(`[migrations] Applying ${m.name}`);
    await m.up(qi);
    await sequelize.query(`INSERT INTO ${MIGRATIONS_TABLE} (name, executed_at) VALUES (?, ?)`, {
      replacements: [m.name, new Date().toISOString()]
    });
  }
  console.log('[migrations] executed:', pending.map(p => p.name));
  return pending.map(p => p.name);
}

export async function revertLastMigration() {
  const qi = await ensureMetaTable();
  const applied = await executedNames();
  if (!applied.length) {
    console.log('[migrations] No applied migrations to revert');
    return null;
  }
  const last = applied[applied.length - 1];
  const migrations = loadMigrations();
  const mig = migrations.find(m => m.name === last);
  if (!mig) {
    throw new Error(`Cannot find migration file for applied migration ${last}`);
  }
  if (!mig.down) {
    throw new Error(`Migration ${last} has no down()`);
  }
  console.log(`[migrations] Reverting ${last}`);
  await mig.down(qi);
  await sequelize.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE name = ?`, { replacements: [last] });
  return last;
}

export async function migrationStatus() {
  const migrations = loadMigrations();
  const applied = new Set(await executedNames());
  const executed = migrations.filter(m => applied.has(m.name)).map(m => m.name);
  const pending = migrations.filter(m => !applied.has(m.name)).map(m => m.name);
  return { executed, pending };
}

// Backward export compatibility object
export default { runAllMigrations, migrationStatus, revertLastMigration };

// createUmzug kept only for legacy imports; returns a facade with down() matching old usage
export function createUmzug() {
  return {
    down: () => revertLastMigration()
  } as any;
}