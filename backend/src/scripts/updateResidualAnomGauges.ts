import fs from 'fs';
import path from 'path';
/*
  updateResidualAnomGauges.ts (Phase 11)
  Loads residual-anomalies.json and populates global residual anomaly cache.
*/
interface ResidualAnom { anomalies: { metric: string; score: number }[] }
(function main(){
  try {
    const file = path.join(process.cwd(),'analytics-derived','residual-anomalies.json');
    if (!fs.existsSync(file)) { console.error('[residual-anom] file missing'); process.exit(0); }
    const parsed: ResidualAnom = JSON.parse(fs.readFileSync(file,'utf8'));
    const cache: Record<string, number> = {};
    parsed.anomalies.forEach(a => cache[a.metric] = a.score);
    (global as any).__residualAnomCache = cache;
    console.log('[residual-anom] cache updated', cache);
  } catch (e:any) {
    console.error('[residual-anom] update failed', e.message);
  }
})();
