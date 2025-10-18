"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
  Pretest guard to avoid accidental verify loops in local dev.
  Usage: invoked from npm pretest. Set SKIP_VERIFY=1 to bypass expensive verification locally.
*/
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const skip = (process.env.SKIP_VERIFY || '').toLowerCase();
if (skip === '1' || skip === 'true') {
    console.log('[pretest] SKIP_VERIFY enabled: skipping migrations:verify');
    process.exit(0);
}
console.log('[pretest] Running migrations:verify');
// Ensure we run in the backend package root even if invoked via workspace from repo root
const backendCwd = path_1.default.resolve(__dirname, '../../');
const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const args = ['run', 'migrations:verify'];
const r = (0, child_process_1.spawnSync)(cmd, args, { stdio: 'inherit', cwd: backendCwd });
if (r.status !== 0) {
    // Fallback: try invoking ts-node directly via npx to avoid nested npm issues
    console.warn(`[pretest] migrations:verify returned status ${r.status}. Retrying via npx ts-node...`);
    const r2 = (0, child_process_1.spawnSync)(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['-y', 'ts-node', 'src/scripts/generateMigrationManifest.ts', '--verify'], { stdio: 'inherit', cwd: backendCwd });
    process.exit(r2.status ?? 1);
}
process.exit(0);
