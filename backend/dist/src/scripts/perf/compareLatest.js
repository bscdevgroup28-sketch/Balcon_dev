"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function loadSummaries() {
    const dir = path_1.default.join(process.cwd(), 'perf-history');
    if (!fs_1.default.existsSync(dir))
        return [];
    const files = fs_1.default.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
    return files.map(f => {
        try {
            const data = JSON.parse(fs_1.default.readFileSync(path_1.default.join(dir, f), 'utf8'));
            data._file = f;
            return data;
        }
        catch {
            return null;
        }
    }).filter(Boolean);
}
function computeDelta(prev, curr, field) {
    const a = prev[field];
    const b = curr[field];
    if (typeof a !== 'number' || typeof b !== 'number')
        return null;
    return { prev: a, curr: b, pct: a === 0 ? null : ((b - a) / a * 100) };
}
(function main() {
    const all = loadSummaries();
    const byScenario = {};
    for (const s of all) {
        if (!s.scenario)
            continue;
        byScenario[s.scenario] = byScenario[s.scenario] || [];
        byScenario[s.scenario].push(s);
    }
    const report = [];
    for (const [scenario, list] of Object.entries(byScenario)) {
        if (list.length < 2)
            continue;
        const sorted = list.slice(-2);
        const prev = sorted[0];
        const curr = sorted[1];
        report.push({ scenario, p50: computeDelta(prev, curr, 'p50'), p95: computeDelta(prev, curr, 'p95'), rpsAvg: computeDelta(prev, curr, 'rpsAvg'), rpsP95: computeDelta(prev, curr, 'rpsP95') });
    }
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), comparisons: report }, null, 2));
})();
