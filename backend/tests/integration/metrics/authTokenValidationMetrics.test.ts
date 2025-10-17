import request from 'supertest';
import jwt from 'jsonwebtoken';
import { balConApp } from '../../../src/appEnhanced';

// This test validates that hitting a protected route without a token increments auth.failures
// and that performing the same request with a valid token increments auth.success.
// We pick an existing protected route (e.g., /api/projects) that should require auth.
// If that path changes or is public, adjust to another clearly protected endpoint.

interface AppWithLifecycle { isStarted?: () => boolean; start: () => Promise<void>; stop?: () => Promise<void>; server: any }
const appInstance = balConApp as unknown as AppWithLifecycle;

describe('Auth Token Validation Metrics', () => {
  let agent: request.SuperTest<request.Test>;
  let jwtSecret: string;

  beforeAll(async () => {
    if (!appInstance.isStarted || !appInstance.isStarted()) {
      await appInstance.start();
    }
    agent = request(appInstance.server);
    jwtSecret = process.env.JWT_SECRET || 'testsecret';
  });

  afterAll(async () => {
    if (appInstance.stop) await appInstance.stop();
  });

  async function snapshot() {
    const res = await agent.get('/api/metrics/raw');
    if (res.status === 404) {
      const alt = await agent.get('/api/metrics');
      try { return JSON.parse(alt.text); } catch { return alt.body; }
    }
    try { return JSON.parse(res.text); } catch { return res.body; }
  }

  function counter(snap: any, name: string) {
    return snap.counters?.[name] || 0;
  }

  it('increments auth.failures for missing token and auth.success for valid token', async () => {
    const before = await snapshot();
    const beforeFailures = counter(before, 'auth.failures');
    const beforeSuccess = counter(before, 'auth.success');

  // 1) Missing token request against a protected endpoint (exports requires auth)
  const missingRes = await agent.get('/api/exports');
    expect([401, 403]).toContain(missingRes.status);

    const mid = await snapshot();
    const midFailures = counter(mid, 'auth.failures');
    expect(midFailures).toBeGreaterThanOrEqual(beforeFailures + 1);

    // 2) Valid token: craft minimal payload accepted by middleware
    const validToken = jwt.sign({ id: 9999, email: 'testuser@example.com', role: 'owner', permissions: ['system_admin'] }, jwtSecret, { expiresIn: '5m' });
    const authRes = await agent
      .get('/api/exports')
      .set('Authorization', `Bearer ${validToken}`);
    // We only require that it is NOT an authentication failure now.
    expect([200,201,202,204,400,403,404]).toContain(authRes.status);

    const after = await snapshot();
    const afterSuccess = counter(after, 'auth.success');
    // success count should increase by at least 1
    expect(afterSuccess).toBeGreaterThanOrEqual(beforeSuccess + 1);
  });
});
