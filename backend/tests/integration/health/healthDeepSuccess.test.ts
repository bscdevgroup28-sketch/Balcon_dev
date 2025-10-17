import request from 'supertest';
import { BalConBuildersApp } from '../../../src/appEnhanced';

describe('Health Deep Endpoint', () => {
  let app: any;
  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
  });

  it('returns 200 with expected structure', async () => {
    const res = await request(app).get('/api/health/deep').expect(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('latencyMs');
    // Optional fields (best-effort): migrations, queue
    if (res.body.migrations) {
      expect(res.body.migrations).toHaveProperty('pending');
      expect(res.body.migrations).toHaveProperty('executed');
    }
    if (res.body.queue) {
      expect(res.body.queue).toHaveProperty('handlers');
      expect(res.body.queue).toHaveProperty('concurrency');
    }
  });
});
