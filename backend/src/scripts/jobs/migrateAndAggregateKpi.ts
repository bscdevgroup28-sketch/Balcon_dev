// Executes migrations then runs the daily KPI aggregation once.
// Useful for local validation with a clean isolated SQLite file.
import { sequelize } from '../../config/database';
import { aggregateDailyKpis } from './aggregateDailyKpis';
import { runAllMigrations } from '../migrationLoader';

async function main() {
  try {
    await runAllMigrations();
    // Now import models after migrations ensured
    await import('../../models');
    const result = await aggregateDailyKpis();
    console.log('[kpi] aggregation result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('[kpi] migrateAndAggregate failed', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();