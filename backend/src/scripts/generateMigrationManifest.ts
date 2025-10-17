import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const migrationsDir = path.join(__dirname, '../migrations');
const manifestPath = path.join(__dirname, '../../migration-manifest.json');

interface Entry { name: string; sha256: string }

function hashFile(fp: string) {
  const buf = fs.readFileSync(fp);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function buildManifest(): Entry[] {
  const files = fs.readdirSync(migrationsDir).filter(f => /^[0-9].+\.(ts|js)$/.test(f)).sort();
  return files.map(f => ({ name: f, sha256: hashFile(path.join(migrationsDir, f)) }));
}

function loadExisting(): Entry[] | null {
  if (!fs.existsSync(manifestPath)) return null;
  try { return JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { return null; }
}

function main() {
  const verifyOnly = process.argv.includes('--verify');
  const manifest = buildManifest();
  const existing = loadExisting();
  if (existing) {
    const diffs: string[] = [];
    const prevMap = new Map(existing.map(e => [e.name, e.sha256]));
    for (const entry of manifest) {
      const prev = prevMap.get(entry.name);
      if (prev && prev !== entry.sha256) diffs.push(`Hash mismatch: ${entry.name}`);
    }
    if (diffs.length) {
      console.error('[migrations] Manifest integrity check FAILED');
      diffs.forEach(d => console.error(' -', d));
      process.exit(2);
    }
  }
  if (verifyOnly) {
    console.log('[migrations] Manifest verified OK');
    return;
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('[migrations] Manifest generated at', manifestPath);
}

if (require.main === module) {
  main();
}

export { main as generateMigrationManifest };