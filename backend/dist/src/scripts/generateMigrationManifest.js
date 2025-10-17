"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMigrationManifest = main;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const migrationsDir = path_1.default.join(__dirname, '../migrations');
const manifestPath = path_1.default.join(__dirname, '../../migration-manifest.json');
function hashFile(fp) {
    const buf = fs_1.default.readFileSync(fp);
    return crypto_1.default.createHash('sha256').update(buf).digest('hex');
}
function buildManifest() {
    const files = fs_1.default.readdirSync(migrationsDir).filter(f => /^[0-9].+\.(ts|js)$/.test(f)).sort();
    return files.map(f => ({ name: f, sha256: hashFile(path_1.default.join(migrationsDir, f)) }));
}
function loadExisting() {
    if (!fs_1.default.existsSync(manifestPath))
        return null;
    try {
        return JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf8'));
    }
    catch {
        return null;
    }
}
function main() {
    const verifyOnly = process.argv.includes('--verify');
    const manifest = buildManifest();
    const existing = loadExisting();
    if (existing) {
        const diffs = [];
        const prevMap = new Map(existing.map(e => [e.name, e.sha256]));
        for (const entry of manifest) {
            const prev = prevMap.get(entry.name);
            if (prev && prev !== entry.sha256)
                diffs.push(`Hash mismatch: ${entry.name}`);
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
    fs_1.default.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('[migrations] Manifest generated at', manifestPath);
}
if (require.main === module) {
    main();
}
