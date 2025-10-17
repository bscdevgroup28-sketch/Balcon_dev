import fs from 'fs';
import path from 'path';

/*
  goldenBaseline.ts
  Computes a "golden" baseline per scenario using the median of the last N (default 5) baselines.
  Output stored as perf-history/golden-baseline.json for comparison by other tools.
*/

interface Summary { scenario: string; p50?: number; p95?: number; rpsAvg?: number; _file?: string }

const N = parseInt(process.env.GOLDEN_WINDOW || '5', 10);

function loadScenarioHistory(): Record<string, Summary[]> {
  const dir = path.join(process.cwd(), 'perf-history');
  const map: Record<string, Summary[]> = {};
  if (!fs.existsSync(dir)) return map;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.startsWith('golden-baseline')).sort();
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')) as Summary;
      if (!data.scenario) continue;
      data._file = f;
      map[data.scenario] = map[data.scenario] || [];
      map[data.scenario].push(data);
    } catch { /* ignore */ }
  }
  return map;
}

function median(arr: number[]): number|undefined {
  if (!arr.length) return undefined;
  const sorted = [...arr].sort((a,b)=>a-b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid-1] + sorted[mid]) / 2;
}

(function main(){
  const hist = loadScenarioHistory();
  const golden: Record<string, { p50?: number; p95?: number; rpsAvg?: number; count: number }> = {};
  for (const [scenario, list] of Object.entries(hist)) {
    const tail = list.slice(-N);
    const p50Vals = tail.map(t => t.p50!).filter(v=>typeof v === 'number');
    const p95Vals = tail.map(t => t.p95!).filter(v=>typeof v === 'number');
    const rpsVals = tail.map(t => t.rpsAvg!).filter(v=>typeof v === 'number');
    golden[scenario] = {
      p50: median(p50Vals),
      p95: median(p95Vals),
      rpsAvg: median(rpsVals),
      count: tail.length
    };
  }
  const out = { generatedAt: new Date().toISOString(), window: N, golden };
  const dir = path.join(process.cwd(), 'perf-history');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'golden-baseline.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
})();
