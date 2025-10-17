import { balConApp } from '../../../src/appEnhanced';
import request from 'supertest';

// This test does a best-effort check: it forces a manual invocation of the cleanup logic by inserting
// a synthetic revoked token (if model available) and then waiting for scheduler run. To avoid flakiness
// we just assert the gauge keys exist in the metrics snapshot. (Full deterministic cleanup unit test
// would refactor cleanup into an exported function.)

describe('Token Cleanup Metrics Presence', () => {
  let agent: request.SuperTest<request.Test>;
  beforeAll(async () => {
    const appInst: any = balConApp;
    if (!appInst.isStarted || !appInst.isStarted()) {
      await appInst.start();
    }
    agent = request(appInst.server);
  });

  afterAll(async () => {
    const appInst: any = balConApp;
    if (appInst.stop) await appInst.stop();
  });

  async function fetchSnapshot() {
    const res = await agent.get('/api/metrics/raw');
    if (res.status === 404) {
      const alt = await agent.get('/api/metrics');
      try { return JSON.parse(alt.text); } catch { return alt.body; }
    }
    try { return JSON.parse(res.text); } catch { return res.body; }
  }

  it('exposes cleanup gauges', async () => {
    const snap = await fetchSnapshot();
    expect(snap.gauges['tokens.cleanup.removed_last_run']).toBeDefined();
    expect(snap.gauges['tokens.cleanup.last_run_epoch_ms']).toBeDefined();
  });
});
