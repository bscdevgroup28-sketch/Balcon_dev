import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';

describe('Metrics Exposure', () => {
  let app: any;
  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
  });

  it('should expose advanced metrics when enabled', async () => {
    if (process.env.ADV_METRICS_ENABLED === 'false') return; // skip
    const res = await request(app).get('/api/metrics/prometheus').expect(200);
    const body: string = res.text || JSON.stringify(res.body);
    expect(body).toMatch(/http_request_duration_seconds/);
    expect(body).toMatch(/domain_events_total/);
    expect(body).toMatch(/app_errors_total/);
  });
});
