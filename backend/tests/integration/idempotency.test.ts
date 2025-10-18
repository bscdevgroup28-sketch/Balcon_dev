import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { sequelize } from '../../src/config/database';
import { User, Project } from '../../src/models';

describe('Idempotency middleware', () => {
  let app:any; let csrfCookie:string; let csrfToken:string; let auth:string; let projectId:number;
  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
    await import('../../src/models/UserEnhanced');
    await import('../../src/models/RefreshToken');
    await sequelize.sync({ force: true });
  const u:any = await (User as any).createWithPassword({ email:'owner@idem.com', firstName:'O', lastName:'Ner', role:'owner', isActive:true, isVerified:true }, 'Password123!');
  const p = await Project.create({ userId: u.id, title: 'Test Project', description: 'For idempotency test', projectType: 'residential' } as any);
    projectId = p.id;
    const csrfRes = await request(app).get('/api/auth/csrf').expect(200);
    const setCookie = csrfRes.headers['set-cookie'];
    const cookieArr: string[] = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie as any] : []);
    csrfCookie = cookieArr.find((h:any)=>typeof h === 'string' && h.includes('csrfToken=')) as string;
    csrfToken = csrfRes.body.csrfToken as string;
    const login = await request(app).post('/api/auth/login').set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken).send({ email: u.email, password:'Password123!' }).expect(200);
    auth = `Bearer ${login.body.data.accessToken}`;
  });

  afterAll(async () => { try { await sequelize.close(); } catch { /* ignore */ } });

  it('replays same response on duplicate key with same body and returns 409 on conflict', async () => {
    const key = 'idem-' + Date.now();
    const body = { projectId, date: new Date().toISOString(), dueDate: new Date(Date.now()+86400000).toISOString(), lineItems: [{ description:'Work', quantity:1, unitPrice: 100 }], taxRate: 0.1 };
    const first = await request(app)
      .post('/api/invoices')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', auth)
      .set('Idempotency-Key', key)
      .send(body)
      .expect(201);
    const again = await request(app)
      .post('/api/invoices')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', auth)
      .set('Idempotency-Key', key)
      .send(body)
      .expect(first.status);
    expect(again.body.data.number).toBe(first.body.data.number);
    const conflict = await request(app)
      .post('/api/invoices')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', auth)
      .set('Idempotency-Key', key)
      .send({ ...body, taxRate: 0 })
      .expect(409);
    expect(conflict.body.error).toBe('IdempotencyConflict');
  });
});
