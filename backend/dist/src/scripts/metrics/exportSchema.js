"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/*
  Exports current metrics schema (names & types) by introspecting the metrics snapshot and histogram buckets.
  Usage: ts-node src/scripts/metrics/exportSchema.ts (or compiled dist path)
  Produces JSON to stdout and optionally writes to metrics-schema/ directory if METRICS_SCHEMA_WRITE=1.
*/
const metrics_1 = require("../../monitoring/metrics");
function exportSchema() {
    const snap = metrics_1.metrics.snapshot();
    const counters = Object.keys(snap.counters).map(name => ({ name, type: 'counter' }));
    const gauges = Object.keys(snap.gauges).map(name => ({ name, type: 'gauge' }));
    // Hist counts encoded as name.le_<bucket>; reconstruct base names
    const histBase = {};
    Object.keys(snap.hist).forEach(h => {
        const m = /(.*)\.le_(\d+|inf)$/.exec(h);
        if (!m)
            return;
        const base = m[1];
        const bucketStr = m[2];
        if (bucketStr === 'inf')
            return;
        const val = parseFloat(bucketStr);
        if (!histBase[base])
            histBase[base] = new Set();
        histBase[base].add(val);
    });
    const hist = Object.entries(histBase).map(([name, set]) => ({ name, type: 'histogram', buckets: Array.from(set).sort((a, b) => a - b) }));
    return [...counters, ...gauges, ...hist].sort((a, b) => a.name.localeCompare(b.name));
}
(function main() {
    const schema = exportSchema();
    const out = { generatedAt: new Date().toISOString(), count: schema.length, schema };
    const json = JSON.stringify(out, null, 2);
    console.log(json);
    if (process.env.METRICS_SCHEMA_WRITE === '1') {
        const dir = path_1.default.join(process.cwd(), 'metrics-schema');
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        const file = path_1.default.join(dir, `metrics-schema-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
        fs_1.default.writeFileSync(file, json);
        console.error('[metrics-schema] written', file);
    }
})();
