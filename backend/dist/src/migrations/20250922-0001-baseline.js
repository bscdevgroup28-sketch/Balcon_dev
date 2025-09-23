"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
// Baseline migration: ensures migrations system is initialized without altering existing schema.
// Future structural changes should be added in subsequent numbered files.
async function up({ context }) {
    // Example: ensure migrations_meta table will be created by Umzug storage automatically.
    // Could optionally verify a core table exists.
    // No-op to establish baseline.
}
async function down({ context }) {
    // Intentionally noop; baseline should not be reverted.
}
