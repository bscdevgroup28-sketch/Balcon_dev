import request from 'supertest';
import express from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser: any = require('cookie-parser');
import authRouter from '../../../src/routes/authEnhanced';
import securityRouter from '../../../src/routes/security';
import { sequelize } from '../../../src/config/database';
import { runAllMigrations } from '../../../src/scripts/migrationLoader';

async function primeUser(app: any) {
  const email = 'metrics@example.com';
  // Create user directly via model to avoid extra routes
  const { User } = await import('../../../src/models/UserEnhanced');
  const user = await User.createWithPassword({
    email,
    firstName: 'Metrics',
    lastName: 'User',
    role: 'project_manager',
    canAccessFinancials: true,
    canManageProjects: true,
    canManageUsers: true,
  } as any, 'P@ssw0rd!');
  // Login
  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'P@ssw0rd!' });
  return { user, loginRes };
}

describe('Security Metrics & Audit', () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use((req, _res, next) => { (req as any).recordAuthFailure = () => {}; (req as any).clearAuthFailures = () => {}; next(); });
  app.use('/api/auth', authRouter);
  app.use('/api/security', securityRouter);

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'testsecret';
    process.env.DATABASE_URL = 'sqlite::memory:';
    await sequelize.sync({ force: true });
    await runAllMigrations();
  });

  afterAll(async () => { await sequelize.close(); });

  test('metrics reflect login + token list + revoke-all', async () => {
    const { loginRes } = await primeUser(app);
    const token = loginRes.body.data.accessToken;

    // token list (triggers audit + metrics)
    await request(app).get('/api/security/metrics').set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).get('/api/security/audit').set('Authorization', `Bearer ${token}`).expect(200);
    // revoke-all flow: list tokens first to ensure at least one
    await request(app).post('/api/auth/revoke-all').set('Authorization', `Bearer ${token}`);

    const metricsRes = await request(app).get('/api/security/metrics').set('Authorization', `Bearer ${token}`).expect(200);
    expect(metricsRes.body.success).toBe(true);
    const data = metricsRes.body.data;
    expect(data.loginSuccess).toBeGreaterThanOrEqual(1);
    expect(data.revokeAll).toBeGreaterThanOrEqual(1);
  });
});
