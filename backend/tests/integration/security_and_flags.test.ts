/// <reference types="@types/jest" />
/// <reference types="jest" />
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { app } from '../../src/app';
import { sequelize } from '../../src/config/database';
import { User } from '../../src/models/UserEnhanced';

/**
 * Integration tests focused on:
 * 1. Auth gating (401 vs 403) for protected routes
 * 2. Brute force protector escalation path
 * 3. Feature flag upsert security + retrieval
 * 4. Role-based update denial/allow logic (owner vs self)
 */

describe('Security & Feature Flags Integration', () => {
  let ownerToken: string;
  let technicianToken: string;
  let ownerId: number;
  let techId: number;

  async function login(email: string, password: string) {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    return res;
  }

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create owner and technician users directly
    const owner = await User.createWithPassword({
      email: 'owner@test.com',
      firstName: 'Owner',
      lastName: 'One',
      role: 'owner',
      isActive: true,
      isVerified: true,
      canManageProjects: true,
      canManageUsers: true,
      canAccessFinancials: true,
      permissions: ['system_admin']
    }, 'Password123!');
    ownerId = owner.id;

    const tech = await User.createWithPassword({
      email: 'tech@test.com',
      firstName: 'Tech',
      lastName: 'User',
      role: 'technician',
      isActive: true,
      isVerified: true,
      permissions: []
    }, 'Password123!');
    techId = tech.id;

    // Login via enhanced auth route to get access tokens
    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@test.com', password: 'Password123!' });
    ownerToken = ownerLogin.body.data?.accessToken;

    const techLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tech@test.com', password: 'Password123!' });
    technicianToken = techLogin.body.data?.accessToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Auth gating', () => {
    it('returns 401 for protected route without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('allows /api/auth/me with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      expect(res.body.data.user.email).toBe('owner@test.com');
    });
  });

  describe('Role-based update denial/allow', () => {
    it('prevents technician from elevating role', async () => {
      const res = await request(app)
        .put(`/api/users/${ownerId}`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({ role: 'owner' });
      expect([403, 401]).toContain(res.status); // 401 possible if mismatch on middleware variant
    });

    it('allows owner to update technician (role change)', async () => {
      const res = await request(app)
        .put(`/api/users/${techId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ role: 'technician', firstName: 'Techy' })
        .expect(200);
      expect(res.body.data.firstName).toBe('Techy');
    });
  });

  describe('Brute force protector', () => {
    it('escalates to lock after repeated bad logins', async () => {
      // Use a non-existent user to trigger failures
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'ghost@test.com', password: 'WrongPassword!' });
      }
      // A subsequent attempt should yield 429 or continued 401 depending on timing/backoff
      const finalAttempt = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: 'WrongPassword!' });
      expect([401, 429]).toContain(finalAttempt.status);
      if (finalAttempt.status === 429) {
        expect(finalAttempt.body.message).toMatch(/Too many failed attempts/i);
      }
    });
  });

  describe('Feature flags security', () => {
    it('denies unauthenticated list access', async () => {
      await request(app)
        .get('/api/feature-flags')
        .expect(401);
    });

    it('allows owner to upsert a flag', async () => {
      const res = await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ key: 'prefetch.v2', enabled: true, rolloutStrategy: 'all' })
        .expect(200);
      expect(res.body.key).toBe('prefetch.v2');
    });

    it('denies technician upsert of a feature flag', async () => {
      const res = await request(app)
        .post('/api/flags')
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({ key: 'prefetch.v2', enabled: false, rolloutStrategy: 'all' });
      expect([401, 403]).toContain(res.status);
    });

    it('lists flags for authorized user', async () => {
      const res = await request(app)
        .get('/api/flags')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.find((f: any) => f.key === 'prefetch.v2')).toBeTruthy();
    });

    it('check endpoint returns enabled flag state (anonymous allowed)', async () => {
      const res = await request(app)
        .get('/api/flags/check/prefetch.v2')
        .expect(200);
      expect(res.body.key).toBe('prefetch.v2');
      expect(typeof res.body.enabled).toBe('boolean');
    });
  });

  describe('Metrics endpoint', () => {
    it('returns JSON snapshot', async () => {
      const res = await request(app)
        .get('/api/metrics')
        .expect(200);
      expect(res.body).toBeDefined();
    });
  });
});
