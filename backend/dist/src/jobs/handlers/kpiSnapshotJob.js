"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kpiSnapshotHandler = kpiSnapshotHandler;
const aggregateDailyKpis_1 = require("../../scripts/jobs/aggregateDailyKpis");
const logger_1 = require("../../utils/logger");
async function kpiSnapshotHandler(job) {
    const { day } = job.payload;
    await (0, aggregateDailyKpis_1.aggregateDailyKpis)(day ? new Date(day) : undefined);
    logger_1.logger.info('[job] KPI snapshot aggregated', { jobId: job.id, day });
}
