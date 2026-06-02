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
const { createTestCourt } = require('./helpers/testSetup');

let adminToken, courtId, timeslotId1, timeslotId2;

// Monday 2026-06-08 เป็น weekday date คงที่สำหรับ test
const TEST_DATE = new Date('2026-06-08T00:00:00.000Z');
const TEST_DATE_2 = new Date('2026-06-09T00:00:00.000Z'); // Tuesday

const createBooking = (courtId, timeslotId, overrides = {}) =>
  Booking.create({
    bookingCode: `TST${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    customer: { name: 'Test Customer', phone: '0900000001' },
    court: courtId,
    timeSlot: timeslotId,
    date: TEST_DATE,
    duration: 1,
    startMinute: 0,
    bookingStatus: 'confirmed',
    paymentStatus: 'pending',
    pricing: { subtotal: 300, discount: 0, deposit: 0, total: 300 },
    deletedAt: null,
    ...overrides,
  });

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connection.asPromise();
  }

  await User.deleteMany({});
  await Court.deleteMany({});
  await TimeSlot.deleteMany({});
  await Booking.deleteMany({});

  const court = await createTestCourt();
  courtId = court._id;

  // สร้าง 2 timeslots ที่ต่อเนื่องกัน (weekday) สำหรับ conflict test และ duration-2 test
  const ts1 = await TimeSlot.create({
    startTime: '08:00',
    endTime: '09:00',
    dayType: 'weekday',
    pricing: { normal: 300, member: 250 },
    status: 'active',
  });
  const ts2 = await TimeSlot.create({
    startTime: '09:00',
    endTime: '10:00',
    dayType: 'weekday',
    pricing: { normal: 300, member: 250 },
    status: 'active',
  });
  timeslotId1 = ts1._id;
  timeslotId2 = ts2._id;

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

// ─── PATCH /:id (reschedule) ──────────────────────────────────────────────────

describe('PATCH /api/bookings/:id (reschedule)', () => {
  it('[RESCHEDULE] เปลี่ยน timeSlot สำเร็จ', async () => {
    const booking = await createBooking(courtId, timeslotId1);

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ timeSlot: timeslotId2.toString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const updated = await Booking.findById(booking._id);
    expect(updated.timeSlot.toString()).toBe(timeslotId2.toString());
  });

  it('[RESCHEDULE] เปลี่ยนวันที่สำเร็จ', async () => {
    const booking = await createBooking(courtId, timeslotId1);

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ date: TEST_DATE_2.toISOString().split('T')[0] });

    expect(res.status).toBe(200);
    const updated = await Booking.findById(booking._id);
    // วันที่ต้องเปลี่ยน (ต่างจาก TEST_DATE)
    expect(updated.date.toDateString()).not.toBe(TEST_DATE.toDateString());
  });

  it('[RESCHEDULE] คำนวณราคาใหม่เมื่อเปลี่ยน duration', async () => {
    const booking = await createBooking(courtId, timeslotId1);
    const originalTotal = booking.pricing.total; // 300

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ duration: 2 }); // ต้องใช้ ts1+ts2 ต่อเนื่องกัน

    expect(res.status).toBe(200);
    const updated = await Booking.findById(booking._id);
    expect(updated.duration).toBe(2);
    expect(updated.pricing.total).toBeGreaterThan(originalTotal);
  });

  it('[RESCHEDULE] ไม่เกิด self-conflict เมื่อส่ง timeSlot/duration เดิม', async () => {
    const booking = await createBooking(courtId, timeslotId1);

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ timeSlot: timeslotId1.toString(), duration: 1 });

    expect(res.status).toBe(200);
  });

  it('[RESCHEDULE] คืน 409 เมื่อ slot เป้าหมายถูกจองโดย booking อื่นบนสนามเดียวกัน', async () => {
    // blocking booking อยู่บน timeslot2 วันเดียวกัน
    await createBooking(courtId, timeslotId2);
    // booking ที่จะ reschedule อยู่บน timeslot1
    const booking = await createBooking(courtId, timeslotId1);

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ timeSlot: timeslotId2.toString() });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('[RESCHEDULE] คืน 400 เมื่อ booking เป็นส่วนหนึ่งของ recurring group', async () => {
    const fakeGroupId = new mongoose.Types.ObjectId();
    const booking = await createBooking(courtId, timeslotId1, { recurringGroupId: fakeGroupId });

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ date: TEST_DATE_2.toISOString().split('T')[0] });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('ไม่สามารถแก้ไขเวลาการจองในกลุ่มซ้ำ');
  });

  it('[RESCHEDULE] คืน 400 เมื่อ booking ยังไม่มีสนาม', async () => {
    const booking = await createBooking(courtId, timeslotId1);
    // ลบ court ออกจาก booking โดยตรง
    await Booking.findByIdAndUpdate(booking._id, { $unset: { court: '' } });

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ date: TEST_DATE_2.toISOString().split('T')[0] });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('กรุณากำหนดสนาม');
  });
});
