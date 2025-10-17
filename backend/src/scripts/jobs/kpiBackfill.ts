// Backfill KPI daily snapshots over a date range.
// Usage: ts-node src/scripts/jobs/kpiBackfill.ts 2025-09-01 2025-09-26
import { parseISO, addDays, formatISO, isAfter } from 'date-fns';
import { aggregateDailyKpis } from './aggregateDailyKpis';
import { runAllMigrations } from '../migrationLoader';
import { sequelize } from '../../config/database';

async function main() {
  await runAllMigrations();
  const startArg = process.argv[2];
  const endArg = process.argv[3];
  if(!startArg || !endArg) {
    console.error('Usage: ts-node src/scripts/jobs/kpiBackfill.ts <start YYYY-MM-DD> <end YYYY-MM-DD>');
    process.exit(1);
  }
  let cursor = parseISO(startArg);
  const end = parseISO(endArg);
  const results: any[] = [];
  while(!isAfter(cursor, end)) {
    process.env.KPI_OVERRIDE_DATE = formatISO(cursor, { representation: 'date' });
    const res = await aggregateDailyKpis();
    results.push(res);
    cursor = addDays(cursor, 1);
  }
  console.log('[kpi:backfill] completed', results.length, 'days');
  console.table(results.map(r => ({ day: r.day, quotesSent: r.quotesSent, ordersCreated: r.ordersCreated })));
  await sequelize.close();
}

main().catch(e => { console.error(e); process.exit(1); });
