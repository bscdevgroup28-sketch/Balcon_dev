import request from 'supertest';
import { balConApp } from '../../../src/appEnhanced';

// Type helper (augment) so TypeScript knows about isStarted in test context
interface AppWithIsStarted { isStarted?: () => boolean; start: () => Promise<void>; stop?: () => Promise<void>; server: any }
const appInstance = balConApp as unknown as AppWithIsStarted;

// We assume ENABLE_TEST_ROUTES can expose a failing route if set; otherwise we'll simulate by hitting an unknown path.
// This test focuses on verifying http.errors.* counters increase after error responses via the metrics snapshot endpoint.

describe('HTTP Error Metrics', () => {
  let agent: request.SuperTest<request.Test>;
  beforeAll(async () => {
    if (!appInstance.isStarted || !appInstance.isStarted()) {
      await appInstance.start();
    }
    agent = request(appInstance.server);
  });

  afterAll(async () => {
    if (appInstance.stop) {
      await appInstance.stop();
    }
  });

  function parseMetrics(body: any) {
    return typeof body === 'string' ? JSON.parse(body) : body;
  }

  async function fetchSnapshot() {
    const res = await agent.get('/api/metrics/raw'); // reuse existing raw snapshot style if present; fallback to /api/metrics
    if (res.status === 404) {
      const res2 = await agent.get('/api/metrics');
      return parseMetrics(res2.text || res2.body);
    }
    return parseMetrics(res.text || res.body);
  }

  it('increments http.errors.total and 5xx counters when a server error occurs', async () => {
    const before = await fetchSnapshot();
    const beforeTotal = before.counters?.['http.errors.total'] || 0;
    const before5xx = before.counters?.['http.errors.5xx'] || 0;

    // Trigger a 500 by calling a route that throws if test route enabled; else we simulate using a crafted invalid method.
    // We'll attempt a path we know does not exist to at least guarantee a 404 (which should raise http.errors.total but not 5xx)
    await agent.get('/api/this-route-should-not-exist-xyz');

    const mid = await fetchSnapshot();
    const midTotal = mid.counters?.['http.errors.total'] || 0;

    expect(midTotal).toBeGreaterThanOrEqual(beforeTotal + 1);

    // If we can trigger a 500 test route: attempt /api/test/error if test routes enabled
    const maybe500 = await agent.get('/api/test/error');
    if (maybe500.status >= 500) {
      const after = await fetchSnapshot();
      const after5xx = after.counters?.['http.errors.5xx'] || 0;
      expect(after5xx).toBeGreaterThanOrEqual(before5xx + 1);
    }
  });
});
