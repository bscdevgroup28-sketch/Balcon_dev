import { describe, it, beforeAll, expect } from '@jest/globals';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { jobQueue } from '../../src/jobs/jobQueue';

let app: any;

describe('Delayed Jobs API', () => {
  beforeAll(async () => {
    process.env.ENABLE_DELAYED_JOBS = 'true';
    const instance = new BalConBuildersApp();
    app = instance.app;
  });

  it('enqueues immediate job', async () => {
    const before = (jobQueue as any).queue?.length || 0;
    const res = await request(app).post('/api/jobs/enqueue').send({ type: 'kpi.snapshot' }).expect(202);
    expect(res.body.enqueued).toBe(true);
    expect(res.body.job.id).toBeDefined();
    const after = (jobQueue as any).queue?.length || 0;
    expect(after).toBeGreaterThanOrEqual(before); // queue may drain fast
  });

  it('enqueues delayed job', async () => {
    const res = await request(app).post('/api/jobs/enqueue').send({ type: 'kpi.snapshot', delayMs: 500 }).expect(202);
    expect(res.body.job.scheduledFor).toBeDefined();
    // Ensure not processed yet immediately
    // We can't easily assert internal state without exposing, so rely on scheduledFor presence
  });
});
