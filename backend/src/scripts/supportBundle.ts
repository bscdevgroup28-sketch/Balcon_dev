import fs from 'fs';
import path from 'path';
import os from 'os';
import { metrics } from '../monitoring/metrics';
import { getSlowQueryPatternSummary, getRecentSlowQueries } from '../instrumentation/queryMonitor';
import '../config/database'; // ensure sequelize init & monitor

// Basic operational snapshot for on-call triage.
// Produces JSON to stdout; caller can redirect to file or compress externally.
(async function main() {
  try {
    const snapshot = metrics.snapshot();
    const envFlags: Record<string,string|undefined> = {};
    const flagKeys = [
      'NODE_ENV','DIAG_ENDPOINTS_ENABLED','ADV_METRICS_ENABLED','ENFORCE_HTTPS','ENABLE_TEST_ROUTES','METRICS_AUTH_TOKEN','CSP_EXTRA_CONNECT',
      'DB_SLOW_QUERY_THRESHOLD_MS','DB_QUERY_LOGGING'
    ];
    for (const k of flagKeys) envFlags[k] = process.env[k];

    // Migration manifest hash (if exists)
    let manifestInfo: any = null;
    const manifestPath = path.join(__dirname, '../../migration-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath,'utf8');
      try {
        const crypto = await import('crypto');
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        manifestInfo = { entries: JSON.parse(content).length, sha256: hash };
      } catch { manifestInfo = { error: 'hash_failed' }; }
    }

    // Extract anomaly state if present (internal symbol access best-effort)
    let anomalyState: any = null;
    try {
      const m = require('../monitoring/metrics');
      // Internal variables in metrics.ts are not exported; we attempt to serialize known keys
      const keys = ['auth.failures','http.errors.5xx'];
      anomalyState = {};
      for (const k of keys) {
        const s = (m as any).anomalyTargets?.[k];
        if (s) anomalyState[k] = { initialized: s.initialized, mean: s.mean, var: s.var, lastScore: s.lastScore };
      }
    } catch { anomalyState = null; }

    const data = {
      generatedAt: new Date().toISOString(),
      host: os.hostname(),
      pid: process.pid,
      envFlags,
      manifest: manifestInfo,
      metrics: snapshot,
      slowQueryPatterns: getSlowQueryPatternSummary(),
      recentSlowQueries: getRecentSlowQueries(25),
      tokenCleanup: (global as any).__tokenCleanup || null,
      anomalyState,
      circuits: (() => {
        try {
          const list = (global as any).__circuitRegistry as any[] || [];
          return list.map(c => ({ name: (c as any).opts?.name, state: (c as any).s?.state, failures: (c as any).s?.failures, openedAt: (c as any).s?.openedAt }));
        } catch { return null; }
      })(),
    };
    process.stdout.write(JSON.stringify(data,null,2));
  } catch (e:any) {
    console.error('[supportBundle] failed', e.message);
    process.exit(1);
  }
})();
