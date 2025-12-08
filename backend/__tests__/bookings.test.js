// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://admin:admin123@localhost:27017/badminton_test?authSource=admin';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'badminton_secret_key_for_development_only_change_in_production';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');
const Booking = require('../models/booking.model');
const jwt = require('jsonwebtoken');

// Generate JWT token for testing
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

describe('Bookings API Tests', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;
  let testCourt;
  let testTimeSlot;
  let testBooking;

  // Setup: Create test data
  beforeAll(async () => {
    // Wait for mongoose connection to be ready
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }

    // Clear existing data
    await User.deleteMany({});
    await Court.deleteMany({});
    await TimeSlot.deleteMany({});
    await Booking.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      username: 'admin-booking',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin',
    });

    // Create regular user
    regularUser = await User.create({
      username: 'user-booking',
      password: 'User123!',
      name: 'Regular User',
      role: 'user',
    });

    // Generate tokens
    adminToken = generateToken(adminUser._id);
    userToken = generateToken(regularUser._id);

    // Create test court
    testCourt = await Court.create({
      courtNumber: 'C01',
      name: 'Court 1',
      type: 'normal',
      status: 'available',
    });

    // Create test time slot
    testTimeSlot = await TimeSlot.create({
      startTime: '09:00',
      endTime: '10:00',
      dayType: 'weekday',
      pricing: { normal: 150, member: 120 },
      peakPricing: { normal: 200, member: 170 },
      peakHour: false,
      status: 'active',
    });
  });

  // Cleanup: Close DB connection after all tests
  afterAll(async () => {
    await User.deleteMany({});
    await Court.deleteMany({});
    await TimeSlot.deleteMany({});
    await Booking.deleteMany({});
    await mongoose.connection.close();
  });

  // Clean up bookings before each test
  beforeEach(async () => {
    await Booking.deleteMany({});
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking successfully', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer: {
            name: 'Test Customer',
            phone: '0812345678',
            email: 'test@example.com',
          },
          court: testCourt._id.toString(),
          date: tomorrow.toISOString(),
          timeSlot: testTimeSlot._id.toString(),
          duration: 1,
          paymentMethod: 'cash',
          paymentStatus: 'pending',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('bookingCode');
      expect(response.body.data.customer.name).toBe('Test Customer');
      expect(response.body.data.customer.phone).toBe('0812345678');
      expect(response.body.data.bookingStatus).toBe('confirmed');

      // Save for later tests
      testBooking = response.body.data;
    });

    it('should deny access without token', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/bookings')
        .send({
          customer: {
            name: 'Test Customer',
            phone: '0812345678',
          },
          court: testCourt._id.toString(),
          date: tomorrow.toISOString(),
          timeSlot: testTimeSlot._id.toString(),
        });

      expect(response.status).toBe(401);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer: {
            name: 'Test Customer',
          },
          // Missing court, date, timeSlot
        });

      expect(response.status).toBe(400);
    });

    it('should fail when court is not available', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // Create first booking
      await Booking.create({
        bookingCode: 'BK2025111900001',
        customer: {
          name: 'Existing Customer',
          phone: '0899999999',
        },
        court: testCourt._id,
        date: tomorrow,
        timeSlot: testTimeSlot._id,
        duration: 1,
        pricing: {
          subtotal: 150,
          discount: 0,
          deposit: 0,
          total: 150,
        },
        bookingStatus: 'confirmed',
        paymentStatus: 'pending',
      });

      // Try to create conflicting booking
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer: {
            name: 'Test Customer',
            phone: '0812345678',
          },
          court: testCourt._id.toString(),
          date: tomorrow.toISOString(),
          timeSlot: testTimeSlot._id.toString(),
          duration: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not available');
    });
  });

  describe('GET /api/bookings', () => {
    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // Create test bookings
      await Booking.create([
        {
          bookingCode: 'BK2025111900001',
          customer: { name: 'Customer 1', phone: '0811111111' },
          court: testCourt._id,
          date: tomorrow,
          timeSlot: testTimeSlot._id,
          duration: 1,
          pricing: { subtotal: 150, discount: 0, deposit: 0, total: 150 },
          bookingStatus: 'confirmed',
          paymentStatus: 'pending',
        },
        {
          bookingCode: 'BK2025111900002',
          customer: { name: 'Customer 2', phone: '0822222222' },
          court: testCourt._id,
          date: tomorrow,
          timeSlot: testTimeSlot._id,
          duration: 1,
          pricing: { subtotal: 150, discount: 0, deposit: 0, total: 150 },
          bookingStatus: 'completed',
          paymentStatus: 'paid',
        },
      ]);
    });

    it('should get all bookings', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should filter bookings by booking status', async () => {
      const response = await request(app)
        .get('/api/bookings?bookingStatus=confirmed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].bookingStatus).toBe('confirmed');
    });

    it('should filter bookings by payment status', async () => {
      const response = await request(app)
        .get('/api/bookings?paymentStatus=paid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].paymentStatus).toBe('paid');
    });

    it('should filter bookings by customer phone', async () => {
      const response = await request(app)
        .get('/api/bookings?customerPhone=0811111111')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].customer.phone).toBe('0811111111');
    });

    it('should deny access without token', async () => {
      const response = await request(app).get('/api/bookings');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/bookings/:id', () => {
    let booking;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      booking = await Booking.create({
        bookingCode: 'BK2025111900001',
        customer: { name: 'Test Customer', phone: '0812345678' },
        court: testCourt._id,
        date: tomorrow,
        timeSlot: testTimeSlot._id,
        duration: 1,
        pricing: { subtotal: 150, discount: 0, deposit: 0, total: 150 },
        bookingStatus: 'confirmed',
        paymentStatus: 'pending',
      });
    });

    it('should get booking by id', async () => {
      const response = await request(app)
        .get(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookingCode).toBe('BK2025111900001');
      expect(response.body.data.customer.name).toBe('Test Customer');
    });

    it('should return 404 for non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should deny access without token', async () => {
      const response = await request(app).get(`/api/bookings/${booking._id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/bookings/:id', () => {
    let booking;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      booking = await Booking.create({
        bookingCode: 'BK2025111900001',
        customer: { name: 'Original Name', phone: '0812345678' },
        court: testCourt._id,
        date: tomorrow,
        timeSlot: testTimeSlot._id,
        duration: 1,
        pricing: { subtotal: 150, discount: 0, deposit: 0, total: 150 },
        bookingStatus: 'confirmed',
        paymentStatus: 'pending',
      });
    });

    it('should update booking successfully', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer: {
            name: 'Updated Name',
          },
          notes: 'Updated notes',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customer.name).toBe('Updated Name');
      expect(response.body.data.notes).toBe('Updated notes');
    });

    it('should validate status transitions', async () => {
      // Try invalid transition from confirmed to completed (should go through checked-in first)
      const response = await request(app)
        .patch(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bookingStatus: 'completed',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid status transition');
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${booking._id}`)
        .send({ notes: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/bookings/:id/checkin', () => {
    let booking;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      booking = await Booking.create({
        bookingCode: 'BK2025111900001',
        customer: { name: 'Test Customer', phone: '0812345678' },
        court: testCourt._id,
        date: tomorrow,
        timeSlot: testTimeSlot._id,
        duration: 1,
        pricing: { subtotal: 150, discount: 0, deposit: 0, total: 150 },
        bookingStatus: 'confirmed',
        paymentStatus: 'pending',
      });
    });

    it('should check-in booking successfully', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookingStatus).toBe('checked-in');
    });

    it('should fail check-in for non-confirmed booking', async () => {
      // Update booking to completed
      booking.bookingStatus = 'completed';
      await booking.save();

      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/bookings/:id/checkout', () => {
    let booking;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      booking = await Booking.create({
        bookingCode: 'BK2025111900001',
        customer: { name: 'Test Customer', phone: '0812345678' },
        court: testCourt._id,
        date: tomorrow,
        timeSlot: testTimeSlot._id,
        duration: 1,
        pricing: { subtotal: 150, discount: 0, deposit: 0, total: 150 },
        bookingStatus: 'checked-in',
        paymentStatus: 'pending',
      });
    });

    it('should check-out booking successfully', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/checkout`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookingStatus).toBe('completed');
    });

    it('should fail check-out for non-checked-in booking', async () => {
      // Update booking to confirmed (not checked-in)
      booking.bookingStatus = 'confirmed';
      await booking.save();

      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/checkout`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/bookings/:id/cancel', () => {
    let booking;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      booking = await Booking.create({
        bookingCode: 'BK2025111900001',
        customer: { name: 'Test Customer', phone: '0812345678' },
        court: testCourt._id,
        date: tomorrow,
        timeSlot: testTimeSlot._id,
        duration: 1,
        pricing: { subtotal: 150, discount: 0, deposit: 0, total: 150 },
        bookingStatus: 'confirmed',
        paymentStatus: 'pending',
      });
    });

    it('should cancel booking successfully', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookingStatus).toBe('cancelled');
    });

    it('should deny access without token', async () => {
      const response = await request(app).patch(`/api/bookings/${booking._id}/cancel`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/bookings/check-availability', () => {
    it('should check availability successfully', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/bookings/check-availability')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courtId: testCourt._id.toString(),
          date: tomorrow.toISOString(),
          timeSlotId: testTimeSlot._id.toString(),
          duration: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('available');
    });

    it('should deny access without token', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request(app)
        .post('/api/bookings/check-availability')
        .send({
          courtId: testCourt._id.toString(),
          date: tomorrow.toISOString(),
          timeSlotId: testTimeSlot._id.toString(),
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/bookings/calculate-price', () => {
    it('should calculate price successfully', async () => {
      const response = await request(app)
        .post('/api/bookings/calculate-price')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          timeSlotId: testTimeSlot._id.toString(),
          duration: 1,
          customerType: 'normal',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('subtotal');
      expect(response.body.data).toHaveProperty('total');
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .post('/api/bookings/calculate-price')
        .send({
          timeSlotId: testTimeSlot._id.toString(),
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete booking flow', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // 1. Check availability
      const availabilityResponse = await request(app)
        .post('/api/bookings/check-availability')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courtId: testCourt._id.toString(),
          date: tomorrow.toISOString(),
          timeSlotId: testTimeSlot._id.toString(),
          duration: 1,
        });

      expect(availabilityResponse.status).toBe(200);
      expect(availabilityResponse.body.data.available).toBe(true);

      // 2. Calculate price
      const priceResponse = await request(app)
        .post('/api/bookings/calculate-price')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          timeSlotId: testTimeSlot._id.toString(),
          duration: 1,
          customerType: 'normal',
        });

      expect(priceResponse.status).toBe(200);

      // 3. Create booking
      const createResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer: {
            name: 'Flow Test Customer',
            phone: '0899999999',
          },
          court: testCourt._id.toString(),
          date: tomorrow.toISOString(),
          timeSlot: testTimeSlot._id.toString(),
          duration: 1,
        });

      expect(createResponse.status).toBe(201);
      const bookingId = createResponse.body.data._id;

      // 4. Get booking details
      const getResponse = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(200);

      // 5. Check-in
      const checkinResponse = await request(app)
        .patch(`/api/bookings/${bookingId}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(checkinResponse.status).toBe(200);
      expect(checkinResponse.body.data.bookingStatus).toBe('checked-in');

      // 6. Check-out
      const checkoutResponse = await request(app)
        .patch(`/api/bookings/${bookingId}/checkout`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(checkoutResponse.status).toBe(200);
      expect(checkoutResponse.body.data.bookingStatus).toBe('completed');
    });
  });

  describe('POST /api/bookings/customer - Date Validation', () => {
    let playerToken;
    let testPlayer;
    let weekdayTimeSlot;

    beforeAll(async () => {
      const Player = require('../models/player.model');
      
      // ลบ player เดิมถ้ามี
      await Player.deleteMany({ phone: '0888888888' });
      
      testPlayer = await Player.create({
        name: 'Test Player',
        phone: '0888888888',
        password: 'password123',
        status: 'active',
      });
      
      playerToken = jwt.sign({ id: testPlayer._id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });

      // สร้าง weekday time slot สำหรับ test
      weekdayTimeSlot = await TimeSlot.create({
        startTime: '10:00',
        endTime: '11:00',
        dayType: 'weekday',
        pricing: { normal: 150, member: 120 },
        peakPricing: { normal: 200, member: 170 },
        peakHour: false,
        status: 'active',
      });
    });

    afterAll(async () => {
      const Player = require('../models/player.model');
      await Player.deleteMany({ phone: '0888888888' });
      if (weekdayTimeSlot) {
        await TimeSlot.findByIdAndDelete(weekdayTimeSlot._id);
      }
    });

    it('should reject booking in the past', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const response = await request(app)
        .post('/api/bookings/customer')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          date: yesterday.toISOString().split('T')[0],
          timeSlot: weekdayTimeSlot._id.toString(),
          duration: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('วันที่ผ่านมาแล้ว');
    });

    it('should reject booking beyond advance booking limit', async () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 30);

      const response = await request(app)
        .post('/api/bookings/customer')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          date: farFuture.toISOString().split('T')[0],
          timeSlot: weekdayTimeSlot._id.toString(),
          duration: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ล่วงหน้าเกิน');
    });

    it('should reject booking with mismatched dayType', async () => {
      // หาวัน weekend ถัดไป
      const nextSaturday = new Date();
      const daysUntilSaturday = (6 - nextSaturday.getDay() + 7) % 7 || 7;
      nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);

      const response = await request(app)
        .post('/api/bookings/customer')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          date: nextSaturday.toISOString().split('T')[0],
          timeSlot: weekdayTimeSlot._id.toString(), // weekday slot กับ weekend date
          duration: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('วัน');
    });
  });
});
