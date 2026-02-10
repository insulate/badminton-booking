// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://admin:admin123@localhost:27017/badminton_test?authSource=admin';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'badminton_secret_key_for_development_only_change_in_production';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Court = require('../models/court.model');
const Booking = require('../models/booking.model');
const TimeSlot = require('../models/timeslot.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

describe('Courts API Tests', () => {
  let adminUser, adminToken;
  let regularUser, regularToken;
  let testCourt;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }

    // Cleanup
    await Court.deleteMany({});
    await User.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      username: 'courtadmin',
      password: 'Admin123!',
      name: 'Court Admin',
      role: 'admin',
    });
    adminToken = generateToken(adminUser._id);

    // Create regular user
    regularUser = await User.create({
      username: 'courtuser',
      password: 'User123!',
      name: 'Court User',
      role: 'user',
    });
    regularToken = generateToken(regularUser._id);
  });

  afterAll(async () => {
    await Court.deleteMany({});
    await Booking.deleteMany({});
    await TimeSlot.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // --- CREATE ---
  describe('POST /api/courts', () => {
    it('should create a new court (admin)', async () => {
      const res = await request(app)
        .post('/api/courts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courtNumber: 'C1',
          name: 'สนาม 1',
          type: 'normal',
          status: 'available',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.courtNumber).toBe('C1');
      expect(res.body.data.name).toBe('สนาม 1');
      testCourt = res.body.data;
    });

    it('should reject duplicate court number', async () => {
      const res = await request(app)
        .post('/api/courts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courtNumber: 'C1',
          name: 'สนาม ซ้ำ',
          status: 'available',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/courts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-admin user (403)', async () => {
      const res = await request(app)
        .post('/api/courts')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          courtNumber: 'C2',
          name: 'สนาม 2',
          status: 'available',
        });

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated request (401)', async () => {
      const res = await request(app)
        .post('/api/courts')
        .send({
          courtNumber: 'C3',
          name: 'สนาม 3',
          status: 'available',
        });

      expect(res.status).toBe(401);
    });

    it('should create courts with different types', async () => {
      const res = await request(app)
        .post('/api/courts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courtNumber: 'C2',
          name: 'สนาม VIP',
          type: 'vip',
          status: 'available',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('vip');
    });
  });

  // --- READ ---
  describe('GET /api/courts', () => {
    it('should list all active courts', async () => {
      const res = await request(app)
        .get('/api/courts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter courts by status', async () => {
      const res = await request(app)
        .get('/api/courts?status=available')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((court) => {
        expect(court.status).toBe('available');
      });
    });

    it('should filter courts by type', async () => {
      const res = await request(app)
        .get('/api/courts?type=vip')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((court) => {
        expect(court.type).toBe('vip');
      });
    });
  });

  describe('GET /api/courts/:id', () => {
    it('should get a single court', async () => {
      const res = await request(app)
        .get(`/api/courts/${testCourt._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courtNumber).toBe('C1');
    });

    it('should return 404 for non-existent court', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/courts/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ObjectId', async () => {
      const res = await request(app)
        .get('/api/courts/invalidid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  // --- UPDATE ---
  describe('PUT /api/courts/:id', () => {
    it('should update court name', async () => {
      const res = await request(app)
        .put(`/api/courts/${testCourt._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'สนาม 1 (แก้ไข)' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('สนาม 1 (แก้ไข)');
    });

    it('should update court status', async () => {
      const res = await request(app)
        .put(`/api/courts/${testCourt._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'maintenance' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('maintenance');
    });

    it('should reject duplicate court number on update', async () => {
      const res = await request(app)
        .put(`/api/courts/${testCourt._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courtNumber: 'C2' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent court', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/courts/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'ไม่มีสนาม' });

      expect(res.status).toBe(404);
    });
  });

  // --- DELETE ---
  describe('DELETE /api/courts/:id', () => {
    it('should soft delete a court without bookings', async () => {
      // Create a court to delete
      const courtToDelete = await Court.create({
        courtNumber: 'DEL1',
        name: 'สนามลบ',
        status: 'available',
      });

      const res = await request(app)
        .delete(`/api/courts/${courtToDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft deleted
      const deleted = await Court.findById(courtToDelete._id);
      expect(deleted.deletedAt).not.toBeNull();
    });

    it('should not delete court with future bookings', async () => {
      // Create timeslot and booking for the court
      const timeslot = await TimeSlot.create({
        startTime: '10:00',
        endTime: '11:00',
        dayType: 'weekday',
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await Booking.create({
        bookingCode: 'BK-TEST-COURT-001',
        customer: { name: 'ทดสอบ', phone: '0812345678' },
        court: testCourt._id,
        date: tomorrow,
        timeSlot: timeslot._id,
        duration: 1,
        pricing: { subtotal: 150, total: 150 },
        bookingStatus: 'confirmed',
      });

      const res = await request(app)
        .delete(`/api/courts/${testCourt._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for already deleted court', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/courts/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
