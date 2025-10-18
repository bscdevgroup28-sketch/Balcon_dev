import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret-approvals';
process.env.DATABASE_URL = 'sqlite::memory:';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { sequelize } from '../../src/config/database';

describe('Approvals public flow', () => {
  let app:any;
  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
    // Load minimal models needed for auth + approvals
    await import('../../src/models/UserEnhanced');
    await import('../../src/models/RefreshToken');
    await import('../../src/models/CustomerApprovalToken');
    await sequelize.sync({ force: true });
  });
  afterAll(async () => { try { await sequelize.close(); } catch { /* ignore */ } });

  it('issues token (authed) then reads and consumes via public endpoints', async () => {
    // Obtain CSRF token for unsafe requests
    const csrfRes = await request(app).get('/api/auth/csrf').expect(200);
    const setCookie = csrfRes.headers['set-cookie'];
    const cookieArr: string[] = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie as any] : []);
    const csrfCookie = cookieArr.find((h:any)=>typeof h === 'string' && h.includes('csrfToken=')) as string;
    const csrfToken = csrfRes.body.csrfToken as string;
    expect(csrfCookie && csrfToken).toBeTruthy();

    // Create minimal user and login to issue token
    const { AuthService } = await import('../../src/services/authService');
    const user:any = await AuthService.createUser({
      firstName: 'A', lastName: 'B', email: `pm_${Date.now()}@ex.com`, role: 'project_manager',
      isActive: true, mustChangePassword: false, canManageProjects: true, canManageUsers: false, canAccessFinancials: false, permissions: []
    } as any, 'TestPass!1');
    const login = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ email: user.email, password: 'TestPass!1' })
      .expect(200);
    const token = login.body.data.accessToken;

    // Issue approval token for project id=1 (no FK constraints in this minimal sync)
    const issue = await request(app)
      .post('/api/projects/1/approvals/token')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', `Bearer ${token}`)
      .send({ ttlDays: 1 })
      .expect(200);
    expect(issue.body.ok).toBe(true);
    const approvalToken = issue.body.token as string;

    // Public read
    const read = await request(app).get(`/api/approvals/${approvalToken}`).expect(200);
    expect(read.body.ok).toBe(true);
    expect(read.body.projectId).toBeDefined();

    // Public approve (no CSRF required due to whitelist)
    const decide = await request(app)
      .post(`/api/approvals/${approvalToken}/decision`)
      .send({ decision: 'approve' })
      .expect(200);
    expect(decide.body.ok).toBe(true);
    expect(decide.body.decision).toBe('approve');

    // Second use should fail as consumed
    const again = await request(app)
      .post(`/api/approvals/${approvalToken}/decision`)
      .send({ decision: 'approve' })
      .expect(400);
    expect(again.body.reason).toBe('consumed');
  });
});
