// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://admin:admin123@localhost:27017/badminton_test?authSource=admin';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'badminton_secret_key_for_development_only_change_in_production';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Generate JWT token for testing
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

describe('Auth API Tests', () => {
  let testUser;
  let testToken;

  // Setup: Create test user
  beforeAll(async () => {
    // Wait for mongoose connection to be ready
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }

    // Clear existing data
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
      username: 'testuser',
      password: 'Password123!',
      name: 'Test User',
      role: 'user',
    });

    // Generate token
    testToken = generateToken(testUser._id);
  });

  // Cleanup: Close DB connection after all tests
  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('username', 'testuser');
      expect(response.body.data).toHaveProperty('name', 'Test User');
      expect(response.body.data).toHaveProperty('role', 'user');
      expect(response.body.data).toHaveProperty('_id');
    });

    it('should fail login with missing username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide username and password');
    });

    it('should fail login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide username and password');
    });

    it('should fail login with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail login with deleted account', async () => {
      // Create a deleted user
      const deletedUser = await User.create({
        username: 'deleteduser',
        password: 'Password123!',
        name: 'Deleted User',
        role: 'user',
        deletedAt: new Date(),
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'deleteduser',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Your account has been deleted');

      // Cleanup
      await User.findByIdAndDelete(deletedUser._id);
    });

    it('should return valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      const token = response.body.data.token;

      // Verify token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('id');
      expect(decoded.id).toBe(testUser._id.toString());
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('username', 'testuser');
      expect(response.body.data).toHaveProperty('name', 'Test User');
      expect(response.body.data).toHaveProperty('role', 'user');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should deny access without token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
    });

    it('should deny access with expired token', async () => {
      // Create expired token
      const expiredToken = jwt.sign(
        { id: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      // Wait a moment to ensure token is expired
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Updated Test User',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test User');

      // Verify in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.name).toBe('Updated Test User');
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({
          name: 'Should Not Update',
        });

      expect(response.status).toBe(401);
    });

    it('should handle empty update', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/auth/password', () => {
    beforeEach(async () => {
      // Reset user password to known value
      testUser.password = 'Password123!';
      await testUser.save();
    });

    it('should change password successfully', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password updated successfully');
      expect(response.body.data).toHaveProperty('token');

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'NewPassword123!',
        });

      expect(loginResponse.status).toBe(200);

      // Reset password for other tests
      testUser.password = 'Password123!';
      await testUser.save();
    });

    it('should fail with wrong current password', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should fail with missing current password', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide current and new password');
    });

    it('should fail with missing new password', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'Password123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide current and new password');
    });

    it('should fail with short new password', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: '12345',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password must be at least 6 characters');
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(401);
    });

    it('should return new token after password change', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(200);
      const newToken = response.body.data.token;

      // Verify new token works
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newToken}`);

      expect(meResponse.status).toBe(200);

      // Reset password
      testUser.password = 'Password123!';
      await testUser.save();
    });
  });

  describe('Integration Tests', () => {
    it('should handle full auth flow', async () => {
      // 1. Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Password123!',
        });

      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.data.token;

      // 2. Get profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(profileResponse.status).toBe(200);

      // 3. Update profile
      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Flow Test User',
        });

      expect(updateResponse.status).toBe(200);

      // 4. Change password
      const passwordResponse = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'FlowTest123!',
        });

      expect(passwordResponse.status).toBe(200);
      const newToken = passwordResponse.body.data.token;

      // 5. Verify old password doesn't work
      const oldLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Password123!',
        });

      expect(oldLoginResponse.status).toBe(401);

      // 6. Verify new password works
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'FlowTest123!',
        });

      expect(newLoginResponse.status).toBe(200);

      // Reset for other tests
      testUser.password = 'Password123!';
      await testUser.save();
    });

    it('should handle admin user authentication', async () => {
      // Create admin user
      const adminUser = await User.create({
        username: 'admin-flow',
        password: 'Admin123!',
        name: 'Admin Flow',
        role: 'admin',
      });

      // Login as admin
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin-flow',
          password: 'Admin123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.role).toBe('admin');

      // Cleanup
      await User.findByIdAndDelete(adminUser._id);
    });
  });
});
