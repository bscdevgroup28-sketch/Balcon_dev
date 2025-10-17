import { describe, it, beforeAll, expect } from '@jest/globals';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { KpiDailySnapshot, User } from '../../src/models';

let app: any;

describe('Analytics Summary Caching & ETag', () => {
  beforeAll(async () => {
    process.env.CACHE_TTL_ANALYTICS_SUMMARY_MS = '30000';
    const instance = new BalConBuildersApp();
    app = instance.app;
    const { runAllMigrations } = await import('../../src/scripts/migrationLoader');
    await runAllMigrations();
    await KpiDailySnapshot.create({
      date: '2025-09-26',
      quotesSent: 5,
      quotesAccepted: 2,
      quoteConversionRate: 0.4,
      ordersCreated: 3,
      ordersDelivered: 1,
      inventoryNetChange: 10
    } as any);
    // auth user
    await User.createWithPassword({ email: 'owner2@test.com', firstName: 'Own', lastName: 'Er', role: 'owner', isActive: true, isVerified: true } as any, 'Password123!');
    const login = await request(app).post('/api/auth/login').send({ email: 'owner2@test.com', password: 'Password123!' });
    (global as any).__ANALYTICS_TOKEN = login.body.data.accessToken;
  });

  it('returns summary and then 304 with matching ETag', async () => {
  const first = await request(app).get('/api/analytics/summary').set('Authorization', `Bearer ${(global as any).__ANALYTICS_TOKEN}`).expect(200);
    expect(first.body.data).toBeDefined();
    const etag = first.headers['etag'];
    expect(etag).toBeDefined();
  await request(app).get('/api/analytics/summary').set('Authorization', `Bearer ${(global as any).__ANALYTICS_TOKEN}`).set('If-None-Match', etag).expect(304);
  });
});
