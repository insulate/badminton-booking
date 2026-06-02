// Set test env vars BEFORE requiring any modules that touch mongoose/app
process.env.MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/badminton-test?authSource=admin';
process.env.NODE_ENV = 'test';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-secret-key';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');
const Booking = require('../models/booking.model');
const { createTestCourt, createTestTimeslot, createExpiredBooking } = require('./helpers/testSetup');

let adminToken, courtId, timeslotId;

beforeAll(async () => {
  // app.js calls connectDB() (async, not awaited) — wait for it here
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connection.asPromise();
  }

  await User.deleteMany({});
  await Court.deleteMany({});
  await TimeSlot.deleteMany({});
  await Booking.deleteMany({});

  const court = await createTestCourt();
  const timeslot = await createTestTimeslot();
  courtId = court._id;
  timeslotId = timeslot._id;

  // User model pre-save hook hashes the password — pass plain text
  await User.create({
    username: 'testadmin',
    password: 'testpass123',
    name: 'Test Admin',
    role: 'admin',
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'testadmin', password: 'testpass123' });

  adminToken = loginRes.body.data.token;
});

afterEach(async () => {
  await Booking.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// ─── PATCH /:id/verify-slip ──────────────────────────────────────────────────

describe('PATCH /api/bookings/:id/verify-slip', () => {
  const makeBookingWithSlip = (overrides = {}) =>
    createExpiredBooking(courtId, timeslotId, {
      paymentSlip: {
        status: 'pending_verification',
        image: 'test-slip.jpg',
        uploadedAt: new Date(),
      },
      ...overrides,
    });

  it('[BUG FIX] sets bookingStatus to confirmed when action is verify', async () => {
    const booking = await makeBookingWithSlip();

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}/verify-slip`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'verify' });

    expect(res.status).toBe(200);
    const updated = await Booking.findById(booking._id);
    expect(updated.bookingStatus).toBe('confirmed');
  });

  it('sets paymentStatus to paid when action is verify', async () => {
    const booking = await makeBookingWithSlip();

    await request(app)
      .patch(`/api/bookings/${booking._id}/verify-slip`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'verify' });

    const updated = await Booking.findById(booking._id);
    expect(updated.paymentStatus).toBe('paid');
  });

  it('sets paymentSlip.status to verified when action is verify', async () => {
    const booking = await makeBookingWithSlip();

    await request(app)
      .patch(`/api/bookings/${booking._id}/verify-slip`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'verify' });

    const updated = await Booking.findById(booking._id);
    expect(updated.paymentSlip.status).toBe('verified');
  });

  it('keeps bookingStatus as payment_pending when action is reject', async () => {
    const booking = await makeBookingWithSlip();

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}/verify-slip`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'reject', rejectReason: 'ยอดเงินไม่ถูกต้อง' });

    expect(res.status).toBe(200);
    const updated = await Booking.findById(booking._id);
    expect(updated.bookingStatus).toBe('payment_pending');
    expect(updated.paymentSlip.status).toBe('rejected');
  });

  it('returns 401 without auth token', async () => {
    const booking = await makeBookingWithSlip();

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}/verify-slip`)
      .send({ action: 'verify' });

    expect(res.status).toBe(401);
  });
});

// ─── PATCH /:id/payment ──────────────────────────────────────────────────────

describe('PATCH /api/bookings/:id/payment', () => {
  it('[BUG FIX] sets bookingStatus to confirmed when fully paid from payment_pending', async () => {
    const booking = await createExpiredBooking(courtId, timeslotId, {
      pricing: { subtotal: 300, discount: 0, deposit: 0, total: 300 },
      paymentStatus: 'pending',
    });

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}/payment`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amountPaid: 300, paymentMethod: 'cash' });

    expect(res.status).toBe(200);
    const updated = await Booking.findById(booking._id);
    expect(updated.bookingStatus).toBe('confirmed');
    expect(updated.paymentStatus).toBe('paid');
  });

  it('does NOT change bookingStatus when booking is already confirmed', async () => {
    const booking = await createExpiredBooking(courtId, timeslotId, {
      bookingStatus: 'confirmed',
      pricing: { subtotal: 300, discount: 0, deposit: 0, total: 300 },
      paymentStatus: 'pending',
    });

    await request(app)
      .patch(`/api/bookings/${booking._id}/payment`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amountPaid: 300, paymentMethod: 'cash' });

    const updated = await Booking.findById(booking._id);
    expect(updated.bookingStatus).toBe('confirmed');
  });

  it('does NOT change bookingStatus to confirmed on partial payment', async () => {
    const booking = await createExpiredBooking(courtId, timeslotId, {
      pricing: { subtotal: 300, discount: 0, deposit: 0, total: 300 },
      paymentStatus: 'pending',
    });

    await request(app)
      .patch(`/api/bookings/${booking._id}/payment`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amountPaid: 100, paymentMethod: 'cash' });

    const updated = await Booking.findById(booking._id);
    expect(updated.bookingStatus).toBe('payment_pending');
    expect(updated.paymentStatus).toBe('partial');
  });

  it('updates paymentStatus to partial on partial payment', async () => {
    const booking = await createExpiredBooking(courtId, timeslotId, {
      pricing: { subtotal: 300, discount: 0, deposit: 0, total: 300 },
    });

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}/payment`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amountPaid: 150, paymentMethod: 'transfer' });

    expect(res.status).toBe(200);
    const updated = await Booking.findById(booking._id);
    expect(updated.paymentStatus).toBe('partial');
  });
});
