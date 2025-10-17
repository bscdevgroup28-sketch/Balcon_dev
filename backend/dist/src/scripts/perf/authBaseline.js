"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const autocannon_1 = __importDefault(require("autocannon"));
async function run() {
    const target = process.env.BASE_URL || 'http://localhost:8082';
    const url = `${target}/api/auth/login`;
    console.log(`[perf] Running auth baseline against ${url}`);
    const result = await (0, autocannon_1.default)({
        url,
        connections: Number(process.env.PERF_CONN || 10),
        duration: Number(process.env.PERF_DURATION || 15),
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: process.env.PERF_EMAIL || 'admin@example.com', password: process.env.PERF_PASSWORD || 'Password123!' })
    });
    const { latency, requests } = result;
    const summary = {
        scenario: 'auth.login',
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
