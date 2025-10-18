import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret-csrf';
process.env.DATABASE_URL = 'sqlite::memory:';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { sequelize } from '../../src/config/database';

describe('CSRF enforcement for unsafe methods', () => {
  let app:any;
  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
    await sequelize.sync({ force: true });
  });
  afterAll(async () => { try { await sequelize.close(); } catch { /* ignore */ } });

  it('rejects POST without CSRF and accepts with matching header+cookie', async () => {
    // Choose a known unsafe route that requires auth: use /api/users (create) or /api/materials
    // We'll hit /api/users with missing auth to focus purely on CSRF? Auth would 401 first. Instead, add trivial echo route for test.
    // Since we cannot modify app routes here, we test CSRF token issuance and header expectations on a public OPTIONS request is skipped.
    // Use /api/analytics/cache/invalidate may require auth as well; fallback: simulate by calling approvals decision (whitelisted) to ensure not blocked, then a protected one to observe 403 when authenticated.

    // Obtain CSRF token
    const csrfRes = await request(app).get('/api/auth/csrf').expect(200);
  const setCookie = csrfRes.headers['set-cookie'];
  const cookieArr: string[] = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie as any] : []);
  const csrfCookie = cookieArr.find((h:any)=>typeof h === 'string' && h.includes('csrfToken=')) as string;
    expect(csrfCookie).toBeTruthy();
    const token = csrfRes.body.csrfToken as string;

    // Try a mutating route that is not whitelisted and doesn't require auth in this minimal setup: use exports enqueue if enabled, else materials create will 401.
    // We'll use /api/webhooks/test to POST if exists; otherwise assert that server returns 403 before 401 when we include cookie but omit header.

    // Missing header should be 403
    const fail = await request(app)
      .post('/api/files') // likely requires auth, expect 403 due to CSRF before auth
      .set('Cookie', csrfCookie)
      .send({})
      .expect(403);
    expect(fail.body.error || fail.body.message || fail.body.reason).toBeDefined();

    // With matching header should proceed to next middleware (likely 401 unauthorized)
    const pass = await request(app)
      .post('/api/files')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', token)
      .send({})
      .expect((res)=>{
        // Accept 401/415/404 depending on route shape, but not 403
        if (res.status === 403) throw new Error('Expected CSRF to pass when header matches cookie');
      });
    expect([401,404,415,400,429].includes(pass.status)).toBe(true);
  });
});
