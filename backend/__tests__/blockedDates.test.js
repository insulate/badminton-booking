const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/user.model');
const Setting = require('../models/setting.model');

// Test data
let adminToken;
let staffToken;
let adminUser;
let staffUser;

// Test blocked date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const dayAfterTomorrow = new Date();
dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
dayAfterTomorrow.setHours(0, 0, 0, 0);
const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

beforeAll(async () => {
  // Connect to test database
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/badminton-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  // Clean up
  await User.deleteMany({});
  await Setting.deleteMany({});

  // Create admin user
  adminUser = await User.create({
    username: 'testadmin',
    password: 'admin123',
    name: 'Test Admin',
    role: 'admin',
  });

  // Create regular user (non-admin)
  staffUser = await User.create({
    username: 'testuser',
    password: 'user123',
    name: 'Test User',
    role: 'user',
  });

  // Generate tokens
  adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET || 'testsecret', {
    expiresIn: '1d',
  });

  staffToken = jwt.sign({ id: staffUser._id }, process.env.JWT_SECRET || 'testsecret', {
    expiresIn: '1d',
  });

  // Create default settings
  await Setting.create({});
});

afterAll(async () => {
  // Clean up
  await User.deleteMany({});
  await Setting.deleteMany({});

  // Close connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

beforeEach(async () => {
  // Clear blocked dates before each test
  const settings = await Setting.findOne();
  if (settings) {
    settings.booking.blockedDates = [];
    await settings.save();
  }
});

describe('Blocked Dates API', () => {
  describe('GET /api/settings/blocked-dates', () => {
    it('should return empty array when no blocked dates', async () => {
      const res = await request(app).get('/api/settings/blocked-dates');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should return blocked dates (public access)', async () => {
      // Add a blocked date first
      const settings = await Setting.findOne();
      settings.booking.blockedDates.push({
        date: tomorrow,
        reason: 'วันจัดแข่งขัน',
      });
      await settings.save();

      const res = await request(app).get('/api/settings/blocked-dates');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].reason).toBe('วันจัดแข่งขัน');
    });
  });

  describe('POST /api/settings/blocked-dates', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/settings/blocked-dates').send({
        date: tomorrowStr,
        reason: 'Test',
      });

      expect(res.status).toBe(401);
    });

    it('should require admin role', async () => {
      const res = await request(app)
        .post('/api/settings/blocked-dates')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          date: tomorrowStr,
          reason: 'Test',
        });

      expect(res.status).toBe(403);
    });

    it('should add blocked date (admin)', async () => {
      const res = await request(app)
        .post('/api/settings/blocked-dates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: tomorrowStr,
          reason: 'วันจัดแข่งขัน',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('เพิ่มวันปิดการจองสำเร็จ');
    });

    it('should not add duplicate blocked date', async () => {
      // Add first
      await request(app)
        .post('/api/settings/blocked-dates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: tomorrowStr,
          reason: 'Test 1',
        });

      // Try to add duplicate
      const res = await request(app)
        .post('/api/settings/blocked-dates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: tomorrowStr,
          reason: 'Test 2',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('วันนี้ถูกปิดการจองไปแล้ว');
    });

    it('should require date parameter', async () => {
      const res = await request(app)
        .post('/api/settings/blocked-dates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Test',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('กรุณาระบุวันที่');
    });
  });

  describe('DELETE /api/settings/blocked-dates/:date', () => {
    it('should require authentication', async () => {
      const res = await request(app).delete(`/api/settings/blocked-dates/${tomorrowStr}`);

      expect(res.status).toBe(401);
    });

    it('should require admin role', async () => {
      const res = await request(app)
        .delete(`/api/settings/blocked-dates/${tomorrowStr}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
    });

    it('should delete blocked date (admin)', async () => {
      // Add first
      await request(app)
        .post('/api/settings/blocked-dates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: tomorrowStr,
          reason: 'Test',
        });

      // Delete
      const res = await request(app)
        .delete(`/api/settings/blocked-dates/${tomorrowStr}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('ลบวันปิดการจองสำเร็จ');

      // Verify deleted
      const checkRes = await request(app).get('/api/settings/blocked-dates');
      expect(checkRes.body.data).toHaveLength(0);
    });

    it('should return 404 for non-existent blocked date', async () => {
      const res = await request(app)
        .delete(`/api/settings/blocked-dates/${dayAfterTomorrowStr}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('ไม่พบวันปิดการจองที่ระบุ');
    });
  });

  describe('Availability Check with Blocked Dates', () => {
    it('should return isBlocked=true for blocked date', async () => {
      // Add blocked date
      await request(app)
        .post('/api/settings/blocked-dates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          date: tomorrowStr,
          reason: 'วันจัดแข่งขัน',
        });

      // Check availability
      const res = await request(app).get(`/api/bookings/public/availability?date=${tomorrowStr}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isBlocked).toBe(true);
      expect(res.body.data.blockedReason).toBe('วันจัดแข่งขัน');
      expect(res.body.data.availability).toEqual([]);
    });

    it('should return isBlocked=false for normal date', async () => {
      const res = await request(app).get(`/api/bookings/public/availability?date=${dayAfterTomorrowStr}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isBlocked).toBe(false);
      expect(res.body.data.blockedReason).toBe(null);
    });
  });
});
