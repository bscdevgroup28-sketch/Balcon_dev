import request from 'supertest';

// We must set the env flag BEFORE the app (and thus metrics router) module is loaded.
process.env.DIAG_ENDPOINTS_ENABLED = 'true';

// Use dynamic import inside beforeAll to guarantee env is applied prior to module evaluation.
let BalConBuildersApp: any;

describe('Metrics Diagnostics Endpoints', () => {
  let app: any;
  beforeAll(async () => {
    ({ BalConBuildersApp } = await import('../../src/appEnhanced'));
    const instance = new BalConBuildersApp();
    app = instance.app;
  });

  it('returns pattern summary (even if empty)', async () => {
    const res = await request(app).get('/api/metrics/patterns');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('patterns');
    expect(Array.isArray(res.body.patterns)).toBe(true);
  });

  it('returns recent slow queries buffer (empty or populated)', async () => {
    const res = await request(app).get('/api/metrics/slow-queries?limit=5');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('queries');
    expect(Array.isArray(res.body.queries)).toBe(true);
  });
});
