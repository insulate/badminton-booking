const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const RecurringBookingGroup = require('../models/recurringBookingGroup.model');
const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');
const User = require('../models/user.model');
const Setting = require('../models/setting.model');

describe('Recurring Bookings API', () => {
  let adminToken;
  let court;
  let timeSlot;
  let testRecurringGroup;

  beforeAll(async () => {
    // Create admin user for test
    const testUsername = 'admin_recurring_test';
    let adminUser = await User.findOne({ username: testUsername });
    if (!adminUser) {
      adminUser = await User.create({
        username: testUsername,
        password: 'password123',
        role: 'admin',
        name: 'Admin Recurring Test',
      });
    }

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: testUsername, password: 'password123' });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${loginRes.body.message || 'Unknown error'}`);
    }
    adminToken = loginRes.body.data.token;

    // Get or create court
    court = await Court.findOne({ status: 'available' });
    if (!court) {
      court = await Court.create({
        courtNumber: 'TEST01',
        name: 'Test Court 1',
        status: 'available',
      });
    }

    // Get or create timeslot - find any active timeslot
    timeSlot = await TimeSlot.findOne({ status: 'active' });
    if (!timeSlot) {
      timeSlot = await TimeSlot.create({
        startTime: '09:00',
        endTime: '10:00',
        dayType: 'weekday',
        status: 'active',
        pricing: { normal: 120, member: 100 },
        peakPricing: { normal: 150, member: 120 },
        peakHour: false,
      });
    }
  });

  afterAll(async () => {
    // Clean up test data
    await RecurringBookingGroup.deleteMany({ groupCode: /^RG.*TEST/ });
    await Booking.deleteMany({ isRecurring: true, notes: /test recurring/i });
  });

  describe('POST /api/recurring-bookings/preview', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/recurring-bookings/preview')
        .send({
          daysOfWeek: [1, 3, 5],
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          court: court._id,
          timeSlot: timeSlot._id,
          duration: 1,
        });

      expect(res.status).toBe(401);
    });

    it('should validate daysOfWeek is required', async () => {
      const res = await request(app)
        .post('/api/recurring-bookings/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          court: court._id,
          timeSlot: timeSlot._id,
          duration: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should validate date range (max 3 months)', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 4); // 4 months later

      const res = await request(app)
        .post('/api/recurring-bookings/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          daysOfWeek: [1, 3, 5],
          startDate,
          endDate,
          court: court._id,
          timeSlot: timeSlot._id,
          duration: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('3 เดือน');
    });

    it('should return preview with valid dates', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // Start next week
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14); // 2 weeks from start

      const res = await request(app)
        .post('/api/recurring-bookings/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          daysOfWeek: [0, 6], // Sat, Sun - less likely to conflict
          startDate,
          endDate,
          court: court._id,
          timeSlot: timeSlot._id,
          duration: 1,
        });

      // Debug: log response if test fails
      if (res.status !== 200) {
        console.log('Preview failed:', res.body);
      }

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('dates');
      expect(res.body.data).toHaveProperty('pricing');
      expect(res.body.data.summary.validDates).toBeGreaterThan(0);
    });
  });

  describe('POST /api/recurring-bookings', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/recurring-bookings')
        .send({
          customer: { name: 'Test', phone: '0812345678' },
          daysOfWeek: [1, 3, 5],
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          court: court._id,
          timeSlot: timeSlot._id,
          duration: 1,
        });

      expect(res.status).toBe(401);
    });

    it('should require customer info', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const res = await request(app)
        .post('/api/recurring-bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          daysOfWeek: [1],
          startDate,
          endDate,
          court: court._id,
          timeSlot: timeSlot._id,
          duration: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('ลูกค้า');
    });

    it('should create recurring booking group', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // Start next week
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14); // 2 weeks from start

      const res = await request(app)
        .post('/api/recurring-bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer: {
            name: 'Test Customer Recurring',
            phone: '0899999999',
            email: 'test@recurring.com',
          },
          daysOfWeek: [0, 6], // Sat, Sun - less likely to conflict
          startDate,
          endDate,
          court: court._id,
          timeSlot: timeSlot._id,
          duration: 1,
          paymentMode: 'per_session',
          notes: 'test recurring booking',
        });

      // Debug: log response if test fails
      if (res.status !== 201) {
        console.log('Create failed:', res.body);
      }

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('recurringGroup');
      expect(res.body.data.recurringGroup.groupCode).toMatch(/^RG/);
      expect(res.body.data.bookingsCreated).toBeGreaterThan(0);

      testRecurringGroup = res.body.data.recurringGroup;
    });
  });

  describe('GET /api/recurring-bookings', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/recurring-bookings');

      expect(res.status).toBe(401);
    });

    it('should return list of recurring groups', async () => {
      const res = await request(app)
        .get('/api/recurring-bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/recurring-bookings?status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data.every((g) => g.status === 'active')).toBe(true);
      }
    });
  });

  describe('GET /api/recurring-bookings/:id', () => {
    it('should return recurring group by id', async () => {
      if (!testRecurringGroup) {
        console.log('Skipping - no test recurring group created');
        return;
      }

      const res = await request(app)
        .get(`/api/recurring-bookings/${testRecurringGroup._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.groupCode).toBe(testRecurringGroup.groupCode);
    });

    it('should return 404 for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/recurring-bookings/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/recurring-bookings/:id/bookings', () => {
    it('should return bookings in group', async () => {
      if (!testRecurringGroup) {
        console.log('Skipping - no test recurring group created');
        return;
      }

      const res = await request(app)
        .get(`/api/recurring-bookings/${testRecurringGroup._id}/bookings`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /api/recurring-bookings/:id/cancel', () => {
    it('should require authentication', async () => {
      if (!testRecurringGroup) return;

      const res = await request(app).patch(
        `/api/recurring-bookings/${testRecurringGroup._id}/cancel`
      );

      expect(res.status).toBe(401);
    });

    it('should cancel recurring booking group', async () => {
      if (!testRecurringGroup) {
        console.log('Skipping - no test recurring group created');
        return;
      }

      const res = await request(app)
        .patch(`/api/recurring-bookings/${testRecurringGroup._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('ยกเลิก');
    });
  });
});
