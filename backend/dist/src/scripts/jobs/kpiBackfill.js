"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Backfill KPI daily snapshots over a date range.
// Usage: ts-node src/scripts/jobs/kpiBackfill.ts 2025-09-01 2025-09-26
const date_fns_1 = require("date-fns");
const aggregateDailyKpis_1 = require("./aggregateDailyKpis");
const migrationLoader_1 = require("../migrationLoader");
const database_1 = require("../../config/database");
async function main() {
    await (0, migrationLoader_1.runAllMigrations)();
    const startArg = process.argv[2];
    const endArg = process.argv[3];
    if (!startArg || !endArg) {
        console.error('Usage: ts-node src/scripts/jobs/kpiBackfill.ts <start YYYY-MM-DD> <end YYYY-MM-DD>');
        process.exit(1);
    }
    let cursor = (0, date_fns_1.parseISO)(startArg);
    const end = (0, date_fns_1.parseISO)(endArg);
    const results = [];
    while (!(0, date_fns_1.isAfter)(cursor, end)) {
        process.env.KPI_OVERRIDE_DATE = (0, date_fns_1.formatISO)(cursor, { representation: 'date' });
        const res = await (0, aggregateDailyKpis_1.aggregateDailyKpis)();
        results.push(res);
        cursor = (0, date_fns_1.addDays)(cursor, 1);
    }
    console.log('[kpi:backfill] completed', results.length, 'days');
    console.table(results.map(r => ({ day: r.day, quotesSent: r.quotesSent, ordersCreated: r.ordersCreated })));
    await database_1.sequelize.close();
}
main().catch(e => { console.error(e); process.exit(1); });
