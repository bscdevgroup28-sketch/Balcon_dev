import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
// Set env BEFORE imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret-workorders';
process.env.DATABASE_URL = 'sqlite::memory:';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { AuthService } from '../../src/services/authService';

describe('Work Orders & Event Log Integration', () => {
  let app: any;
  let sequelize: any;
  let EventLog: any;
  let Project: any;
  let authHeader: string;
  let projectId: number;
  let csrfToken: string;
  let csrfCookie: string;

  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
    
    // Import models after app initialization
    const { sequelize: seq } = await import('../../src/config/database');
    const models = await import('../../src/models');
    EventLog = models.EventLog;
    Project = models.Project;
    sequelize = seq;
    
    await sequelize.sync({ force: true });
    
    // Get CSRF token
    const csrfRes = await request(app).get('/api/auth/csrf');
    const setCookie = csrfRes.headers['set-cookie'];
    const arr = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie as any] : []);
    csrfCookie = arr.find((h: any) => typeof h === 'string' && h.includes('csrfToken=')) as string;
    csrfToken = csrfRes.body.csrfToken;
    
    // Create user via AuthService
    const user = await AuthService.createUser({
      firstName: 'Test',
      lastName: 'User',
      email: `workorder_${Date.now()}@example.com`,
      role: 'project_manager',
      isActive: true,
      mustChangePassword: false,
      permissions: []
    } as any, 'TestPass123!');
    
    if (!user) {
      throw new Error('Failed to create user');
    }
    
    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ email: user.email, password: 'TestPass123!' });
    
    authHeader = `Bearer ${loginRes.body.data.accessToken}`;
    
    // Create project
    const proj = await Project.create({
      userId: user.id,
      inquiryNumber: 'INQ-WO001',
      title: 'Test Project',
      description: 'Integration test project',
      projectType: 'commercial',
      priority: 'medium',
      status: 'inquiry',
      requirements: {}
    } as any);
    projectId = proj.id;
  });

  afterAll(async () => {
    try {
      await sequelize.close();
    } catch (e) {
      // Ignore close errors
    }
  });

  it('creates a work order and persists domain event', async () => {
    const res = await request(app)
      .post('/api/work-orders')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', authHeader)
      .send({ projectId, title: 'Initial Task', priority: 'high' })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.projectId).toBe(projectId);

    // Allow event persistence loop to flush
    await new Promise(r => setTimeout(r, 50));
    const ev = await EventLog.findOne({ where: { name: 'work_order.created' } });
    expect(ev).not.toBeNull();
  });

  it('updates a work order and emits update event', async () => {
    const list = await request(app)
      .get('/api/work-orders')
      .set('Authorization', authHeader)
      .expect(200);
    const id = list.body.data[0].id;
    await request(app)
      .put(`/api/work-orders/${id}`)
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', authHeader)
      .send({ status: 'in_progress' })
      .expect(200);
    await new Promise(r => setTimeout(r, 50));
    const ev = await EventLog.findOne({ where: { name: 'work_order.updated' } });
    expect(ev).not.toBeNull();
  });

  it('exposes Prometheus metrics', async () => {
    const res = await request(app).get('/api/metrics/prometheus').expect(200);
    expect(res.text).toContain('http_requests_total');
  });
});
