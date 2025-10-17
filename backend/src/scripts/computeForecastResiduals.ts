import { KpiDailySnapshot } from '../models';
import fs from 'fs';
import path from 'path';

/*
  computeForecastResiduals.ts (Phase 10)
  Generates simple linear forecast for each KPI metric and computes residual (actual - predicted) for latest point.
  Outputs JSON and writes metrics-style snapshot file for potential ingestion.
*/

const METRICS = ['quotesSent','quotesAccepted','ordersCreated','ordersDelivered','inventoryNetChange'] as const;

interface Residual { metric: string; actual: number; predicted: number; residual: number; sample: number; slope: number; intercept: number }

function linFit(values: number[]) {
  const n = values.length;
  if (!n) return { slope: 0, intercept: 0 };
  const mean = values.reduce((a,b)=>a+b,0)/n;
  const tMean = (n-1)/2;
  let num=0, den=0;
  for (let i=0;i<n;i++){ const t=i; num+=(t-tMean)*(values[i]-mean); den+=(t-tMean)*(t-tMean); }
  const slope = den===0?0:num/den;
  const intercept = mean - slope*tMean;
  return { slope, intercept };
}

(async function main(){
  const daysBack = parseInt(process.env.RESIDUAL_LOOKBACK_DAYS || '90',10);
  const since = new Date(); since.setDate(since.getDate()-daysBack);
  const snapshots = await KpiDailySnapshot.findAll({ where: { date: { $gte: since as any } }, order: [['date','ASC']] } as any);
  const results: Residual[] = [];
  for (const m of METRICS) {
    const series = snapshots.map(s => Number((s as any)[m] || 0));
    if (series.length < 5) continue;
    const { slope, intercept } = linFit(series);
    const predicted = intercept + slope * (series.length - 1);
    const actual = series[series.length - 1];
    results.push({ metric: m, actual, predicted, residual: actual - predicted, sample: series.length, slope, intercept });
  }
  const out = { generatedAt: new Date().toISOString(), lookbackDays: daysBack, residuals: results };
  console.log(JSON.stringify(out,null,2));
  try {
    const dir = path.join(process.cwd(),'analytics-derived');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'forecast-residuals.json'), JSON.stringify(out,null,2));
  } catch {/* ignore */}
})();
