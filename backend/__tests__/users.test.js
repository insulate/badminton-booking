// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://admin:admin123@localhost:27017/badminton_test?authSource=admin';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'badminton_secret_key_for_development_only_change_in_production';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

describe('Users API Tests', () => {
  let adminUser, adminToken;
  let regularUser, regularToken;
  let createdUserId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }

    await User.deleteMany({});

    // Create admin
    adminUser = await User.create({
      username: 'useradmin',
      password: 'Admin123!',
      name: 'User Admin',
      role: 'admin',
    });
    adminToken = generateToken(adminUser._id);

    // Create regular user for auth tests
    regularUser = await User.create({
      username: 'regularuser',
      password: 'User123!',
      name: 'Regular User',
      role: 'user',
    });
    regularToken = generateToken(regularUser._id);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // --- CREATE ---
  describe('POST /api/users', () => {
    it('should create a new user (admin)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newstaff',
          password: 'Staff123!',
          name: 'New Staff',
          role: 'user',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('newstaff');
      expect(res.body.data.password).toBeUndefined();
      createdUserId = res.body.data._id;
    });

    it('should reject duplicate username', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newstaff',
          password: 'Test123!',
          name: 'Duplicate',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'nopassword' });

      expect(res.status).toBe(400);
    });

    it('should reject non-admin (403)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          username: 'blocked',
          password: 'Test123!',
          name: 'Blocked',
        });

      expect(res.status).toBe(403);
    });

    it('should create admin user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newadmin',
          password: 'Admin456!',
          name: 'New Admin',
          role: 'admin',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('admin');
    });
  });

  // --- READ ---
  describe('GET /api/users', () => {
    it('should list all users (exclude deleted)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      // Should not include password
      res.body.data.forEach((user) => {
        expect(user.password).toBeUndefined();
      });
    });

    it('should reject non-admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get a single user', async () => {
      const res = await request(app)
        .get(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('newstaff');
    });

    it('should return 404 for non-existent', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // --- UPDATE ---
  describe('PUT /api/users/:id', () => {
    it('should update user name', async () => {
      const res = await request(app)
        .put(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Staff' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Staff');
    });

    it('should update user role', async () => {
      const res = await request(app)
        .put(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('admin');
    });

    it('should reject duplicate username on update', async () => {
      const res = await request(app)
        .put(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'useradmin' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nobody' });

      expect(res.status).toBe(404);
    });
  });

  // --- DELETE ---
  describe('DELETE /api/users/:id', () => {
    it('should prevent deleting yourself', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot delete your own/i);
    });

    it('should soft delete a user', async () => {
      const res = await request(app)
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft deleted
      const user = await User.findById(createdUserId);
      expect(user.deletedAt).not.toBeNull();
    });

    it('should reject deleting already deleted user', async () => {
      const res = await request(app)
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already deleted/i);
    });
  });

  // --- RESTORE ---
  describe('PATCH /api/users/:id/restore', () => {
    it('should restore a soft-deleted user', async () => {
      const res = await request(app)
        .patch(`/api/users/${createdUserId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findById(createdUserId);
      expect(user.deletedAt).toBeNull();
    });

    it('should reject restoring non-deleted user', async () => {
      const res = await request(app)
        .patch(`/api/users/${createdUserId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not deleted/i);
    });

    it('should return 404 for non-existent', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/users/${fakeId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
