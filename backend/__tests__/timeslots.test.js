// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://admin:admin123@localhost:27017/badminton_test?authSource=admin';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'badminton_secret_key_for_development_only_change_in_production';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const TimeSlot = require('../models/timeslot.model');
const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

describe('TimeSlots API Tests', () => {
  let adminUser, adminToken;
  let regularUser, regularToken;
  let testTimeslot;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }

    await TimeSlot.deleteMany({});
    await User.deleteMany({});
    await Booking.deleteMany({});

    adminUser = await User.create({
      username: 'tsadmin',
      password: 'Admin123!',
      name: 'TS Admin',
      role: 'admin',
    });
    adminToken = generateToken(adminUser._id);

    regularUser = await User.create({
      username: 'tsuser',
      password: 'User123!',
      name: 'TS User',
      role: 'user',
    });
    regularToken = generateToken(regularUser._id);
  });

  afterAll(async () => {
    await TimeSlot.deleteMany({});
    await Booking.deleteMany({});
    await Court.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // --- CREATE ---
  describe('POST /api/timeslots', () => {
    it('should create a weekday timeslot', async () => {
      const res = await request(app)
        .post('/api/timeslots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startTime: '08:00',
          endTime: '09:00',
          dayType: 'weekday',
          pricing: { normal: 150, member: 120 },
          peakHour: false,
          status: 'active',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.startTime).toBe('08:00');
      expect(res.body.data.endTime).toBe('09:00');
      testTimeslot = res.body.data;
    });

    // Regression Bug #2: 24:00 endTime should be accepted
    it('should create timeslot with 24:00 endTime (Bug #2 regression)', async () => {
      const res = await request(app)
        .post('/api/timeslots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startTime: '23:00',
          endTime: '24:00',
          dayType: 'weekday',
          pricing: { normal: 150, member: 120 },
          status: 'active',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.endTime).toBe('24:00');
    });

    it('should reject overlapping timeslot on same dayType', async () => {
      const res = await request(app)
        .post('/api/timeslots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startTime: '08:30',
          endTime: '09:30',
          dayType: 'weekday',
          status: 'active',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/ซ้อนทับ/);
    });

    it('should allow same time range on different dayType', async () => {
      const res = await request(app)
        .post('/api/timeslots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startTime: '08:00',
          endTime: '09:00',
          dayType: 'weekend',
          pricing: { normal: 200, member: 170 },
          status: 'active',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.dayType).toBe('weekend');
    });

    it('should reject invalid time format', async () => {
      const res = await request(app)
        .post('/api/timeslots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startTime: '25:00',
          endTime: '26:00',
          dayType: 'weekday',
        });

      expect(res.status).toBe(500);
    });

    it('should reject non-admin (403)', async () => {
      const res = await request(app)
        .post('/api/timeslots')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          startTime: '10:00',
          endTime: '11:00',
          dayType: 'weekday',
        });

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated (401)', async () => {
      const res = await request(app)
        .post('/api/timeslots')
        .send({
          startTime: '10:00',
          endTime: '11:00',
          dayType: 'weekday',
        });

      expect(res.status).toBe(401);
    });

    it('should create a peak hour timeslot', async () => {
      const res = await request(app)
        .post('/api/timeslots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startTime: '17:00',
          endTime: '18:00',
          dayType: 'weekday',
          pricing: { normal: 150, member: 120 },
          peakPricing: { normal: 200, member: 170 },
          peakHour: true,
          status: 'active',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.peakHour).toBe(true);
    });
  });

  // --- READ ---
  describe('GET /api/timeslots', () => {
    it('should list all timeslots', async () => {
      const res = await request(app)
        .get('/api/timeslots')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by dayType', async () => {
      const res = await request(app)
        .get('/api/timeslots?dayType=weekend')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((ts) => {
        expect(ts.dayType).toBe('weekend');
      });
    });

    it('should filter by peakHour', async () => {
      const res = await request(app)
        .get('/api/timeslots?peakHour=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((ts) => {
        expect(ts.peakHour).toBe(true);
      });
    });
  });

  describe('GET /api/timeslots/active', () => {
    it('should list only active timeslots', async () => {
      const res = await request(app)
        .get('/api/timeslots/active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((ts) => {
        expect(ts.status).toBe('active');
      });
    });
  });

  describe('GET /api/timeslots/:id', () => {
    it('should get a single timeslot', async () => {
      const res = await request(app)
        .get(`/api/timeslots/${testTimeslot._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.startTime).toBe('08:00');
    });

    it('should return 404 for non-existent', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/timeslots/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // --- UPDATE ---
  describe('PUT /api/timeslots/:id', () => {
    it('should update timeslot pricing', async () => {
      const res = await request(app)
        .put(`/api/timeslots/${testTimeslot._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pricing: { normal: 180, member: 150 },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.pricing.normal).toBe(180);
    });

    it('should reject update that causes overlap', async () => {
      const res = await request(app)
        .put(`/api/timeslots/${testTimeslot._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startTime: '17:00',
          endTime: '18:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/ซ้อนทับ/);
    });
  });

  describe('PATCH /api/timeslots/:id/pricing', () => {
    it('should update pricing only', async () => {
      const res = await request(app)
        .patch(`/api/timeslots/${testTimeslot._id}/pricing`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pricing: { normal: 200 },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.pricing.normal).toBe(200);
    });
  });

  describe('PATCH /api/timeslots/bulk-update-pricing', () => {
    it('should bulk update weekday pricing', async () => {
      const res = await request(app)
        .patch('/api/timeslots/bulk-update-pricing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dayType: 'weekday',
          pricing: { normal: 160, member: 130 },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.modifiedCount).toBeGreaterThanOrEqual(1);
    });

    it('should reject empty pricing update', async () => {
      const res = await request(app)
        .patch('/api/timeslots/bulk-update-pricing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // --- DELETE ---
  describe('DELETE /api/timeslots/:id', () => {
    // Regression Bug #1: Should allow deleting timeslot with only completed bookings
    it('should delete timeslot with completed bookings (Bug #1 regression)', async () => {
      // Create a timeslot and completed booking
      const ts = await TimeSlot.create({
        startTime: '06:00',
        endTime: '07:00',
        dayType: 'weekday',
        status: 'active',
      });

      const court = await Court.create({
        courtNumber: 'TS-DEL-1',
        name: 'TS Delete Test',
        status: 'available',
      });

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      await Booking.create({
        bookingCode: 'BK-TS-DEL-001',
        customer: { name: 'ทดสอบ', phone: '0812345678' },
        court: court._id,
        date: pastDate,
        timeSlot: ts._id,
        duration: 1,
        pricing: { subtotal: 150, total: 150 },
        bookingStatus: 'completed',
      });

      const res = await request(app)
        .delete(`/api/timeslots/${ts._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should NOT delete timeslot with future pending bookings', async () => {
      const ts = await TimeSlot.create({
        startTime: '05:00',
        endTime: '06:00',
        dayType: 'weekend',
        status: 'active',
      });

      const court = await Court.create({
        courtNumber: 'TS-DEL-2',
        name: 'TS Delete Test 2',
        status: 'available',
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await Booking.create({
        bookingCode: 'BK-TS-DEL-002',
        customer: { name: 'ทดสอบ', phone: '0812345678' },
        court: court._id,
        date: futureDate,
        timeSlot: ts._id,
        duration: 1,
        pricing: { subtotal: 150, total: 150 },
        bookingStatus: 'confirmed',
      });

      const res = await request(app)
        .delete(`/api/timeslots/${ts._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/การจอง/);
    });

    it('should delete timeslot without bookings', async () => {
      const ts = await TimeSlot.create({
        startTime: '04:00',
        endTime: '05:00',
        dayType: 'weekday',
        status: 'active',
      });

      const res = await request(app)
        .delete(`/api/timeslots/${ts._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent timeslot', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/timeslots/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
