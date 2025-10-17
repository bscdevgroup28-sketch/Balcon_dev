import { describe, it, beforeAll, expect } from '@jest/globals';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { AuthService } from '../../src/services/authService';

let app: any; let email: string;

describe('Security Metrics - Lockout Counters', () => {
  beforeAll(async () => {
    process.env.AUTH_MAX_ATTEMPTS_WINDOW = '3';
    const instance = new BalConBuildersApp();
    app = instance.app;
    const { runAllMigrations } = await import('../../src/scripts/migrationLoader');
    await runAllMigrations();
    email = `metric_lock_${Date.now()}@example.com`;
    await AuthService.createUser({
      email,
      firstName: 'Metric',
      lastName: 'Lock',
      role: 'project_manager'
    } as any, 'SomePass123!');
  });

  it('increments authLockouts metric after repeated failures', async () => {
    for (let i=0;i<6;i++) {
      await request(app).post('/api/auth/login').send({ email, password: 'WrongPass!' });
    }
    const metrics = await request(app).get('/api/metrics/prometheus').expect(200);
    expect(metrics.text).toMatch(/security_authLockouts \d+/);
  });
});
