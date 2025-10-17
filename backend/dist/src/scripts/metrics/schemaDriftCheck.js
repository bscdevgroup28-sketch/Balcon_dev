"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const metrics_1 = require("../../monitoring/metrics");
/*
  Compares current metrics snapshot-derived schema (names only) with committed baseline.json.
  Exits non-zero if metrics were REMOVED. Additions cause a warning (exit code configurable via FAIL_ON_ADDITION=1).
*/
function currentNames() {
    const snap = metrics_1.metrics.snapshot();
    const names = new Set();
    Object.keys(snap.counters).forEach(n => names.add(n));
    Object.keys(snap.gauges).forEach(n => names.add(n));
    // derive histogram base names
    Object.keys(snap.hist).forEach(h => {
        const m = /(.*)\.le_(\d+|inf)$/.exec(h);
        if (m)
            names.add(m[1]);
    });
    return Array.from(names).sort();
}
function loadBaseline() {
    const file = path_1.default.join(process.cwd(), 'metrics-schema', 'baseline.json');
    if (!fs_1.default.existsSync(file))
        return [];
    try {
        const data = JSON.parse(fs_1.default.readFileSync(file, 'utf8'));
        return (data.metrics || []).sort();
    }
    catch {
        return [];
    }
}
(function main() {
    const baseline = loadBaseline();
    const current = currentNames();
    const baseSet = new Set(baseline);
    const currSet = new Set(current);
    const removed = baseline.filter(b => !currSet.has(b));
    const added = current.filter(c => !baseSet.has(c));
    const failOnAddition = process.env.FAIL_ON_ADDITION === '1';
    const result = { removed, added, baselineCount: baseline.length, currentCount: current.length };
    console.log(JSON.stringify(result, null, 2));
    if (removed.length) {
        console.error('[metrics-schema] ERROR: Removed metrics detected');
        process.exit(1);
    }
    if (failOnAddition && added.length) {
        console.error('[metrics-schema] ERROR: Additions detected (FAIL_ON_ADDITION=1)');
        process.exit(1);
    }
})();
