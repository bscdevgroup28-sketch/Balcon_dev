import request from 'supertest';
import express from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser: any = require('cookie-parser');
import { sequelize } from '../../../src/config/database';
import authRouter from '../../../src/routes/authEnhanced';
import { runAllMigrations } from '../../../src/scripts/migrationLoader';
import { User } from '../../../src/models/UserEnhanced';
import { getSecurityMetrics, resetSecurityMetrics } from '../../../src/utils/securityMetrics';

async function createUser(email: string) {
  return User.createWithPassword({
    email,
    firstName: 'Revoke',
    lastName: 'Case',
    role: 'project_manager',
    canAccessFinancials: true,
    canManageProjects: true,
    canManageUsers: true,
  } as any, 'P@ssw0rd!');
}

describe('Revoke All Tokens', () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use((req, _res, next) => { (req as any).recordAuthFailure = () => {}; (req as any).clearAuthFailures = () => {}; next(); });
  app.use('/api/auth', authRouter);

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'testsecret';
    process.env.DATABASE_URL = 'sqlite::memory:';
    // Don't use sync({ force: true }) as it causes deprecation warnings with :memory:
    // Just run migrations which will create all necessary tables
    await runAllMigrations();
  });

  afterAll(async () => { await sequelize.close(); });

  beforeEach(() => resetSecurityMetrics());

  test('revoke-all invalidates existing refresh token', async () => {
    const user = await createUser('revoke@example.com');

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'P@ssw0rd!' })
      .expect(200);
    const cookieHeader = loginRes.headers['set-cookie'];
    const cookieArr = Array.isArray(cookieHeader) ? cookieHeader : (cookieHeader ? [cookieHeader] : []);
    const refreshCookie = cookieArr.find(c => c.startsWith('refreshToken='));
    const refreshToken = refreshCookie!.split(';')[0].split('=')[1];

    // Revoke all
    const revokeRes = await request(app)
      .post('/api/auth/revoke-all')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`);
    if (revokeRes.status !== 200) {
      // eslint-disable-next-line no-console
      console.error('Revoke-all failure body:', revokeRes.body);
    }
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);

    // Attempt refresh with old token should fail
    await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .send({})
      .expect(401);

    const metrics = getSecurityMetrics();
    expect(metrics.revokeAll).toBeGreaterThanOrEqual(1);
  });
});
