import { describe, it, expect } from '@jest/globals';

import request from 'supertest';
import app from '../src/app.js'; // ✅ Import the app directly

describe('ZettaNote Backend - Health Check API', () => {
  it('should return 200 and success message from /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});

describe('ZettaNote Backend - Authentication API', () => {
  it('should create a new user account', async () => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;

    const res = await request(app).post('/api/auth/signup').send({
      name: 'Test User',
      email: uniqueEmail,
      password: 'TestPassword123!',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('Account created successfully');
  });

  it('should return 400 for invalid signup data', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: '',
      email: 'invalid-email',
      password: '123',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});
