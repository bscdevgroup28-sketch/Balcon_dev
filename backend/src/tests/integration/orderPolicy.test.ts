import request from 'supertest';
import balConApp from '../../appEnhanced';
import { sequelize } from '../../config/database';
import { User, Project } from '../../models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
function tokenFor(user: any) { return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' }); }

// This test focuses on policy allow/deny for /api/orders (create)
// It does not fully validate business logic; just authorization layering.

describe('Order Policy Authorization', () => {
  let officeManager: any; let customer: any; let project: any;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    officeManager = await User.create({ firstName:'Office', lastName:'Mgr', email:'off@example.com', password:'x', role:'office_manager' } as any);
    customer = await User.create({ firstName:'Cust', lastName:'User', email:'cust2@example.com', password:'x', role:'customer' } as any);
    project = await Project.create({
      userId: officeManager.id,
      inquiryNumber: 'INQ-TEST-001',
      title: 'Test Project',
      description: 'Test project description that is sufficiently long',
      projectType: 'commercial',
      status: 'inquiry',
      priority: 'medium',
      requirements: {}
    } as any);
  });

  afterAll(async () => { await sequelize.close(); });

  test('customer denied creating order', async () => {
    const res = await request(balConApp.getApp())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({
        projectId: project.id,
        userId: customer.id,
        items: [{ description:'Item', quantity:1, unitPrice:10 }]
      });
    expect(res.status).toBe(403);
  });

  test('office manager allowed (expect 201 or 404 if project mismatch)', async () => {
    const res = await request(balConApp.getApp())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenFor(officeManager)}`)
      .send({
        projectId: project.id,
        userId: customer.id,
        items: [{ description:'Item', quantity:2, unitPrice:15 }]
      });
    expect([201,404]).toContain(res.status);
  });
});
