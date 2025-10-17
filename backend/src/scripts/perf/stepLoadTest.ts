import autocannon from 'autocannon';
import fs from 'fs';
import path from 'path';

/*
  Step load test scaffold to explore capacity curve.
  Usage (example):
    ts-node src/scripts/perf/stepLoadTest.ts http://localhost:8082/api/projects 20 5
  Args:
    1) target URL
    2) max connections (e.g., 200)
    3) step size (e.g., 10)
  Output: JSON summary written to perf-history/step-load-<timestamp>.json
*/

interface StepResult { connections: number; rps: number; p95: number; p50: number; errors: number; timeouts: number; }

async function runStep(url: string, connections: number): Promise<StepResult> {
  return new Promise((resolve, reject) => {
    const inst = autocannon({ url, connections, duration: 10 });
    inst.on('done', (res: any) => {
      resolve({
        connections,
        rps: res.requests.average,
        p95: res.latency.p95,
        p50: res.latency.p50,
        errors: res.errors,
        timeouts: res.timeouts
      });
    });
    inst.on('error', reject);
  });
}

(async function main() {
  const url = process.argv[2];
  const maxConn = parseInt(process.argv[3] || '100', 10);
  const step = parseInt(process.argv[4] || '10', 10);
  if (!url) {
    console.error('Usage: stepLoadTest <url> <maxConnections> <stepSize>');
    process.exit(1);
  }
  const results: StepResult[] = [];
  for (let c = step; c <= maxConn; c += step) {
    // eslint-disable-next-line no-console
    console.log(`[step] Testing connections=${c}`);
    try {
      const r = await runStep(url, c);
      results.push(r);
      // eslint-disable-next-line no-console
      console.log(`[step] c=${c} rps=${r.rps} p95=${r.p95}`);
      if (r.errors > 0 || r.timeouts > 0) {
        // capture and stop early if instability appears
        break;
      }
    } catch (e:any) {
      // eslint-disable-next-line no-console
      console.error('[step] failed', e.message);
      break;
    }
  }
  const out = { generatedAt: new Date().toISOString(), url, maxConn, step, results };
  const dir = path.join(process.cwd(), 'perf-history');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `step-load-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  process.stdout.write(JSON.stringify(out, null, 2));
})();
