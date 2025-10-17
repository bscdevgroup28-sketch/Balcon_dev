import 'ts-node/register';
import request from 'supertest';
import { BalConBuildersApp } from '../src/appEnhanced';

(async () => {
  const { runAllMigrations } = await import('../src/scripts/migrationLoader');
  await runAllMigrations();
  const app = new BalConBuildersApp().app;
  const before1 = await request(app).get('/api/materials/categories');
  console.log('Initial categories response:', before1.body);
  const createRes = await request(app).post('/api/materials').send({
    name: 'Copper Wire',
    category: 'Electrical',
    status: 'active',
    unitOfMeasure: 'ft',
    currentStock: 100,
    minimumStock: 10,
    reorderPoint: 5,
    unitCost: 0.5,
    markupPercentage: 50,
    sellingPrice: 0.75,
    leadTimeDays: 4
  });
  console.log('Create material status:', createRes.status, 'body:', createRes.body);
  const allMaterials = await request(app).get('/api/materials');
  console.log('All materials after create count:', allMaterials.body?.data?.length, 'data sample:', allMaterials.body?.data);
  const after = await request(app).get('/api/materials/categories');
  console.log('Categories after create:', after.body);
})();
