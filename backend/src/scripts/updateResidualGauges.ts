import fs from 'fs';
import path from 'path';
import { metrics } from '../monitoring/metrics';

/*
  updateResidualGauges.ts
  Reads analytics-derived/forecast-residuals.json and stores values in a global cache
  so the placeholder residual gauges can later be swapped to read these numbers.
  Current implementation simply logs and writes into (global as any).__residualCache.
*/

interface ResidualFile { residuals: { metric: string; residual: number }[] }

(function main(){
  try {
    const file = path.join(process.cwd(),'analytics-derived','forecast-residuals.json');
    if (!fs.existsSync(file)) {
      console.error('[residual] residual file not found');
      process.exit(0);
    }
    const parsed: ResidualFile = JSON.parse(fs.readFileSync(file,'utf8'));
    const cache: Record<string, number> = {};
    for (const r of parsed.residuals) cache[r.metric] = r.residual;
    (global as any).__residualCache = cache;
    // Optionally reflect sign buckets via counters (positive/negative residuals)
    Object.entries(cache).forEach(([m,v]) => {
      if (v > 0) metrics.increment(`analytics.forecast.residual_positive.${m}`); else if (v < 0) metrics.increment(`analytics.forecast.residual_negative.${m}`);
    });
    console.log('[residual] updated residual cache', cache);
  } catch (e:any) {
    console.error('[residual] update failed', e.message);
  }
})();