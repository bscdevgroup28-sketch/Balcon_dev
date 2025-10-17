import fs from 'fs';
import path from 'path';

/*
  Persists a performance baseline summary JSON (read from stdin or a file) into perf-history/
  File naming convention: <timestamp>-<scenario>.json
  Usage example:
    node dist/src/scripts/perf/authBaseline.js > auth.json
    node dist/src/scripts/perf/persistBaseline.js auth.json
  Or pipe directly (provide scenario override):
    node dist/src/scripts/perf/authBaseline.js | node dist/src/scripts/perf/persistBaseline.js --scenario auth.login
*/

interface Summary { scenario?: string; p50?: number; p95?: number; rpsAvg?: number; rpsP95?: number; duration?: number; connections?: number }

function readJsonInput(fileArg?: string): Summary {
  if (fileArg && fs.existsSync(fileArg)) {
    return JSON.parse(fs.readFileSync(fileArg,'utf8'));
  }
  const data = fs.readFileSync(0,'utf8'); // stdin
  return JSON.parse(data);
}

(function main(){
  const args = process.argv.slice(2);
  let file: string | undefined;
  let scenarioOverride: string | undefined;
  for (let i=0;i<args.length;i++) {
    if (!args[i]) continue;
    if (args[i] === '--scenario') { scenarioOverride = args[++i]; continue; }
    file = args[i];
  }
  let summary: Summary;
  try { summary = readJsonInput(file); } catch (e:any) { console.error('[perf] failed to parse input', e.message); process.exit(1); }
  if (scenarioOverride) summary.scenario = scenarioOverride;
  if (!summary.scenario) summary.scenario = 'unknown';
  const dir = path.join(process.cwd(), 'perf-history');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g,'-');
  const fname = `${ts}-${summary.scenario}.json`;
  const outPath = path.join(dir, fname);
  fs.writeFileSync(outPath, JSON.stringify(summary,null,2));
  console.log('[perf] baseline persisted', { file: outPath });
})();
