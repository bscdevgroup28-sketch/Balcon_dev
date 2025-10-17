import fs from 'fs';
import path from 'path';
/*
  capacityFromStepLoad.ts (Phase 11)
  Reads latest step-load-*.json file from perf-history, computes max stable RPS and optimal concurrency.
  Suggestion code: 0=ok,1=approaching,2=scale_recommended
*/
interface StepResult { connections: number; rps: number; p95: number; errors: number; timeouts: number }
interface StepFile { results: StepResult[] }

(function main(){
  try {
    const dir = path.join(process.cwd(),'perf-history');
    if (!fs.existsSync(dir)) { console.error('[capacity] perf-history missing'); process.exit(0); }
    const files = fs.readdirSync(dir).filter(f=>f.startsWith('step-load-') && f.endsWith('.json')).sort();
    if (!files.length) { console.error('[capacity] no step-load results'); process.exit(0); }
    const latest = path.join(dir, files[files.length-1]);
    const parsed: StepFile = JSON.parse(fs.readFileSync(latest,'utf8'));
    const stable: StepResult[] = [];
    for (const r of parsed.results) {
      if (r.errors === 0 && r.timeouts === 0) stable.push(r); else break; // stop at first instability
    }
    if (!stable.length) { console.error('[capacity] no stable steps'); process.exit(0); }
    const maxRps = Math.max(...stable.map(s=>s.rps));
    const best = stable.reduce((m,s)=> s.rps>m.rps?s:m, stable[0]);
    const suggestionCode = maxRps < 50 ? 2 : (maxRps < 100 ? 1 : 0); // simplistic heuristic
    const out = { generatedAt: new Date().toISOString(), maxRps, optimalConnections: best.connections, suggestionCode };
    console.log(JSON.stringify(out,null,2));
    const derivDir = path.join(process.cwd(),'capacity-derived');
    if (!fs.existsSync(derivDir)) fs.mkdirSync(derivDir,{recursive:true});
    fs.writeFileSync(path.join(derivDir,'capacity-latest.json'), JSON.stringify(out,null,2));
  } catch (e:any) {
    console.error('[capacity] failed', e.message);
  }
})();
