import fs from 'fs';
import path from 'path';

/*
  regressionGuard.ts
  Fails (non-zero exit) if the latest baseline shows unacceptable performance regression vs previous.

  Rules (default thresholds; override via env):
    - Latency p95 increase > MAX_P95_INCREASE_PCT (default 20%)
    - Latency p50 increase > MAX_P50_INCREASE_PCT (default 15%)
    - Throughput (rpsAvg) drop > MAX_RPS_DROP_PCT (default 15%)

  Only evaluates scenarios with at least 2 baseline files in perf-history/.
  Prints JSON summary of evaluations and exits 1 if any violation occurs.

  Usage (after generating new baseline):
    node dist/src/scripts/perf/compareLatest.js   # optional human diff
    node dist/src/scripts/perf/regressionGuard.js # enforce thresholds
*/

interface Summary { scenario: string; p50?: number; p95?: number; rpsAvg?: number; rpsP95?: number; _file?: string }

function loadScenarioHistory(): Record<string, Summary[]> {
  const dir = path.join(process.cwd(), 'perf-history');
  const map: Record<string, Summary[]> = {};
  if (!fs.existsSync(dir)) return map;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')) as Summary;
      if (!data.scenario) continue;
      data._file = f;
      map[data.scenario] = map[data.scenario] || [];
      map[data.scenario].push(data);
    } catch {/* ignore parse errors */}
  }
  return map;
}

function pctChange(prev: number|undefined, curr: number|undefined) {
  if (typeof prev !== 'number' || typeof curr !== 'number' || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

const MAX_P95_INCREASE_PCT = parseFloat(process.env.MAX_P95_INCREASE_PCT || '20');
const MAX_P50_INCREASE_PCT = parseFloat(process.env.MAX_P50_INCREASE_PCT || '15');
const MAX_RPS_DROP_PCT = parseFloat(process.env.MAX_RPS_DROP_PCT || '15'); // positive percent drop allowed
const USE_GOLDEN = (process.env.USE_GOLDEN || '').toLowerCase() === 'true' || process.env.USE_GOLDEN === '1';

interface GoldenEntry { p50?: number; p95?: number; rpsAvg?: number }
function loadGolden(): Record<string, GoldenEntry> | null {
  if (!USE_GOLDEN) return null;
  try {
    const file = path.join(process.cwd(), 'perf-history', 'golden-baseline.json');
    if (!fs.existsSync(file)) return null;
    const parsed = JSON.parse(fs.readFileSync(file,'utf8'));
    return parsed.golden || null;
  } catch { return null; }
}

interface EvaluationResult {
  scenario: string;
  prevFile: string; currFile: string;
  p50DeltaPct: number|null;
  p95DeltaPct: number|null;
  rpsAvgDeltaPct: number|null;
  violations: string[];
}

function evaluate(): { evaluations: EvaluationResult[]; failed: boolean } {
  const hist = loadScenarioHistory();
  const golden = loadGolden();
  const evaluations: EvaluationResult[] = [];
  let failed = false;
  for (const [scenario, list] of Object.entries(hist)) {
    if (list.length < 2) continue;
    const prev = list[list.length - 2];
    const curr = list[list.length - 1];
    // Base comparison vs immediate previous
    let p50Delta = pctChange(prev.p50, curr.p50);
    let p95Delta = pctChange(prev.p95, curr.p95);
    let rpsAvgDelta = pctChange(prev.rpsAvg, curr.rpsAvg); // positive means increase; negative drop

    // If golden mode and golden exists for scenario, compute deltas vs golden median too and take the "worst" (most violating)
    if (golden && golden[scenario]) {
      const g = golden[scenario];
      const gP50 = pctChange(g.p50, curr.p50);
      const gP95 = pctChange(g.p95, curr.p95);
      const gRps = pctChange(g.rpsAvg, curr.rpsAvg);
      // For latency increases choose the larger % increase; for rps choose the more negative drop
      if (gP50 !== null && p50Delta !== null) p50Delta = Math.max(p50Delta, gP50);
      else if (gP50 !== null) p50Delta = gP50;
      if (gP95 !== null && p95Delta !== null) p95Delta = Math.max(p95Delta, gP95);
      else if (gP95 !== null) p95Delta = gP95;
      if (gRps !== null && rpsAvgDelta !== null) rpsAvgDelta = Math.min(rpsAvgDelta, gRps); // pick worse (more negative)
      else if (gRps !== null) rpsAvgDelta = gRps;
    }
    const violations: string[] = [];
    if (p50Delta !== null && p50Delta > MAX_P50_INCREASE_PCT) violations.push(`p50 increased ${p50Delta.toFixed(2)}% > ${MAX_P50_INCREASE_PCT}%`);
    if (p95Delta !== null && p95Delta > MAX_P95_INCREASE_PCT) violations.push(`p95 increased ${p95Delta.toFixed(2)}% > ${MAX_P95_INCREASE_PCT}%`);
    if (rpsAvgDelta !== null && rpsAvgDelta < 0 && Math.abs(rpsAvgDelta) > MAX_RPS_DROP_PCT) violations.push(`rpsAvg dropped ${Math.abs(rpsAvgDelta).toFixed(2)}% > ${MAX_RPS_DROP_PCT}%`);
    if (violations.length) failed = true;
    evaluations.push({ scenario, prevFile: prev._file || '', currFile: curr._file || '', p50DeltaPct: p50Delta, p95DeltaPct: p95Delta, rpsAvgDeltaPct: rpsAvgDelta, violations });
  }
  return { evaluations, failed };
}

(function main(){
  const { evaluations, failed } = evaluate();
  const output = { generatedAt: new Date().toISOString(), thresholds: { MAX_P95_INCREASE_PCT, MAX_P50_INCREASE_PCT, MAX_RPS_DROP_PCT, USE_GOLDEN }, evaluations };
  console.log(JSON.stringify(output, null, 2));
  // Optional markdown summary for CI job summary
  if (process.env.PERF_MD || process.env.GITHUB_STEP_SUMMARY) {
    let md = `# Performance Regression Guard\n\nThresholds: p50 +${MAX_P50_INCREASE_PCT}% | p95 +${MAX_P95_INCREASE_PCT}% | rps drop ${MAX_RPS_DROP_PCT}% (golden=${USE_GOLDEN})\n\n`;
    md += `| Scenario | p50 Δ% | p95 Δ% | rpsAvg Δ% | Violations |\n|---------|--------|--------|----------|------------|\n`;
    for (const e of evaluations) {
      md += `| ${e.scenario} | ${e.p50DeltaPct?.toFixed(2) ?? '-'} | ${e.p95DeltaPct?.toFixed(2) ?? '-'} | ${e.rpsAvgDeltaPct?.toFixed(2) ?? '-'} | ${e.violations.join('<br/>') || 'OK'} |\n`;
    }
    try {
      const summaryPath = process.env.GITHUB_STEP_SUMMARY || path.join(process.cwd(),'perf-history','regression-summary.md');
      if (!process.env.GITHUB_STEP_SUMMARY) {
        const dir = path.join(process.cwd(),'perf-history'); if (!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
      }
      fs.appendFileSync(summaryPath, md + '\n');
    } catch { /* ignore */ }
  }
  if (failed) {
    console.error('[perf] regression guard FAILED');
    process.exit(1);
  }
})();
