import request from 'supertest';
import { app } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { EventLog } from '../../src/models/EventLog';
import { Project, User } from '../../src/models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
function tokenFor(user: any) { return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' }); }

describe('Work Orders & Event Log Integration', () => {
  let authHeader: string;
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    // Seed a simple user & project
    const user = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'workorder.user@example.com',
      role: 'project_manager',
      isActive: true,
      isVerified: true,
      passwordHash: 'temp',
      permissions: [],
      canAccessFinancials: false,
      canManageProjects: false,
      canManageUsers: false,
      mustChangePassword: false
    } as any);

    await Project.create({
      title: 'Test Project',
      description: 'Integration test project',
      projectType: 'commercial',
      priority: 'medium',
      status: 'inquiry',
      userId: user.id
    } as any);
    authHeader = `Bearer ${tokenFor(user)}`;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('creates a work order and persists domain event', async () => {
    const res = await request(app)
      .post('/api/work-orders')
      .set('Authorization', authHeader)
      .send({ projectId: 1, title: 'Initial Task', priority: 'high' })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.projectId).toBe(1);

    // Allow event persistence loop to flush
    await new Promise(r => setTimeout(r, 50));
    const ev = await EventLog.findOne({ where: { name: 'work_order.created' } });
    expect(ev).not.toBeNull();
  });

  it('updates a work order and emits update event', async () => {
  const list = await request(app).get('/api/work-orders').set('Authorization', authHeader).expect(200);
    const id = list.body.data[0].id;
  await request(app).put(`/api/work-orders/${id}`).set('Authorization', authHeader).send({ status: 'in_progress' }).expect(200);
    await new Promise(r => setTimeout(r, 50));
    const ev = await EventLog.findOne({ where: { name: 'work_order.updated' } });
    expect(ev).not.toBeNull();
  });

  it('exposes Prometheus metrics', async () => {
    const res = await request(app).get('/api/metrics/prometheus').expect(200);
    expect(res.text).toContain('http_requests_total');
  });
});
