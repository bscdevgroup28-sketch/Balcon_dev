import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';
process.env.DATABASE_URL = 'sqlite::memory:';

import { BalConBuildersApp } from '../../src/appEnhanced';
import { sequelize } from '../../src/config/database';
import { runAllMigrations } from '../../src/scripts/migrationLoader';
import { AuthService } from '../../src/services/authService';
import '../../src/models/UserEnhanced';

let app: any;

async function createUser(email: string, role: string = 'project_manager') {
  const user = await AuthService.createUser({
    email,
    firstName: 'Persist',
    lastName: 'Tester',
    role,
    canAccessFinancials: true,
    canManageProjects: true,
    canManageUsers: true,
    isActive: true,
  } as any, 'StrongP@ss1');
  if (!user) throw new Error('Failed to create user');
  return user;
}

describe('Persistent Security Audit Log', () => {
  let user: any;
  let accessToken: string;

  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
    await runAllMigrations();
    await sequelize.sync();
    user = await createUser('persist_audit@example.com');
    // Login to produce events
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'StrongP@ss1' }).expect(200);
    accessToken = res.body.data.accessToken;
    // Trigger some additional audit events (failed logins)
    await request(app).post('/api/auth/login').send({ email: user.email, password: 'Wrong' });
    await request(app).post('/api/auth/login').send({ email: user.email, password: 'Wrong2' });
  });

  afterAll(async () => { await sequelize.close(); });

  it('returns events from in-memory buffer', async () => {
    const res = await request(app).get('/api/security/audit').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('returns events from persistent store with pagination', async () => {
    const res = await request(app).get('/api/security/audit/persistent?page=1&pageSize=20&action=auth.login')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.page).toBe(1);
  });
});
