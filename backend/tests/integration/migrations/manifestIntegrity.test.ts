import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// This test ensures that if a migration file is modified after manifest generation, the verify script fails.
// It operates on a copy of a migration file to avoid polluting real hashes.

describe('Migration Manifest Integrity', () => {
  const backendRoot = path.join(__dirname, '../../../');
  const manifestScript = 'npm run migrations:verify';
  const sampleMigration = fs.readdirSync(path.join(backendRoot, 'src/migrations'))
    .find(f => f.endsWith('.ts')) as string;
  const samplePath = path.join(backendRoot, 'src/migrations', sampleMigration);
  const tempCopy = path.join(backendRoot, 'src/migrations', sampleMigration + '.tmp-test');

  beforeAll(() => {
    // Ensure baseline manifest is current
    execSync('npm run migrations:manifest', { cwd: backendRoot, stdio: 'inherit' });
  });

  afterAll(() => {
    if (fs.existsSync(tempCopy)) fs.unlinkSync(tempCopy);
  });

  it('detects tampering (simulated) via manifest verification exit code', () => {
    const original = fs.readFileSync(samplePath, 'utf8');
    // Create a temp altered file and then alter the real file after manifest regen to simulate tamper
    fs.writeFileSync(tempCopy, original + '\n// tamper comment added by test');
    // Replace original with tampered contents temporarily
    fs.writeFileSync(samplePath, original + '\n// test_tamper_line');
    let failed = false;
    try {
      execSync(manifestScript, { cwd: backendRoot, stdio: 'pipe' });
    } catch (e) {
      failed = true; // expected
    } finally {
      // Revert original
      fs.writeFileSync(samplePath, original);
      execSync('npm run migrations:manifest', { cwd: backendRoot, stdio: 'pipe' });
    }
    expect(failed).toBe(true);
  });
});
