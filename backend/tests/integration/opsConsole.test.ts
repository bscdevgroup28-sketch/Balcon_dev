import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models';

describe('Ops Console Endpoints', () => {
  let app:any; let csrfCookie:string; let csrfToken:string; let auth:string;
  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
    await import('../../src/models/UserEnhanced');
    await import('../../src/models/RefreshToken');
    await sequelize.sync({ force: true });
    const u:any = await (User as any).createWithPassword({ email:'admin@ops.com', firstName:'A', lastName:'Dmin', role:'admin', isActive:true, isVerified:true }, 'Password123!');
    const csrfRes = await request(app).get('/api/auth/csrf').expect(200);
    const setCookie = csrfRes.headers['set-cookie'];
    const cookieArr: string[] = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie as any] : []);
    csrfCookie = cookieArr.find((h:any)=>typeof h === 'string' && h.includes('csrfToken=')) as string;
    csrfToken = csrfRes.body.csrfToken as string;
    const login = await request(app).post('/api/auth/login').set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken).send({ email: u.email, password:'Password123!' }).expect(200);
    auth = `Bearer ${login.body.data.accessToken}`;
  });
  afterAll(async () => { try { await sequelize.close(); } catch { /* ignore */ } });

  it('returns summary and job status; supports pause/resume', async () => {
    const sum = await request(app).get('/api/ops/summary').set('Authorization', auth).expect(200);
    expect(sum.body.success).toBe(true);
    const status1 = await request(app).get('/api/ops/jobs/status').set('Authorization', auth).expect(200);
    expect(status1.body.success).toBe(true);
    await request(app).post('/api/ops/jobs/pause').set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken).set('Authorization', auth).send({}).expect(200);
    const status2 = await request(app).get('/api/ops/jobs/status').set('Authorization', auth).expect(200);
    expect(status2.body.paused).toBe(true);
    await request(app).post('/api/ops/jobs/resume').set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken).set('Authorization', auth).send({}).expect(200);
    const status3 = await request(app).get('/api/ops/jobs/status').set('Authorization', auth).expect(200);
    expect(status3.body.paused).toBe(false);
  });
});
