import request from 'supertest';
import { app } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { EventLog, Project, Quote, User } from '../../src/models';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
function tokenFor(user: any) { return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' }); }

/**
 * Integration tests for quote & order lifecycle event persistence
 */

describe('Quote & Order Lifecycle Events', () => {
  let authHeader: string;
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    // Seed user and project
    const admin = await User.create({
      firstName: 'Test', lastName: 'User', email: 'tuser@example.com', password: 'hashed', role: 'admin'
    } as any);
    authHeader = `Bearer ${tokenFor(admin)}`;
    await Project.create({
      title: 'Event Project', description: 'Test', projectType: 'residential', priority: 'medium', inquiryNumber: 'INQ-0001', status: 'inquiry', userId: 1
    } as any);
  });

  afterAll(async () => { await sequelize.close(); });

  let quoteId: number;

  it('creates a quote and emits quote.created', async () => {
    const res = await request(app)
      .post('/api/quotes')
      .set('Authorization', authHeader)
      .send({
        projectId: 1,
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
      .set('Authorization', authHeader)
      .send({ notes: 'Adjustment note' })
      .expect(200);
    await new Promise(r => setTimeout(r, 50));
    const ev = await EventLog.findOne({ where: { name: 'quote.updated' } });
    expect(ev).not.toBeNull();
  });

  it('sends a quote and emits quote.sent', async () => {
  await request(app).post(`/api/quotes/${quoteId}/send`).set('Authorization', authHeader).expect(200);
    await new Promise(r => setTimeout(r, 50));
    const ev = await EventLog.findOne({ where: { name: 'quote.sent' } });
    expect(ev).not.toBeNull();
  });

  it('responds to a quote (accept) and emits quote.responded & quote.accepted', async () => {
  await request(app).post(`/api/quotes/${quoteId}/respond`).set('Authorization', authHeader).send({ response: 'accepted' }).expect(200);
    await new Promise(r => setTimeout(r, 50));
    const responded = await EventLog.findOne({ where: { name: 'quote.responded' } });
    const accepted = await EventLog.findOne({ where: { name: 'quote.accepted' } });
    expect(responded).not.toBeNull();
    expect(accepted).not.toBeNull();
  });

  it('creates an order from project context and emits order.created', async () => {
    // We need a userId (1) and the project (1)
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        projectId: 1,
        userId: 1,
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