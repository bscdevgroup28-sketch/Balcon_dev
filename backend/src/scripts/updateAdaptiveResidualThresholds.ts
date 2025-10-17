import fs from 'fs';
import path from 'path';
/*
  updateAdaptiveResidualThresholds.ts (Phase 12)
  Loads analytics-derived/residual-thresholds.json into global cache for adaptive deviation gauges.
*/
(function main(){
  try {
    const file = path.join(process.cwd(),'analytics-derived','residual-thresholds.json');
    if (!fs.existsSync(file)) { console.error('[residual-thresh] thresholds file missing'); process.exit(0); }
    const parsed = JSON.parse(fs.readFileSync(file,'utf8'));
    (global as any).__residualAdaptiveThresholds = parsed;
    console.log('[residual-thresh] cache loaded');
  } catch (e:any) {
    console.error('[residual-thresh] load failed', e.message);
  }
})();
