import fs from 'fs';
import path from 'path';
/*
  updateCapacityGauges.ts (Phase 11)
  Loads capacity-derived/capacity-latest.json, stores values in global capacity cache for gauges.
*/
interface Cap { maxRps: number; optimalConnections: number; suggestionCode: number }
(function main(){
  try {
    const file = path.join(process.cwd(),'capacity-derived','capacity-latest.json');
    if (!fs.existsSync(file)) { console.error('[capacity] derived file missing'); process.exit(0); }
    const parsed: Cap = JSON.parse(fs.readFileSync(file,'utf8'));
    (global as any).__capacityCache = parsed;
    console.log('[capacity] cache updated', parsed);
  } catch (e:any) {
    console.error('[capacity] update failed', e.message);
  }
})();
