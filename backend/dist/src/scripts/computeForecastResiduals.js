"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/*
  computeForecastResiduals.ts (Phase 10)
  Generates simple linear forecast for each KPI metric and computes residual (actual - predicted) for latest point.
  Outputs JSON and writes metrics-style snapshot file for potential ingestion.
*/
const METRICS = ['quotesSent', 'quotesAccepted', 'ordersCreated', 'ordersDelivered', 'inventoryNetChange'];
function linFit(values) {
    const n = values.length;
    if (!n)
        return { slope: 0, intercept: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const tMean = (n - 1) / 2;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        const t = i;
        num += (t - tMean) * (values[i] - mean);
        den += (t - tMean) * (t - tMean);
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = mean - slope * tMean;
    return { slope, intercept };
}
(async function main() {
    const daysBack = parseInt(process.env.RESIDUAL_LOOKBACK_DAYS || '90', 10);
    const since = new Date();
    since.setDate(since.getDate() - daysBack);
    const snapshots = await models_1.KpiDailySnapshot.findAll({ where: { date: { $gte: since } }, order: [['date', 'ASC']] });
    const results = [];
    for (const m of METRICS) {
        const series = snapshots.map(s => Number(s[m] || 0));
        if (series.length < 5)
            continue;
        const { slope, intercept } = linFit(series);
        const predicted = intercept + slope * (series.length - 1);
        const actual = series[series.length - 1];
        results.push({ metric: m, actual, predicted, residual: actual - predicted, sample: series.length, slope, intercept });
    }
    const out = { generatedAt: new Date().toISOString(), lookbackDays: daysBack, residuals: results };
    console.log(JSON.stringify(out, null, 2));
    try {
        const dir = path_1.default.join(process.cwd(), 'analytics-derived');
        if (!fs_1.default.existsSync(dir))
            fs_1.default.mkdirSync(dir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(dir, 'forecast-residuals.json'), JSON.stringify(out, null, 2));
    }
    catch { /* ignore */ }
})();
