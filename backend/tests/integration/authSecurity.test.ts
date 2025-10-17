import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
// Set env BEFORE imports that rely on it
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';
process.env.DATABASE_URL = 'sqlite::memory:';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { AuthService } from '../../src/services/authService';
// We'll import sequelize dynamically after env is set
let sequelize: any; let app: any;

// Utility to create a user with known password
async function createTestUser(overrides: Partial<any> = {}) {
  const base = {
    firstName: 'Auth',
    lastName: 'Tester',
    email: `auth_tester_${Date.now()}@example.com`,
    role: 'project_manager',
    isActive: true,
    mustChangePassword: true,
    canAccessFinancials: true,
    canManageProjects: true,
    canManageUsers: true,
    permissions: [],
  } as any;
  let user: any;
  try {
    user = await AuthService.createUser(base, 'TempPass123!');
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('[TEST DEBUG] createUser failed', e?.message, e?.errors?.map((x: any)=>x.message));
    throw e;
  }
  if (!user) throw new Error('User creation returned null');
  if (overrides.mustChangePassword === false) {
    (user as any).mustChangePassword = false; await user.save();
  }
  return user;
}

describe('Auth & Security Integration', () => {
  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
    ({ sequelize } = await import('../../src/config/database'));
    // For this test we only need users + refresh tokens tables. Full migration suite was hanging;
    // to keep test deterministic and fast we directly load minimal models and sync an in-memory schema.
    await import('../../src/models/UserEnhanced');
    await import('../../src/models/RefreshToken');
    await sequelize.sync({ force: true });
  });

  afterAll(async () => { try { await sequelize.close(); } catch { /* ignore */ } });

  it('enforces mustChangePassword flag and clears after password set', async () => {
    const user = await createTestUser();

    // Login with temp password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'TempPass123!' })
      .expect(200);

    expect(loginRes.body.data.user.mustChangePassword).toBe(true);

    // Change password without providing current (first login flow)
    await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`)
      .send({ newPassword: 'NewStrongPass!1' })
      .expect(200);

    // Re-login with new password
    const relogin = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'NewStrongPass!1' })
      .expect(200);

    expect(relogin.body.data.user.mustChangePassword).toBe(false);
  });

  it('locks after repeated invalid attempts (brute force protector)', async () => {
    const user = await createTestUser({ mustChangePassword: false });
    // Ensure small thresholds for test (set env before requiring route logic would be ideal; here we just over-attempt)
    // Make consecutive bad attempts just over policy (we don't rely on exact count env due to in-memory config at load time)
  let lockedRes: any;
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'WrongPass!!' });
      if (res.status === 429) { lockedRes = res; break; }
    }
    expect(lockedRes && lockedRes.status).toBe(429);
    if (lockedRes?.body?.message) {
      expect(typeof lockedRes.body.message).toBe('string');
    }
  });

  it('exposes metrics endpoint with counters', async () => {
    const metricsRes = await request(app)
      .get('/api/metrics')
      .expect(200);

    expect(metricsRes.body.counters).toBeDefined();
    expect(typeof metricsRes.body.counters['http.requests.total']).toBe('number');
  });
});
