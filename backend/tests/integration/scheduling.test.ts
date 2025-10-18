import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret-schedule';
process.env.DATABASE_URL = 'sqlite::memory:';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { sequelize } from '../../src/config/database';

describe('Scheduling (Work Orders board)', () => {
  let app:any; let csrfCookie:string; let csrfToken:string; let auth:string; let projectId:number; let workOrderId:number;
  beforeAll(async () => {
    const instance = new BalConBuildersApp(); app = instance.app;
    await import('../../src/models/UserEnhanced');
    await import('../../src/models/RefreshToken');
    await import('../../src/models/Project');
    await import('../../src/models/WorkOrder');
    await sequelize.sync({ force: true });
    const csrfRes = await request(app).get('/api/auth/csrf');
    const setCookie = csrfRes.headers['set-cookie'];
    const arr = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie as any] : []);
    csrfCookie = arr.find((h:any)=>typeof h === 'string' && h.includes('csrfToken=')) as string;
    csrfToken = csrfRes.body.csrfToken;
    const { AuthService } = await import('../../src/services/authService');
    const user:any = await AuthService.createUser({ firstName:'PM', lastName:'Sched', email:`pm_sched_${Date.now()}@ex.com`, role:'project_manager', isActive:true, mustChangePassword:false, permissions:[] } as any, 'TestPass!1');
    const login = await request(app).post('/api/auth/login').set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken).send({ email: user.email, password:'TestPass!1' });
    auth = `Bearer ${login.body.data.accessToken}`;
    const { Project } = await import('../../src/models/Project');
    const proj = await (Project as any).create({ userId:null, inquiryNumber:'INQ-SCHED', title:'Sched Proj', description:'Sched desc', projectType:'commercial', status:'in_progress', priority:'medium', requirements:{} });
    projectId = proj.id;
    const createWO = await request(app).post('/api/work-orders').set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken).set('Authorization', auth).send({ projectId, title:'WO A', estimatedHours:4, dueDate:new Date().toISOString(), priority:'high' });
    workOrderId = createWO.body.data.id;
  });
  afterAll(async () => { try { await sequelize.close(); } catch (e) { /* ignore close errors in tests */ } });

  it('lists schedule and moves a work order across dates/teams', async () => {
    const start = new Date(Date.now() - 2*24*3600*1000).toISOString().slice(0,10);
    const end = new Date(Date.now() + 5*24*3600*1000).toISOString().slice(0,10);
    const list = await request(app).get(`/api/work-orders/schedule?start=${start}&end=${end}`).set('Authorization', auth).expect(200);
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data.length).toBeGreaterThanOrEqual(1);
    const move = await request(app).post(`/api/work-orders/${workOrderId}/move`).set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken).set('Authorization', auth).send({ startDate: new Date().toISOString(), dueDate: new Date(Date.now()+2*24*3600*1000).toISOString(), team:'A', status:'assigned' }).expect(200);
    expect(move.body.data.team).toBe('A');
    expect(move.body.data.status).toBe('assigned');
  });
});
