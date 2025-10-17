// Cross-shell runner for KPI migrated aggregation
process.env.DATABASE_URL = process.env.DATABASE_URL || 'sqlite:./kpi_migrated.sqlite';
require('ts-node/register');
require('./src/scripts/jobs/migrateAndAggregateKpi.ts');
