import request from 'supertest';
import { BalConBuildersApp } from '../../../src/appEnhanced';
import { sequelize } from '../../../src/config/database';

describe('Health Endpoint Failure Simulation', () => {
  let app: any;
  let originalQuery: any;

  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
    originalQuery = (sequelize as any).query;
  });

  afterAll(() => {
    (sequelize as any).query = originalQuery;
  });

  it('returns 503 and error envelope when DB query fails', async () => {
    (sequelize as any).query = jest.fn().mockRejectedValue(new Error('Simulated DB outage'));
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toMatchObject({ code: 'HEALTH_CHECK_FAILED' });
    expect(res.body.error.meta).toHaveProperty('component', 'database');
    expect(typeof res.body.error.meta.durationMs).toBe('number');
  });
});
