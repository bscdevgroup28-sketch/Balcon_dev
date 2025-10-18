import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret-slack';
process.env.DATABASE_URL = 'sqlite::memory:';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { sequelize } from '../../src/config/database';

describe('Slack integration test endpoint', () => {
  let app:any; let csrfCookie:string; let csrfToken:string; let auth:string;
  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
    await import('../../src/models/UserEnhanced');
    await import('../../src/models/RefreshToken');
    await sequelize.sync({ force: true });
    const csrfRes = await request(app).get('/api/auth/csrf').expect(200);
    const setCookie = csrfRes.headers['set-cookie'];
    const cookieArr: string[] = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie as any] : []);
    csrfCookie = cookieArr.find((h:any)=>typeof h === 'string' && h.includes('csrfToken=')) as string;
    csrfToken = csrfRes.body.csrfToken as string;
    const { AuthService } = await import('../../src/services/authService');
    const user:any = await AuthService.createUser({ firstName:'Office', lastName:'Mgr', email:`office_${Date.now()}@ex.com`, role:'office_manager', isActive:true, mustChangePassword:false, permissions: [] } as any, 'TestPass!1');
    const login = await request(app).post('/api/auth/login').set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken).send({ email: user.email, password:'TestPass!1' }).expect(200);
    auth = `Bearer ${login.body.data.accessToken}`;
  });
  afterAll(async () => { try { await sequelize.close(); } catch { /* ignore */ } });

  it('returns config_missing when SLACK_WEBHOOK_URL not set', async () => {
    const r = await request(app)
      .post('/api/integrations/slack/test')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', auth)
      .send({ text: 'hello' })
      .expect(400);
    expect(r.body.error).toBe('config_missing');
  });
});
