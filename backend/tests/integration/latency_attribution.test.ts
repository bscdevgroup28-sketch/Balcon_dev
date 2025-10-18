/// <reference types="@types/jest" />
import request from 'supertest';
import balConApp from '../../src/appEnhanced';

describe('Phase 17 - Latency Attribution', () => {
  it('increments attribution counters after requests', async () => {
    const app = (balConApp as any).app as import('express').Application;
    // Warm up a few requests
    await request(app).get('/api/health/simple').expect(200);
    await request(app).get('/api/health/simple').expect(200);
    await request(app).get('/api/health/simple').expect(200);

    const metricsRes = await request(app).get('/api/metrics').expect(200);
    const gauges = metricsRes.body?.gauges || {};
    // Accept either of the counters, depending on registration order
    const sampleCount = gauges['latency.attr.sample_count'] ?? gauges['latency.attr.count'] ?? 0;
    expect(typeof sampleCount).toBe('number');
    expect(sampleCount).toBeGreaterThanOrEqual(1);
  });
});
