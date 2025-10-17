import request from 'supertest';
import { app } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { KpiDailySnapshot, User } from '../../src/models';

/**
 * Phase 8: Anomalies endpoint basic integration test
 */

describe('Analytics Anomalies Endpoint', () => {
  let token: string;
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await User.createWithPassword({
      email: 'owner2@test.com', firstName: 'Own', lastName: 'Er', role: 'owner', isActive: true, isVerified: true
    } as any, 'Password123!');
    const login = await request(app).post('/api/auth/login').send({ email: 'owner2@test.com', password: 'Password123!' });
    token = login.body.data.accessToken;
    // Seed 30 days with one artificial anomaly spike
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const base = 20; // constant baseline for low std dev
      const isSpikeDay = i === 3; // 3 days ago big spike
      await KpiDailySnapshot.create({
        date: d,
  quotesSent: base + (isSpikeDay ? 200 : 0),
        quotesAccepted: base - 2,
        quoteConversionRate: (base - 2) / (base || 1),
  ordersCreated: base + (isSpikeDay ? 120 : 0),
        ordersDelivered: base - 1,
        avgOrderCycleDays: 7,
  inventoryNetChange: (isSpikeDay ? 300 : 5)
      } as any);
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('returns anomalies with z-score metadata', async () => {
  const res = await request(app).get('/api/analytics/anomalies?range=30d&threshold=1.5').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body.range).toBe('30d');
    expect(res.body.metrics).toBeDefined();
    const quotes = res.body.metrics.quotesSent;
    expect(quotes.anomalies.length).toBeGreaterThanOrEqual(1);
    const anomaly = quotes.anomalies[0];
    expect(anomaly).toHaveProperty('date');
    expect(typeof anomaly.zScore).toBe('number');
  });
});
