"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kpiSnapshotHandler = kpiSnapshotHandler;
const aggregateDailyKpis_1 = require("../../scripts/jobs/aggregateDailyKpis");
const logger_1 = require("../../utils/logger");
const cacheInvalidation_1 = require("../../utils/cacheInvalidation");
async function kpiSnapshotHandler(job) {
    const { day } = job.payload;
    await (0, aggregateDailyKpis_1.aggregateDailyKpis)(day ? new Date(day) : undefined);
    try {
        await (0, cacheInvalidation_1.invalidateAnalyticsCaches)('kpi.snapshot');
    }
    catch { /* ignore */ }
    logger_1.logger.info('[job] KPI snapshot aggregated', { jobId: job.id, day });
}
