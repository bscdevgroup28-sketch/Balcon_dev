import fs from 'fs';
import path from 'path';

/*
  syntheticProbe.ts
  Simple synthetic availability probe hitting core endpoints sequentially.
  Emits JSON result and updates a rolling local history file (probe-history.json).
  Use in CI or external cron to feed availability tracking / early outage detection.
*/

interface ProbeResult { endpoint: string; ok: boolean; status: number; latencyMs: number; error?: string }

const TARGETS = (process.env.SYNTHETIC_ENDPOINTS || '/api/health,/api/projects').split(',').map(s=>s.trim()).filter(Boolean);
const BASE = process.env.SYNTHETIC_BASE_URL || 'http://localhost:8082';

async function check(url: string): Promise<ProbeResult> {
  const started = Date.now();
  try {
    const mod = await import('node-fetch');
    const fetchFn: any = (mod as any).default || (mod as any);
    const resp = await fetchFn(BASE + url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    const latencyMs = Date.now() - started;
    return { endpoint: url, ok: resp.ok, status: resp.status, latencyMs };
  } catch (e:any) {
    return { endpoint: url, ok: false, status: 0, latencyMs: Date.now() - started, error: e.message };
  }
}

(async function main(){
  const results = [] as ProbeResult[];
  for (const t of TARGETS) {
    results.push(await check(t));
  }
  const availability = results.filter(r=>r.ok).length / (results.length || 1);
  const out = { timestamp: new Date().toISOString(), base: BASE, availability, results };
  console.log(JSON.stringify(out,null,2));
  try {
    const dir = path.join(process.cwd(),'probe-history');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
    const file = path.join(dir,'probe-history.json');
    let hist: any[] = [];
    if (fs.existsSync(file)) {
      try { hist = JSON.parse(fs.readFileSync(file,'utf8')); } catch { hist = []; }
    }
    hist.push(out);
    if (hist.length > 200) hist.splice(0, hist.length - 200);
    fs.writeFileSync(file, JSON.stringify(hist,null,2));
  } catch { /* ignore */ }
})();
