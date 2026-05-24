const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tournament_test');
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test\.com$/ });
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'testuser@test.com',
          password: 'Test@12345',
          role: 'user',
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'testuser@test.com',
          password: 'Test@12345',
          role: 'user',
        });
      expect(res.statusCode).toBe(409);
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Admin',
          email: 'testadmin@test.com',
          password: 'Test@12345',
          role: 'admin', // Should not be allowed
        });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject unverified user login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testuser@test.com', password: 'Test@12345' });
      expect(res.statusCode).toBe(403);
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testuser@test.com', password: 'WrongPassword' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/health', () => {
    it('should return OK status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });
});
