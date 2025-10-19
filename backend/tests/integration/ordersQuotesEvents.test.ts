import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
// Set env BEFORE imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret-events';
process.env.DATABASE_URL = 'sqlite::memory:';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { AuthService } from '../../src/services/authService';

/**
 * Integration tests for quote & order lifecycle event persistence
 */

describe('Quote & Order Lifecycle Events', () => {
  let app: any;
  let sequelize: any;
  let EventLog: any;
  let Project: any;
  let authHeader: string;
  let userId: number;
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
    const admin = await AuthService.createUser({
      firstName: 'Test',
      lastName: 'User',
      email: `events_${Date.now()}@example.com`,
      role: 'admin',
      isActive: true,
      mustChangePassword: false,
      permissions: []
    } as any, 'TestPass123!');
    
    if (!admin) {
      throw new Error('Failed to create admin user');
    }
    
    userId = admin.id;
    
    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .send({ email: admin.email, password: 'TestPass123!' });
    
    authHeader = `Bearer ${loginRes.body.data.accessToken}`;
    
    // Create project
    const proj = await Project.create({
      userId: admin.id,
      inquiryNumber: 'INQ-EVT001',
      title: 'Event Project',
      description: 'Test project for events',
      projectType: 'residential',
      status: 'inquiry',
      priority: 'medium',
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

  let quoteId: number;

  it('creates a quote and emits quote.created', async () => {
    const res = await request(app)
      .post('/api/quotes')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', authHeader)
      .send({
        projectId,
        items: [ { description: 'Line', quantity: 2, unitPrice: 100 } ],
        validUntil: new Date(Date.now() + 86400000).toISOString()
      })
      .expect(201);
    quoteId = res.body.data.id;
    await new Promise(r => setTimeout(r, 50));
    const ev = await EventLog.findOne({ where: { name: 'quote.created' } });
    expect(ev).not.toBeNull();
  });

  it('updates a quote and emits quote.updated', async () => {
    await request(app)
      .put(`/api/quotes/${quoteId}`)
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', authHeader)
      .send({ notes: 'Adjustment note' })
      .expect(200);
    await new Promise(r => setTimeout(r, 50));
    const ev = await EventLog.findOne({ where: { name: 'quote.updated' } });
    expect(ev).not.toBeNull();
  });

  it('sends a quote and emits quote.sent', async () => {
    await request(app)
      .post(`/api/quotes/${quoteId}/send`)
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', authHeader)
      .expect(200);
    await new Promise(r => setTimeout(r, 50));
    const ev = await EventLog.findOne({ where: { name: 'quote.sent' } });
    expect(ev).not.toBeNull();
  });

  it('responds to a quote (accept) and emits quote.responded & quote.accepted', async () => {
    await request(app)
      .post(`/api/quotes/${quoteId}/respond`)
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', authHeader)
      .send({ response: 'accepted' })
      .expect(200);
    await new Promise(r => setTimeout(r, 50));
    const responded = await EventLog.findOne({ where: { name: 'quote.responded' } });
    const accepted = await EventLog.findOne({ where: { name: 'quote.accepted' } });
    expect(responded).not.toBeNull();
    expect(accepted).not.toBeNull();
  });

  it('creates an order from project context and emits order.created', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', authHeader)
      .send({
        projectId,
        userId,
        items: [ { description: 'Build', quantity: 1, unitPrice: 500 } ],
        priority: 'medium'
      })
      .expect(201);
    expect(res.body.data).toBeDefined();
    await new Promise(r => setTimeout(r, 50));
    const ev = await EventLog.findOne({ where: { name: 'order.created' } });
    expect(ev).not.toBeNull();
  });
});