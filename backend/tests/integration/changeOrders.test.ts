import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret-change-orders';
process.env.DATABASE_URL = 'sqlite::memory:';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { sequelize } from '../../src/config/database';

describe('Change Orders API', () => {
  let app:any;
  let csrfCookie:string;
  let csrfToken:string;
  let authToken:string;
  let projectId:number;

  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
    await import('../../src/models/UserEnhanced');
    await import('../../src/models/RefreshToken');
    await import('../../src/models/Project');
    await import('../../src/models/ChangeOrder');
    await sequelize.sync({ force: true });

    // CSRF
    const csrfRes = await request(app).get('/api/auth/csrf').expect(200);
    const setCookie = csrfRes.headers['set-cookie'];
    const cookieArr: string[] = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie as any] : []);
    csrfCookie = cookieArr.find((h:any)=>typeof h === 'string' && h.includes('csrfToken=')) as string;
    csrfToken = csrfRes.body.csrfToken as string;

    // user + login
    const { AuthService } = await import('../../src/services/authService');
    const user:any = await AuthService.createUser({
      firstName: 'PM', lastName: 'User', email: `pm_${Date.now()}@ex.com`, role: 'project_manager',
      isActive: true, mustChangePassword: false, canManageProjects: true, canManageUsers: false, canAccessFinancials: true, permissions: []
    } as any, 'TestPass!1');
    const login = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ email: user.email, password: 'TestPass!1' })
      .expect(200);
    authToken = login.body.data.accessToken;

    // Create a project (minimal fields)
    const { Project } = await import('../../src/models/Project');
    const proj = await (Project as any).create({
      userId: null,
      inquiryNumber: 'INQ-TEST-CO',
      title: 'Test Project',
      description: 'A test project',
      projectType: 'commercial',
      status: 'inquiry',
      priority: 'medium',
      requirements: {}
    });
    projectId = proj.id;
  });

  afterAll(async () => { try { await sequelize.close(); } catch { /* ignore */ } });

  it('creates, sends, approves, and prevents invalid updates', async () => {
    // Create
    const create = await request(app)
      .post('/api/change-orders')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ projectId, title: 'Scope addition', amount: 1500 })
      .expect(201);
    const coId = create.body.data.id as number;
    expect(create.body.data.status).toBe('draft');

    // Send
    const send = await request(app)
      .post(`/api/change-orders/${coId}/send`)
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(send.body.data.status).toBe('sent');

    // Updating title after sent should fail
    await request(app)
      .put(`/api/change-orders/${coId}`)
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'New title' })
      .expect(400);

    // Approve
    const approve = await request(app)
      .post(`/api/change-orders/${coId}/approve`)
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(approve.body.data.status).toBe('approved');

    // Delete should fail for approved
    await request(app)
      .delete(`/api/change-orders/${coId}`)
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);

    // Create another draft and delete it
    const create2 = await request(app)
      .post('/api/change-orders')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ projectId, title: 'Remove scope', amount: 500 })
      .expect(201);
    const co2 = create2.body.data.id;
    await request(app)
      .delete(`/api/change-orders/${co2}`)
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
