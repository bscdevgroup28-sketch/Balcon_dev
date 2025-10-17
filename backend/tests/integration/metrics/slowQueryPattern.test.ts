import request from 'supertest';
import { balConApp } from '../../../src/appEnhanced';
import { sequelize } from '../../../src/config/database';

// This test simulates a slow query to ensure db.slow_query.total counter increments.
// On Postgres we can use pg_sleep; on SQLite we skip if unsupported.

describe('Slow Query Pattern Metrics', () => {
  let agent: request.SuperTest<request.Test>;
  beforeAll(async () => {
    // Use the Express app directly; avoid starting a new listening server to prevent port conflicts
    const appInst: any = balConApp;
    agent = request(appInst.getApp ? appInst.getApp() : appInst.app || appInst.server);
  });

  afterAll(async () => {
    // No-op: do not stop the shared global app to avoid impacting other parallel tests
  });

  function getCounter(snapshot: any, name: string) {
    return snapshot.counters?.[name] || 0;
  }

  async function fetchSnapshot() {
    const res = await agent.get('/api/metrics/raw');
    if (res.status === 404) {
      const alt = await agent.get('/api/metrics');
      try { return JSON.parse(alt.text); } catch { return alt.body; }
    }
    try { return JSON.parse(res.text); } catch { return res.body; }
  }

  it('records a slow query occurrence', async () => {
    const dialect = (sequelize.getDialect && sequelize.getDialect()) || '';
    if (dialect !== 'postgres') {
      return; // Skip for non-Postgres since pg_sleep is unavailable
    }
    const before = await fetchSnapshot();
    const beforeTotal = getCounter(before, 'db.slow_query.total');
    // Force slow query
    await sequelize.query('SELECT pg_sleep(0.6)');
    const after = await fetchSnapshot();
    const afterTotal = getCounter(after, 'db.slow_query.total');
    expect(afterTotal).toBeGreaterThanOrEqual(beforeTotal + 1);
  });
});
