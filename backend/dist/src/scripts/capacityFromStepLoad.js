"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
(function main() {
    try {
        const dir = path_1.default.join(process.cwd(), 'perf-history');
        if (!fs_1.default.existsSync(dir)) {
            console.error('[capacity] perf-history missing');
            process.exit(0);
        }
        const files = fs_1.default.readdirSync(dir).filter(f => f.startsWith('step-load-') && f.endsWith('.json')).sort();
        if (!files.length) {
            console.error('[capacity] no step-load results');
            process.exit(0);
        }
        const latest = path_1.default.join(dir, files[files.length - 1]);
        const parsed = JSON.parse(fs_1.default.readFileSync(latest, 'utf8'));
        const stable = [];
        for (const r of parsed.results) {
            if (r.errors === 0 && r.timeouts === 0)
                stable.push(r);
            else
                break; // stop at first instability
        }
        if (!stable.length) {
            console.error('[capacity] no stable steps');
            process.exit(0);
        }
        const maxRps = Math.max(...stable.map(s => s.rps));
        const best = stable.reduce((m, s) => s.rps > m.rps ? s : m, stable[0]);
        const suggestionCode = maxRps < 50 ? 2 : (maxRps < 100 ? 1 : 0); // simplistic heuristic
        const out = { generatedAt: new Date().toISOString(), maxRps, optimalConnections: best.connections, suggestionCode };
        console.log(JSON.stringify(out, null, 2));
        const derivDir = path_1.default.join(process.cwd(), 'capacity-derived');
        if (!fs_1.default.existsSync(derivDir))
            fs_1.default.mkdirSync(derivDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(derivDir, 'capacity-latest.json'), JSON.stringify(out, null, 2));
    }
    catch (e) {
        console.error('[capacity] failed', e.message);
    }
})();
