/*
  Pretest guard to avoid accidental verify loops in local dev.
  Usage: invoked from npm pretest. Set SKIP_VERIFY=1 to bypass expensive verification locally.
*/
import { execSync } from 'child_process';
import path from 'path';

const skip = (process.env.SKIP_VERIFY || '').toLowerCase();
if (skip === '1' || skip === 'true') {
  console.log('[pretest] SKIP_VERIFY enabled: skipping migrations:verify');
  process.exit(0);
}

console.log('[pretest] Running migrations:verify');
// Ensure we run in the backend package root even if invoked via workspace from repo root
const backendCwd = path.resolve(__dirname, '../../');

try {
  // Use execSync for better Windows compatibility
  execSync('npx ts-node src/scripts/generateMigrationManifest.ts --verify', {
    cwd: backendCwd,
    stdio: 'inherit',
    encoding: 'utf-8'
  });
  console.log('[pretest] migrations:verify passed');
  process.exit(0);
} catch (error: any) {
  console.error(`[pretest] migrations:verify failed with exit code ${error.status || 1}`);
  process.exit(error.status || 1);
}
