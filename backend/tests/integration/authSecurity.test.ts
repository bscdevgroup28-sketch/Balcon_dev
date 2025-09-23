import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models';

// Utility to create a user with known password
async function createTestUser(overrides: Partial<any> = {}) {
  const base = {
    firstName: 'Auth',
    lastName: 'Tester',
    email: `auth_tester_${Date.now()}@example.com`,
    role: 'user',
    isActive: true,
    mustChangePassword: true,
  };
  // @ts-ignore custom createWithPassword helper might exist
  const user = await (User as any).createWithPassword(base, 'TempPass123!');
  if (overrides.mustChangePassword === false) {
    (user as any).mustChangePassword = false; await user.save();
  }
  return user;
}

describe('Auth & Security Integration', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

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

    // Make consecutive bad attempts
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'WrongPass!!' });
    }

    const lockedRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPass!!' })
      .expect(429);

    expect(lockedRes.body.message).toMatch(/Too many failed attempts/i);
  });

  it('exposes metrics endpoint with counters', async () => {
    const metricsRes = await request(app)
      .get('/api/metrics')
      .expect(200);

    expect(metricsRes.body.counters).toBeDefined();
    expect(typeof metricsRes.body.counters['http.requests.total']).toBe('number');
  });
});
