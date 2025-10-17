import { describe, it, beforeAll, expect } from '@jest/globals';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { Material } from '../../src/models';

let app: any;

function parseMetric(body: string, name: string): number {
  const promName = name.replace(/\./g, '_');
  const line = body.split(/\n/).find(l => l.startsWith(promName + ' '));
  if (!line) return 0;
  return parseFloat(line.trim().split(/\s+/)[1]) || 0;
}

describe('Low Stock Materials Caching', () => {
  beforeAll(async () => {
    process.env.CACHE_TTL_MATERIALS_LOW_STOCK_MS = '20000';
    const instance = new BalConBuildersApp();
    app = instance.app;
    const { runAllMigrations } = await import('../../src/scripts/migrationLoader');
    await runAllMigrations();
    await Material.create({
      name: 'Bolt Pack', category: 'Hardware', status: 'active', unitOfMeasure: 'ea',
      currentStock: 2, minimumStock: 5, reorderPoint: 3, unitCost: 1, markupPercentage: 50, sellingPrice: 1.5, leadTimeDays: 5
    });
    await Material.create({
      name: 'Glue', category: 'Supplies', status: 'active', unitOfMeasure: 'ea',
      currentStock: 1, minimumStock: 4, reorderPoint: 2, unitCost: 3, markupPercentage: 30, sellingPrice: 3.9, leadTimeDays: 3
    });
  });

  it('returns low stock materials with caching and increments hit counter', async () => {
    const before = await request(app).get('/api/metrics/prometheus').expect(200);
    const hitBefore = parseMetric(before.text, 'cache.hit.materials_lowStock');
    await request(app).get('/api/materials/low-stock').expect(200);
    const mid = await request(app).get('/api/metrics/prometheus').expect(200);
    const hitMid = parseMetric(mid.text, 'cache.hit.materials_lowStock');
    await request(app).get('/api/materials/low-stock').expect(200);
    const after = await request(app).get('/api/metrics/prometheus').expect(200);
    const hitAfter = parseMetric(after.text, 'cache.hit.materials_lowStock');
    expect(hitAfter).toBeGreaterThanOrEqual(hitMid + 1);
    expect(hitAfter).toBeGreaterThanOrEqual(hitBefore + 1);
  });
});
