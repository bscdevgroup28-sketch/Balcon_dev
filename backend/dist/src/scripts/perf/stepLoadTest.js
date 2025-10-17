"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const autocannon_1 = __importDefault(require("autocannon"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function runStep(url, connections) {
    return new Promise((resolve, reject) => {
        const inst = (0, autocannon_1.default)({ url, connections, duration: 10 });
        inst.on('done', (res) => {
            resolve({
                connections,
                rps: res.requests.average,
                p95: res.latency.p95,
                p50: res.latency.p50,
                errors: res.errors,
                timeouts: res.timeouts
            });
        });
        inst.on('error', reject);
    });
}
(async function main() {
    const url = process.argv[2];
    const maxConn = parseInt(process.argv[3] || '100', 10);
    const step = parseInt(process.argv[4] || '10', 10);
    if (!url) {
        console.error('Usage: stepLoadTest <url> <maxConnections> <stepSize>');
        process.exit(1);
    }
    const results = [];
    for (let c = step; c <= maxConn; c += step) {
        // eslint-disable-next-line no-console
        console.log(`[step] Testing connections=${c}`);
        try {
            const r = await runStep(url, c);
            results.push(r);
            // eslint-disable-next-line no-console
            console.log(`[step] c=${c} rps=${r.rps} p95=${r.p95}`);
            if (r.errors > 0 || r.timeouts > 0) {
                // capture and stop early if instability appears
                break;
            }
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.error('[step] failed', e.message);
            break;
        }
    }
    const out = { generatedAt: new Date().toISOString(), url, maxConn, step, results };
    const dir = path_1.default.join(process.cwd(), 'perf-history');
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    const file = path_1.default.join(dir, `step-load-${Date.now()}.json`);
    fs_1.default.writeFileSync(file, JSON.stringify(out, null, 2));
    process.stdout.write(JSON.stringify(out, null, 2));
})();
