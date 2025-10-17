// Simple development scheduler for daily KPI aggregation.
// In production use a real scheduler (cron job, container task, or external orchestration).
import cron from 'node-cron';
import { runAllMigrations } from '../migrationLoader';
import { aggregateDailyKpis } from './aggregateDailyKpis';

async function runOnce() {
  await runAllMigrations();
  await aggregateDailyKpis();
}

async function start() {
  console.log('[kpi:scheduler] starting...');
  await runOnce();
  // Run at 00:10 UTC daily
  cron.schedule('10 0 * * *', async () => {
    try {
      console.log('[kpi:scheduler] cron tick');
      await runOnce();
    } catch (e) {
      console.error('[kpi:scheduler] error', e);
    }
  }, { timezone: 'UTC' });
}

start().catch(e => { console.error(e); process.exit(1); });