"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const N = parseInt(process.env.GOLDEN_WINDOW || '5', 10);
function loadScenarioHistory() {
    const dir = path_1.default.join(process.cwd(), 'perf-history');
    const map = {};
    if (!fs_1.default.existsSync(dir))
        return map;
    const files = fs_1.default.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('golden-baseline')).sort();
    for (const f of files) {
        try {
            const data = JSON.parse(fs_1.default.readFileSync(path_1.default.join(dir, f), 'utf8'));
            if (!data.scenario)
                continue;
            data._file = f;
            map[data.scenario] = map[data.scenario] || [];
            map[data.scenario].push(data);
        }
        catch { /* ignore */ }
    }
    return map;
}
function median(arr) {
    if (!arr.length)
        return undefined;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
(function main() {
    const hist = loadScenarioHistory();
    const golden = {};
    for (const [scenario, list] of Object.entries(hist)) {
        const tail = list.slice(-N);
        const p50Vals = tail.map(t => t.p50).filter(v => typeof v === 'number');
        const p95Vals = tail.map(t => t.p95).filter(v => typeof v === 'number');
        const rpsVals = tail.map(t => t.rpsAvg).filter(v => typeof v === 'number');
        golden[scenario] = {
            p50: median(p50Vals),
            p95: median(p95Vals),
            rpsAvg: median(rpsVals),
            count: tail.length
        };
    }
    const out = { generatedAt: new Date().toISOString(), window: N, golden };
    const dir = path_1.default.join(process.cwd(), 'perf-history');
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    fs_1.default.writeFileSync(path_1.default.join(dir, 'golden-baseline.json'), JSON.stringify(out, null, 2));
    console.log(JSON.stringify(out, null, 2));
})();
