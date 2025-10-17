"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Simple development scheduler for daily KPI aggregation.
// In production use a real scheduler (cron job, container task, or external orchestration).
const node_cron_1 = __importDefault(require("node-cron"));
const migrationLoader_1 = require("../migrationLoader");
const aggregateDailyKpis_1 = require("./aggregateDailyKpis");
async function runOnce() {
    await (0, migrationLoader_1.runAllMigrations)();
    await (0, aggregateDailyKpis_1.aggregateDailyKpis)();
}
async function start() {
    console.log('[kpi:scheduler] starting...');
    await runOnce();
    // Run at 00:10 UTC daily
    node_cron_1.default.schedule('10 0 * * *', async () => {
        try {
            console.log('[kpi:scheduler] cron tick');
            await runOnce();
        }
        catch (e) {
            console.error('[kpi:scheduler] error', e);
        }
    }, { timezone: 'UTC' });
}
start().catch(e => { console.error(e); process.exit(1); });
