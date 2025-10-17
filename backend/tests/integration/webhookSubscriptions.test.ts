import request from 'supertest';
import { app } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User, WebhookSubscription } from '../../src/models';

describe('Webhook Subscription CRUD', () => {
  let token: string;
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await User.createWithPassword({
      email: 'webhook-admin@test.com', firstName: 'Web', lastName: ' Hook', role: 'owner', isActive: true, isVerified: true
    } as any, 'Password123!');
    const login = await request(app).post('/api/auth/login').send({ email: 'webhook-admin@test.com', password: 'Password123!' });
    token = login.body.data.accessToken;
  });

  it('creates, lists, gets, rotates secret, patches, and deletes a subscription', async () => {
    const create = await request(app).post('/api/webhooks').set('Authorization', `Bearer ${token}`).send({ eventType: 'export.completed', targetUrl: 'https://example.com/webhook' }).expect(201);
    expect(create.body.secret).toBeDefined();
    const id = create.body.id;

    const list = await request(app).get('/api/webhooks').set('Authorization', `Bearer ${token}`).expect(200);
    expect(list.body.find((s: any) => s.id === id)).toBeTruthy();

    const get = await request(app).get(`/api/webhooks/${id}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(get.body.id).toBe(id);

    const rotate = await request(app).post(`/api/webhooks/${id}/rotate-secret`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(rotate.body.secret).toBeDefined();

    const patch = await request(app).patch(`/api/webhooks/${id}`).set('Authorization', `Bearer ${token}`).send({ isActive: false }).expect(200);
    expect(patch.body.isActive).toBe(false);

    await request(app).delete(`/api/webhooks/${id}`).set('Authorization', `Bearer ${token}`).expect(204);
    const after = await WebhookSubscription.findByPk(id);
    expect(after).toBeNull();
  });
});
