import request from 'supertest';
import balConApp from '../../appEnhanced';
import { sequelize } from '../../config/database';
import { User } from '../../models';

// Helper to create JWT (depending on existing auth utility) - if there's a utility we should import it; quick inline fallback:
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

function tokenFor(user: any) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
}

describe('Policy Denials', () => {
  let customer: any; let technician: any; let officeManager: any;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    customer = await User.create({ firstName: 'Cust', lastName: 'User', email: 'cust@example.com', password: 'x', role: 'customer' } as any);
    technician = await User.create({ firstName: 'Tech', lastName: 'User', email: 'tech@example.com', password: 'x', role: 'technician' } as any);
    officeManager = await User.create({ firstName: 'Off', lastName: 'Mgr', email: 'office@example.com', password: 'x', role: 'office_manager' } as any);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('customer cannot create inventory transaction', async () => {
  const res = await request(balConApp.getApp())
      .post('/api/inventory/transactions')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ materialId: 1, direction: 'in', quantity: 5 });
  expect(res.status).toBe(403);
  });

  test('technician cannot create inventory transaction', async () => {
  const res = await request(balConApp.getApp())
      .post('/api/inventory/transactions')
      .set('Authorization', `Bearer ${tokenFor(technician)}`)
      .send({ materialId: 1, direction: 'in', quantity: 5 });
  expect(res.status).toBe(403);
  });

  test('office manager can create inventory transaction (will 404 material)', async () => {
  const res = await request(balConApp.getApp())
      .post('/api/inventory/transactions')
      .set('Authorization', `Bearer ${tokenFor(officeManager)}`)
      .send({ materialId: 1, direction: 'in', quantity: 5 });
  expect([201,404]).toContain(res.status); // 404 if material missing, 201 if created
  });
});
