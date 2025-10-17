import { describe, it, beforeAll, expect } from '@jest/globals';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { Material } from '../../src/models';

let app: any;

function parseMetric(body: string, name: string): number {
  // Prometheus exposition replaces dots with underscores
  const promName = name.replace(/\./g, '_');
  const line = body.split(/\n/).find(l => l.startsWith(promName + ' '));
  if (!line) return 0;
  const parts = line.trim().split(/\s+/);
  return parseFloat(parts[1]) || 0;
}

describe('Materials Categories Caching', () => {
  beforeAll(async () => {
    process.env.CACHE_TTL_MATERIAL_CATEGORIES_MS = '60000';
    // Use file-based sqlite so multiple Sequelize connections share the same data
    process.env.DATABASE_URL = 'sqlite:./test-cache.sqlite';
    const instance = new BalConBuildersApp();
    app = instance.app;
    const { runAllMigrations } = await import('../../src/scripts/migrationLoader');
    await runAllMigrations();
    // Provide all required non-null fields for Material
    await Material.create({
      name: 'Steel Beam',
      category: 'Structural',
      status: 'active',
      unitOfMeasure: 'ea',
      currentStock: 10,
      minimumStock: 2,
      reorderPoint: 1,
      unitCost: 100,
      markupPercentage: 20, // sellingPrice auto-computed by hook
      sellingPrice: 120, // ensure non-null (hook will overwrite if logic applies)
      leadTimeDays: 14
    });
  });

  it('serves categories consistently across cached calls', async () => {
    const first = await request(app).get('/api/materials/categories').expect(200);
    expect(first.body.data).toBeDefined();
    const second = await request(app).get('/api/materials/categories').expect(200);
    expect(second.body.data).toEqual(first.body.data);
  });

  it('invalidates categories cache when a new category is introduced', async () => {
    const before = await request(app).get('/api/materials/categories').expect(200);
    const original = before.body.data as string[];
    await request(app)
      .post('/api/materials')
      .send({
        name: 'Copper Wire',
        category: 'Electrical',
        status: 'active',
        unitOfMeasure: 'ft',
        currentStock: 100,
        minimumStock: 10,
        reorderPoint: 5,
        unitCost: 0.5,
        markupPercentage: 50,
        sellingPrice: 0.75,
        leadTimeDays: 4
      })
      .expect(201);
    // Allow event loop tick (in case of async propagation) then bypass cache to confirm DB has new category
    await new Promise(r => setTimeout(r, 25));
    const live = await request(app).get('/api/materials/categories?bypassCache=true').expect(200);
    expect(live.body.data).toContain('Electrical');
    // Now regular (cached) call should also include new category (freshly recached after invalidation)
    const recached = await request(app).get('/api/materials/categories').expect(200);
    expect(recached.body.data).toContain('Electrical');
    // Original categories still present
    for (const c of original) expect(recached.body.data).toContain(c);
  });

  it('increments cache hit counter on warm second call', async () => {
    const metricsBefore = await request(app).get('/api/metrics/prometheus').expect(200);
    const beforeHit = parseMetric(metricsBefore.text, 'cache.hit');
    // First call (may be miss or hit depending on prior tests) just warm it
    await request(app).get('/api/materials/categories').expect(200);
    const metricsMid = await request(app).get('/api/metrics/prometheus').expect(200);
    const midHit = parseMetric(metricsMid.text, 'cache.hit');
    // Second call should definitely be a hit increment
    await request(app).get('/api/materials/categories').expect(200);
    const metricsAfter = await request(app).get('/api/metrics/prometheus').expect(200);
    const afterHit = parseMetric(metricsAfter.text, 'cache.hit');
    expect(afterHit).toBeGreaterThanOrEqual(midHit + 1);
    expect(afterHit).toBeGreaterThanOrEqual(beforeHit + 1); // net increase from original snapshot
  });
});
