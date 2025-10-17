// Force env BEFORE imports that might read it
process.env.REFRESH_TOKEN_EXPIRES_IN = '1s';
import request from 'supertest';
import express from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser: any = require('cookie-parser');
import authRouter from '../../../src/routes/authEnhanced';
import { sequelize } from '../../../src/config/database';
import { runAllMigrations } from '../../../src/scripts/migrationLoader';

async function createUser(email: string) {
  const { User } = await import('../../../src/models/UserEnhanced');
  return User.createWithPassword({
    email,
    firstName: 'Expire',
    lastName: 'Case',
    role: 'project_manager',
    canAccessFinancials: true,
    canManageProjects: true,
    canManageUsers: true,
  } as any, 'P@ssw0rd!');
}

describe('Expired Refresh Token', () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use((req, _res, next) => { (req as any).recordAuthFailure = () => {}; (req as any).clearAuthFailures = () => {}; next(); });
  app.use('/api/auth', authRouter);

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'testsecret';
    process.env.DATABASE_URL = 'sqlite::memory:';
    await sequelize.sync({ force: true });
    await runAllMigrations();
  });

  afterAll(async () => { await sequelize.close(); });

  test('refresh fails after expiry', async () => {
    const user = await createUser('expired@example.com');
    const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password: 'P@ssw0rd!' }).expect(200);
    const cookieHeader = loginRes.headers['set-cookie'];
    const array = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
    const refreshCookie = array.find(c => c.startsWith('refreshToken='));
    const refreshToken = refreshCookie!.split(';')[0].split('=')[1];

    // wait to ensure expiry
    await new Promise(r => setTimeout(r, 1500));

    await request(app).post('/api/auth/refresh').set('Cookie', [`refreshToken=${refreshToken}`]).send({}).expect(401);
  });
});
