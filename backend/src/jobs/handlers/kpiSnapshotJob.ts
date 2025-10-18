import { Job } from '../jobQueue';
import { aggregateDailyKpis } from '../../scripts/jobs/aggregateDailyKpis';
import { logger } from '../../utils/logger';
import { invalidateAnalyticsCaches } from '../../utils/cacheInvalidation';

export async function kpiSnapshotHandler(job: Job) {
  const { day } = job.payload as { day?: string };
  await aggregateDailyKpis(day ? new Date(day) : undefined);
  try { await invalidateAnalyticsCaches('kpi.snapshot'); } catch { /* ignore */ }
  logger.info('[job] KPI snapshot aggregated', { jobId: job.id, day });
}
