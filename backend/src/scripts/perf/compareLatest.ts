import fs from 'fs';
import path from 'path';

/*
  Compares the two most recent baseline JSON files in perf-history/ for each scenario.
  Outputs a simple delta report to stdout.
*/

interface Summary { scenario: string; p50?: number; p95?: number; rpsAvg?: number; rpsP95?: number }

function loadSummaries(): Summary[] {
  const dir = path.join(process.cwd(), 'perf-history');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  return files.map(f => {
    try { const data = JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')); data._file = f; return data; } catch { return null; }
  }).filter(Boolean) as Summary[];
}

function computeDelta(prev: Summary, curr: Summary, field: keyof Summary) {
  const a = (prev as any)[field];
  const b = (curr as any)[field];
  if (typeof a !== 'number' || typeof b !== 'number') return null;
  return { prev: a, curr: b, pct: a === 0 ? null : ((b - a)/a * 100) };
}

(function main(){
  const all = loadSummaries();
  const byScenario: Record<string, Summary[]> = {};
  for (const s of all) {
    if (!s.scenario) continue;
    byScenario[s.scenario] = byScenario[s.scenario] || [];
    byScenario[s.scenario].push(s);
  }
  const report: any[] = [];
  for (const [scenario, list] of Object.entries(byScenario)) {
    if (list.length < 2) continue;
    const sorted = list.slice(-2);
    const prev = sorted[0];
    const curr = sorted[1];
    report.push({ scenario, p50: computeDelta(prev,curr,'p50'), p95: computeDelta(prev,curr,'p95'), rpsAvg: computeDelta(prev,curr,'rpsAvg'), rpsP95: computeDelta(prev,curr,'rpsP95') });
  }
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), comparisons: report }, null, 2));
})();
