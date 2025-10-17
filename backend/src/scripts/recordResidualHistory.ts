import fs from 'fs';
import path from 'path';
/*
  recordResidualHistory.ts (Phase 12)
  Appends current residuals (from forecast-residuals.json) into a rolling history file per metric.
  Output: analytics-derived/residual-history.json
  Structure: { generatedAt, maxSamples, metrics: { <metric>: { samples: { t:number, v:number }[] } } }
*/
const MAX_SAMPLES = parseInt(process.env.RESIDUAL_HISTORY_MAX_SAMPLES || '500',10);
(function main(){
  try {
    const residualFile = path.join(process.cwd(),'analytics-derived','forecast-residuals.json');
    if (!fs.existsSync(residualFile)) { console.error('[residual-history] missing forecast-residuals.json'); process.exit(0); }
    const residuals = JSON.parse(fs.readFileSync(residualFile,'utf8'));
    const metricsList = residuals.residuals || [];
    const histPath = path.join(process.cwd(),'analytics-derived','residual-history.json');
    let history:any = { generatedAt: new Date().toISOString(), maxSamples: MAX_SAMPLES, metrics: {} };
    if (fs.existsSync(histPath)) {
      try { history = JSON.parse(fs.readFileSync(histPath,'utf8')); } catch {/* ignore corrupt */}
    }
    if (!history.metrics) history.metrics = {};
    const now = Date.now();
    for (const r of metricsList) {
      if (!history.metrics[r.metric]) history.metrics[r.metric] = { samples: [] };
      history.metrics[r.metric].samples.push({ t: now, v: r.residual });
      // trim
      if (history.metrics[r.metric].samples.length > MAX_SAMPLES) {
        history.metrics[r.metric].samples.splice(0, history.metrics[r.metric].samples.length - MAX_SAMPLES);
      }
    }
    history.generatedAt = new Date().toISOString();
    fs.writeFileSync(histPath, JSON.stringify(history,null,2));
    console.log('[residual-history] updated');
  } catch (e:any) {
    console.error('[residual-history] failed', e.message);
  }
})();
