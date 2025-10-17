import request from 'supertest';
import { app } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User, ExportJob } from '../../src/models';

/**
 * Phase 9: Export Jobs basic flow
 */

describe('Export Jobs', () => {
  let token: string;
  beforeAll(async () => {
  await sequelize.sync({ force: true });
  await ExportJob.sync();
    await User.createWithPassword({
      email: 'owner-export@test.com', firstName: 'Ow', lastName: 'Ner', role: 'owner', isActive: true, isVerified: true
    } as any, 'Password123!');
    const login = await request(app).post('/api/auth/login').send({ email: 'owner-export@test.com', password: 'Password123!' });
    token = login.body.data.accessToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('creates a materials export job and retrieves completed result', async () => {
    const create = await request(app).post('/api/exports').set('Authorization', `Bearer ${token}`).send({ type: 'materials_csv' }).expect(202);
    expect(create.body.id).toBeDefined();
    const id = create.body.id;

    // Poll a few times
    let status = 'pending';
    let attempts = 0;
    let resultUrl: string | undefined;
    while (attempts < 12 && status !== 'completed') {
      await new Promise(r => setTimeout(r, 200));
      const res = await request(app).get(`/api/exports/${id}`).set('Authorization', `Bearer ${token}`).expect(200);
      status = res.body.status;
      resultUrl = res.body.resultUrl;
      attempts++;
    }
    if (status !== 'completed') {
      const jobRec = await ExportJob.findByPk(id);
      // Provide debugging info
      throw new Error(`Export job failed status=${status} error=${jobRec?.errorMessage}`);
    }
    expect(status).toBe('completed');
  expect(resultUrl).toMatch(/^(data:text\/csv;base64,|\/api\/exports\/download\/)/);
  });
});
