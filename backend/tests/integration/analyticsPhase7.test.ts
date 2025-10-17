import request from 'supertest';
import { app } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { KpiDailySnapshot, Material, User } from '../../src/models';

/**
 * Phase 7 Analytics endpoints integration smoke tests
 */

describe('Analytics Phase 7 Endpoints', () => {
  let token: string;
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    // create and login an owner for analytics access
    await User.createWithPassword({
      email: 'owner@test.com', firstName: 'Own', lastName: 'Er', role: 'owner', isActive: true, isVerified: true
    } as any, 'Password123!');
    const login = await request(app).post('/api/auth/login').send({ email: 'owner@test.com', password: 'Password123!' });
    token = login.body.data.accessToken;
    // Seed a few KPI snapshots (ascending dates)
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      await KpiDailySnapshot.create({
        date: d,
        quotesSent: 10 + i,
        quotesAccepted: 5 + i,
        quoteConversionRate: (5 + i)/(10 + i),
        ordersCreated: 2 + i,
        ordersDelivered: 1 + i,
        avgOrderCycleDays: 7 + i,
        inventoryNetChange: i * 3
      } as any);
    }
    // Seed materials for distribution
    await Material.bulkCreate([
      { name: 'Board A', category: 'wood', unitOfMeasure: 'pieces', currentStock: 10, minimumStock: 2, reorderPoint: 1, unitCost: 5, markupPercentage: 10, sellingPrice: 6, leadTimeDays: 3, status: 'active' } as any,
      { name: 'Board B', category: 'wood', unitOfMeasure: 'pieces', currentStock: 15, minimumStock: 2, reorderPoint: 1, unitCost: 5, markupPercentage: 10, sellingPrice: 6, leadTimeDays: 3, status: 'active' } as any,
      { name: 'Metal A', category: 'metal', unitOfMeasure: 'pieces', currentStock: 20, minimumStock: 2, reorderPoint: 1, unitCost: 5, markupPercentage: 10, sellingPrice: 6, leadTimeDays: 3, status: 'inactive' } as any
    ]);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('returns trends data with ETag and supports range parameter', async () => {
  const res = await request(app).get('/api/analytics/trends?range=30d').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.range).toBe('30d');
    expect(Array.isArray(res.body.points)).toBe(true);
    expect(res.headers['etag']).toBeDefined();
  });

  it('returns material category distribution cached response', async () => {
  const res = await request(app).get('/api/analytics/distribution/materials?field=category').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.field).toBe('category');
    expect(res.body.counts.wood).toBeDefined();
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('exports trends CSV', async () => {
  const res = await request(app).get('/api/analytics/trends.csv?range=30d').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text.split('\n')[0]).toContain('date');
  });

  it('exports materials distribution CSV', async () => {
  const res = await request(app).get('/api/analytics/distribution/materials.csv?field=category').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text.split('\n')[0]).toContain('value');
  });
});
