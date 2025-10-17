"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllMigrations = runAllMigrations;
exports.revertLastMigration = revertLastMigration;
exports.migrationStatus = migrationStatus;
exports.createUmzug = createUmzug;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../config/database");
const MIGRATIONS_TABLE = 'migrations_meta';
function migrationsDir() {
    return path_1.default.join(__dirname, '../migrations');
}
function loadMigrations() {
    const dir = migrationsDir();
    const files = fs_1.default.readdirSync(dir)
        .filter(f => /\.(ts|js)$/.test(f) && /^[0-9]/.test(f))
        .sort();
    return files.map(file => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require(path_1.default.join(dir, file));
        const up = mod.up || (mod.default && mod.default.up);
        const down = mod.down || (mod.default && mod.default.down);
        if (!up)
            throw new Error(`Migration ${file} missing up()`);
        return { name: file, up, down };
    });
}
async function ensureMetaTable() {
    const qi = database_1.sequelize.getQueryInterface();
    // Use raw SQL with IF NOT EXISTS for portability (works in sqlite & postgres)
    if (database_1.sequelize.getDialect() === 'sqlite') {
        await database_1.sequelize.query(`CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (name TEXT PRIMARY KEY, executed_at TEXT NOT NULL)`);
    }
    else {
        await database_1.sequelize.query(`CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (name VARCHAR(255) PRIMARY KEY, executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    }
    return qi;
}
async function executedNames() {
    await ensureMetaTable();
    const [rows] = await database_1.sequelize.query(`SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY name`);
    return rows.map(r => r.name);
}
async function runAllMigrations() {
    const qi = await ensureMetaTable();
    const already = new Set(await executedNames());
    const migrations = loadMigrations();
    const pending = migrations.filter(m => !already.has(m.name));
    if (!pending.length) {
        console.log('[migrations] None pending');
        return [];
    }
    for (const m of pending) {
        console.log(`[migrations] Applying ${m.name}`);
        await m.up(qi);
        await database_1.sequelize.query(`INSERT INTO ${MIGRATIONS_TABLE} (name, executed_at) VALUES (?, ?)`, {
            replacements: [m.name, new Date().toISOString()]
        });
    }
    console.log('[migrations] executed:', pending.map(p => p.name));
    return pending.map(p => p.name);
}
async function revertLastMigration() {
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
    await database_1.sequelize.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE name = ?`, { replacements: [last] });
    return last;
}
async function migrationStatus() {
    const migrations = loadMigrations();
    const applied = new Set(await executedNames());
    const executed = migrations.filter(m => applied.has(m.name)).map(m => m.name);
    const pending = migrations.filter(m => !applied.has(m.name)).map(m => m.name);
    return { executed, pending };
}
// Backward export compatibility object
exports.default = { runAllMigrations, migrationStatus, revertLastMigration };
// createUmzug kept only for legacy imports; returns a facade with down() matching old usage
function createUmzug() {
    return {
        down: () => revertLastMigration()
    };
}
