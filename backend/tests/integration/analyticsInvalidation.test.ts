import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { sequelize } from '../../src/config/database';
import { KpiDailySnapshot, Material, User } from '../../src/models';

/**
 * Phase 11: Analytics cache invalidation smoke test
 */

describe('Analytics Cache Invalidation', () => {
  let app: any;
  let token: string;
  beforeAll(async () => {
    process.env.CACHE_TTL_ANALYTICS_SUMMARY_MS = '60000';
    process.env.CACHE_TTL_ANALYTICS_TRENDS_MS = '60000';
    process.env.CACHE_TTL_ANALYTICS_DISTRIBUTION_MS = '60000';
    process.env.CACHE_TTL_ANALYTICS_ANOMALIES_MS = '60000';
    process.env.CACHE_TTL_ANALYTICS_FORECAST_MS = '60000';
    const instance = new BalConBuildersApp();
    app = instance.app;
    const { runAllMigrations } = await import('../../src/scripts/migrationLoader');
    await runAllMigrations();

    await User.createWithPassword({
      email: 'owner11@test.com', firstName: 'Own', lastName: 'Er', role: 'owner', isActive: true, isVerified: true
    } as any, 'Password123!');
    const login = await request(app).post('/api/auth/login').send({ email: 'owner11@test.com', password: 'Password123!' });
    token = login.body.data.accessToken;

    // Seed one snapshot so summary/trends have content
    await KpiDailySnapshot.create({
      date: new Date(), quotesSent: 5, quotesAccepted: 2, quoteConversionRate: 0.4, ordersCreated: 3, ordersDelivered: 1, avgOrderCycleDays: 7, inventoryNetChange: 2
    } as any);

    // Seed a material for distribution endpoint
    await Material.create({
      name: 'Board A', category: 'wood', unitOfMeasure: 'pieces', currentStock: 10, minimumStock: 2, reorderPoint: 1, unitCost: 5, markupPercentage: 10, sellingPrice: 6, leadTimeDays: 3, status: 'active'
    } as any);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('serves cached analytics, then invalidates on material create', async () => {
    const first = await request(app)
      .get('/api/analytics/distribution/materials?field=category')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const etag = first.headers['etag'];
    expect(etag).toBeDefined();

    // Create a new material that changes distribution
    await request(app)
      .post('/api/materials')
      .send({ name: 'Copper Wire', category: 'electrical', unitOfMeasure: 'ft', currentStock: 100, minimumStock: 10, reorderPoint: 5, unitCost: 1, markupPercentage: 50, sellingPrice: 1.5, leadTimeDays: 3, status: 'active' })
      .expect(201);

    // Small delay to allow event listeners to fire
    await new Promise(r => setTimeout(r, 50));

    const second = await request(app)
      .get('/api/analytics/distribution/materials?field=category')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // ETag should likely differ after invalidation and recompute
    expect(second.headers['etag']).not.toEqual(etag);
    expect(second.body.counts['electrical']).toBeDefined();
  });
});
