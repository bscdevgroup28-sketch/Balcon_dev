"use strict";
// Run migrations against an explicitly provided sqlite database file name.
// Usage: ts-node src/scripts/runMigrationsIsolated.ts kpi_fresh.sqlite
// Must set DATABASE_URL before importing config/database or migration loader that imports it.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
const dbFileArg = process.argv[2] || 'kpi_fresh.sqlite';
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `sqlite:./${dbFileArg}`;
    // For visibility
    console.log('[isolate] DATABASE_URL=', process.env.DATABASE_URL);
}
async function main() {
    const { runAllMigrations, migrationStatus } = await Promise.resolve().then(() => __importStar(require('./migrationLoader')));
    const before = await migrationStatus();
    console.log('[isolate] before status pending:', before.pending.map((m) => m.name));
    await runAllMigrations();
    const after = await migrationStatus();
    console.log('[isolate] after status pending:', after.pending.map((m) => m.name));
}
main().catch(err => { console.error(err); process.exit(1); });
