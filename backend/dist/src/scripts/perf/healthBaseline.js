"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const autocannon_1 = __importDefault(require("autocannon"));
async function run() {
    const target = process.env.BASE_URL || 'http://localhost:8082';
    const url = `${target}/api/health`;
    console.log(`[perf] Running health baseline against ${url}`);
    const result = await (0, autocannon_1.default)({
        url,
        connections: Number(process.env.PERF_CONN || 20),
        duration: Number(process.env.PERF_DURATION || 10),
        method: 'GET'
    });
    const { latency, requests } = result;
    const summary = {
        scenario: 'health.check',
        p50: latency.p50,
        p95: latency.p95,
        rpsAvg: requests.average,
        rpsP95: requests.p95,
        duration: result.duration,
        connections: result.connections
    };
    console.log('[perf] summary', summary);
    console.log(JSON.stringify(summary, null, 2));
}
run().catch(e => { console.error(e); process.exit(1); });
