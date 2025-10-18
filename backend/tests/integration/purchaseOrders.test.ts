import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret-pos';
process.env.DATABASE_URL = 'sqlite::memory:';
import request from 'supertest';
import { BalConBuildersApp } from '../../src/appEnhanced';
import { sequelize } from '../../src/config/database';

describe('Purchase Orders API', () => {
  let app:any;
  let csrfCookie:string;
  let csrfToken:string;
  let auth:string;
  let materialId:number;

  beforeAll(async () => {
    const instance = new BalConBuildersApp();
    app = instance.app;
    await import('../../src/models/UserEnhanced');
    await import('../../src/models/RefreshToken');
    await import('../../src/models/Material');
    await import('../../src/models/InventoryTransaction');
    await import('../../src/models/PurchaseOrder');
    await sequelize.sync({ force: true });

    // CSRF
    const csrfRes = await request(app).get('/api/auth/csrf').expect(200);
    const setCookie = csrfRes.headers['set-cookie'];
    const cookieArr: string[] = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie as any] : []);
    csrfCookie = cookieArr.find((h:any)=>typeof h === 'string' && h.includes('csrfToken=')) as string;
    csrfToken = csrfRes.body.csrfToken as string;

    // user + login (shop_manager role allowed by policy)
    const { AuthService } = await import('../../src/services/authService');
    const user:any = await AuthService.createUser({ firstName:'Shop', lastName:'Mgr', email:`shop_${Date.now()}@ex.com`, role:'shop_manager', isActive:true, mustChangePassword:false, permissions: [] } as any, 'TestPass!1');
    const login = await request(app).post('/api/auth/login').set('Cookie', csrfCookie).set('X-CSRF-Token', csrfToken).send({ email: user.email, password:'TestPass!1' }).expect(200);
    auth = `Bearer ${login.body.data.accessToken}`;

    // seed a material with low stock
    const { Material } = await import('../../src/models/Material');
    const m:any = await (Material as any).create({ name:'Widget', category:'hardware', unitOfMeasure:'pieces', currentStock: 2, minimumStock: 3, reorderPoint: 5, unitCost: 10, markupPercentage: 50, sellingPrice: 15, leadTimeDays: 3, status:'active' });
    materialId = m.id;
  });

  afterAll(async () => { try { await sequelize.close(); } catch { /* ignore */ } });

  it('lists shortages, creates a PO, and receiving updates inventory', async () => {
    const shortages = await request(app).get('/api/purchase-orders/shortages').set('Authorization', auth).expect(200);
    expect(Array.isArray(shortages.body.data)).toBe(true);
    const item = shortages.body.data.find((x:any)=>x.materialId === materialId);
    expect(item && item.suggestedQty > 0).toBe(true);

    const create = await request(app)
      .post('/api/purchase-orders')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', auth)
      .send({ vendor: 'Acme Supply', items: [{ materialId, quantity: 10, unitCost: 9.5 }] })
      .expect(201);
    const poId = create.body.data.id as number;

    const { Material } = await import('../../src/models/Material');
    const before = await (Material as any).findByPk(materialId);
    const beforeQty = Number(before.currentStock);

    const recv = await request(app)
      .post(`/api/purchase-orders/${poId}/receive`)
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .set('Authorization', auth)
      .expect(200);
    expect(recv.body.data.status).toBe('received');

    const after = await (Material as any).findByPk(materialId);
    expect(Number(after.currentStock)).toBe(beforeQty + 10);
  });
});
