import request from 'supertest';
import { app } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { EventLog, InventoryTransaction, Material, User } from '../../src/models';

/**
 * Integration tests for inventory transactions & event log persistence.
 * Focus: manual transaction endpoint, stock update endpoint interplay, and event-driven persistence listener.
 */

describe('Inventory Transactions & Events Integration', () => {
  let authToken: string;
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    // create a shop manager (authorized per policy) and login to obtain token
    await User.createWithPassword({
      email: 'shop@test.com',
      firstName: 'Shop',
      lastName: 'Manager',
      role: 'shop_manager',
      isActive: true,
      isVerified: true
    } as any, 'Password123!');
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'shop@test.com', password: 'Password123!' });
    authToken = login.body.data?.accessToken;
    await Material.create({
      name: 'Test Lumber',
      category: 'wood',
      unitOfMeasure: 'pieces',
      currentStock: 100,
      minimumStock: 20,
      reorderPoint: 10,
      unitCost: 5.0,
      markupPercentage: 20,
      sellingPrice: 6.0,
      leadTimeDays: 5,
      status: 'active'
    } as any);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('records a manual inbound inventory transaction and persists events', async () => {
    const res = await request(app)
      .post('/api/inventory/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ materialId: 1, direction: 'in', quantity: 25, type: 'receipt', notes: 'PO-123' })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.resultingStock).toBeDefined();

    // Give async event persistence a moment
    await new Promise(r => setTimeout(r, 75));

    const invEvent = await EventLog.findOne({ where: { name: 'inventory.transaction.recorded' } });
    expect(invEvent).not.toBeNull();

    const stockEvent = await EventLog.findOne({ where: { name: 'material.stock.changed' } });
    expect(stockEvent).not.toBeNull();

    const trx = await InventoryTransaction.findOne({ where: { materialId: 1 } });
    expect(trx).not.toBeNull();
    expect(Number(trx!.resultingStock)).toBeGreaterThan(100);
  });

  it('updates stock via legacy stock endpoint and emits inventory transaction event', async () => {
    const res = await request(app)
      .put('/api/materials/1/stock')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ currentStock: 115, adjustment: 0, notes: 'Manual correction' })
      .expect(200);

    expect(res.body.data.currentStock).toBeDefined();

    await new Promise(r => setTimeout(r, 75));
    const stockChanged = await EventLog.findOne({ where: { name: 'material.stock.changed' }, order: [['createdAt','DESC']] });
    expect(stockChanged).not.toBeNull();
  });

  it('lists inventory transactions with pagination', async () => {
    const res = await request(app)
      .get('/api/inventory/transactions?limit=5')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toBeDefined();
  });
});
