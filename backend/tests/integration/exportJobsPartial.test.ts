import request from 'supertest';
import { app } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User, ExportJob, Material } from '../../src/models';

/**
 * Tests multi-batch partial export flow using tiny batch size
 */
describe('Export Jobs Partial / Incremental', () => {
  jest.setTimeout(20000);
  let token: string;
  const origLimit = process.env.EXPORT_BATCH_LIMIT;
  beforeAll(async () => {
    process.env.EXPORT_BATCH_LIMIT = '2';
    await sequelize.sync({ force: true });
    await ExportJob.sync();
    await User.createWithPassword({
      email: 'owner-export-part@test.com', firstName: 'Ow', lastName: 'Ner', role: 'owner', isActive: true, isVerified: true
    } as any, 'Password123!');
    // seed > 2 materials so we force multiple batches
    for (let i=0;i<5;i++) {
      await Material.create({
        name: 'Mat'+i,
        description: 'D'+i,
        category: 'general',
        unitOfMeasure: 'ea',
        unitCost: 1+i,
        sellingPrice: 2+i,
        reorderPoint: 1,
        quantityOnHand: 10+i
      } as any);
    }
    const login = await request(app).post('/api/auth/login').send({ email: 'owner-export-part@test.com', password: 'Password123!' });
    token = login.body.data.accessToken;
  });

  afterAll(async () => {
    if (origLimit) process.env.EXPORT_BATCH_LIMIT = origLimit; else delete process.env.EXPORT_BATCH_LIMIT;
    // Do not close sequelize here to avoid race with background job queue in test environment.
  });

  it('progresses through partial to completed with parts list', async () => {
    const create = await request(app).post('/api/exports').set('Authorization', `Bearer ${token}`).send({ type: 'materials_csv' }).expect(202);
    const id = create.body.id;
    let status = 'pending';
    let parts: any[] | undefined;
    for (let attempt=0; attempt<80 && status !== 'completed'; attempt++) {
      await new Promise(r => setTimeout(r, 150));
      const res = await request(app).get(`/api/exports/${id}`).set('Authorization', `Bearer ${token}`);
      status = res.body.status;
      parts = res.body.parts;
    }
    expect(status).toBe('completed');
    expect(parts).toBeDefined();
    expect(parts!.length).toBeGreaterThan(1); // multiple chunks
    const totalRows = parts!.reduce((s,p)=> s + (p.rows||0), 0);
    expect(totalRows).toBeGreaterThanOrEqual(5);
  });
});
