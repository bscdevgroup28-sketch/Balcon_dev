import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret-invoices';
process.env.DATABASE_URL = 'sqlite::memory:';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { sequelize } from '../../src/config/database';

describe('Invoices API', () => {
  let app:any; let csrfCookie:string; let csrfToken:string; let auth:string; let projectId:number;
  beforeAll(async () => {
    const instance = new BalConBuildersApp(); app = instance.app;
    await import('../../src/models/UserEnhanced');
    await import('../../src/models/RefreshToken');
    await import('../../src/models/Project');
    await import('../../src/models/Invoice');
    await sequelize.sync({ force: true });
    const csrfRes = await request(app).get('/api/auth/csrf').expect(200);
    const setCookie = csrfRes.headers['set-cookie'];
    const arr = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie as any] : []);
    csrfCookie = arr.find((h:any)=>typeof h === 'string' && h.includes('csrfToken=')) as string;
    csrfToken = csrfRes.body.csrfToken;
    const { AuthService } = await import('../../src/services/authService');
    const user:any = await AuthService.createUser({
      firstName: 'OM', lastName: 'One', email: `om_${Date.now()}@ex.com`, role: 'office_manager',
      isActive: true, mustChangePassword: false, canManageProjects: true, canManageUsers: false, canAccessFinancials: true, permissions: []
    } as any, 'TestPass!1');
    const login = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken)
      .send({ email: user.email, password: 'TestPass!1' }).expect(200);
    auth = `Bearer ${login.body.data.accessToken}`;
    const { Project } = await import('../../src/models/Project');
    const proj = await (Project as any).create({
      userId: null, inquiryNumber: 'INQ-INV', title: 'Invoice Proj', description: 'Inv test', projectType: 'commercial', status: 'inquiry', priority: 'medium', requirements: {}
    });
    projectId = proj.id;
  });
  afterAll(async () => { try { await sequelize.close(); } catch (e) { /* ignore close errors in tests */ } });

  it('creates, sends HTML invoice, lists AR, and marks paid', async () => {
    const create = await request(app)
      .post('/api/invoices')
      .set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken).set('Authorization', auth)
      .send({ projectId, date: new Date().toISOString(), dueDate: new Date(Date.now()-24*3600*1000).toISOString(), lineItems: [{ description:'Work', quantity:2, unitPrice:100 }], taxRate: 0.1 })
      .expect(201);
    const id = create.body.data.id;

    // Send
    const send = await request(app)
      .post(`/api/invoices/${id}/send`)
      .set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken).set('Authorization', auth)
      .expect(200);
    expect(send.body.data.status).toBe('sent');

    // AR list should include it (due date in the past)
    const ar = await request(app).get('/api/invoices/ar/list').set('Authorization', auth).expect(200);
    expect(Array.isArray(ar.body.data)).toBe(true);
    expect(ar.body.data.length).toBeGreaterThanOrEqual(1);

    // PDF (HTML) placeholder
    await request(app).get(`/api/invoices/${id}/pdf`).set('Authorization', auth).expect(200);

    // Mark paid
    const paid = await request(app)
      .post(`/api/invoices/${id}/mark-paid`)
      .set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken).set('Authorization', auth)
      .expect(200);
    expect(paid.body.data.status).toBe('paid');
  });
});
