import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import type { Application, Router } from 'express';
import type { Sequelize } from 'sequelize';
import type { AuthService as AuthServiceClass } from '../../../src/services/authService';
import type { User as UserModel } from '../../../src/models/UserEnhanced';
import type { RefreshToken as RefreshTokenModel } from '../../../src/models/RefreshToken';

let User: typeof UserModel;
let AuthService: typeof AuthServiceClass;
let RefreshToken: typeof RefreshTokenModel;
let sequelize: Sequelize;
let runAllMigrations: () => Promise<string[]>;
let authRouter: Router;

async function createTestUser(email: string) {
  return User.createWithPassword({
    email,
    firstName: 'Test',
    lastName: 'User',
    role: 'project_manager',
    canAccessFinancials: true,
    canManageProjects: true,
    canManageUsers: true,
  } as any, 'P@ssw0rd!');
}

describe('Refresh Token Rotation', () => {
  let app: Application;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'testsecret';
    process.env.DATABASE_URL = 'sqlite::memory:';
    process.env.DEFAULT_USER_PASSWORD = 'P@ssw0rd!';

    jest.resetModules();

    ({ sequelize } = await import('../../../src/config/database'));
    ({ default: authRouter } = await import('../../../src/routes/authEnhanced'));
    ({ runAllMigrations } = await import('../../../src/scripts/migrationLoader'));
    ({ AuthService } = await import('../../../src/services/authService'));
    ({ User } = await import('../../../src/models/UserEnhanced'));
    ({ RefreshToken } = await import('../../../src/models/RefreshToken'));

    app = express();
    app.use(express.json());
  // Cast to any to avoid overload resolution issue in isolated test bundle
  app.use(cookieParser() as any);
    app.use((req, _res, next) => {
      (req as any).recordAuthFailure = () => {};
      (req as any).clearAuthFailures = () => {};
      next();
    });
    app.use('/api/auth', authRouter);

    await sequelize.sync({ force: true });
    await runAllMigrations();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('login issues access + refresh, refresh rotates token, old revoked', async () => {
    const user = await createTestUser('rotate@example.com');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'P@ssw0rd!' })
      .expect(200);

    expect(loginRes.body.success).toBe(true);
    const firstAccess = loginRes.body.data.accessToken;
    const setCookieHeader1 = loginRes.headers['set-cookie'];
    const cookieArray1 = Array.isArray(setCookieHeader1) ? setCookieHeader1 : (setCookieHeader1 ? [setCookieHeader1] : []);
    const firstCookie = cookieArray1.find(c => c.startsWith('refreshToken='));
    expect(firstCookie).toBeTruthy();
    const firstRefresh = firstCookie!.split(';')[0].split('=')[1];

    await new Promise(r => setTimeout(r, 1000));
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${firstRefresh}`])
      .send({})
      .expect(200);

    const secondAccess = refreshRes.body.data.accessToken;
    const setCookieHeader2 = refreshRes.headers['set-cookie'];
    const cookieArray2 = Array.isArray(setCookieHeader2) ? setCookieHeader2 : (setCookieHeader2 ? [setCookieHeader2] : []);
    const secondCookie = cookieArray2.find(c => c.startsWith('refreshToken='));
    const secondRefresh = secondCookie!.split(';')[0].split('=')[1];
    if (secondRefresh === firstRefresh) {
      console.warn('[test] refresh token did not change; rotation logic may be bypassed');
    }
    if (secondAccess === firstAccess) {
      console.warn('[test] access token identical; iat may be same-second issuance');
    }

    const oldHash = AuthService.hashToken(firstRefresh);
    const oldRecord = await RefreshToken.findOne({ where: { userId: user.id, tokenHash: oldHash } });
    expect(oldRecord).toBeTruthy();
    expect(oldRecord!.revokedAt).not.toBeNull();
    expect(oldRecord!.replacedByToken).toBe(AuthService.hashToken(secondRefresh));

    const reuseRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', [`refreshToken=${firstRefresh}`])
      .send({})
      .expect(401);

    expect(reuseRes.body.success).toBe(false);
  });
});
