const mongoose = require('mongoose');
const Court = require('../../models/court.model');
const TimeSlot = require('../../models/timeslot.model');
const Booking = require('../../models/booking.model');

const TEST_DB = 'mongodb://admin:admin123@localhost:27017/badminton-test?authSource=admin';

const connectTestDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB);
  } else if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
  }
};

const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

const createTestCourt = () =>
  Court.create({ courtNumber: 'T01', name: 'Test Court', status: 'available' });

const createTestTimeslot = () =>
  TimeSlot.create({
    startTime: '08:00',
    endTime: '09:00',
    dayType: 'weekday',
    pricing: { normal: 300, member: 250 },
  });

// Factory: expired payment_pending booking (default: no slip)
const createExpiredBooking = (courtId, timeslotId, overrides = {}) => {
  const pastDeadline = new Date(Date.now() - 10 * 60 * 1000);
  const code = `TEST${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  return Booking.create({
    bookingCode: code,
    customer: { name: 'Test Customer', phone: '0900000001' },
    court: courtId,
    timeSlot: timeslotId,
    date: new Date(),
    duration: 1,
    startMinute: 0,
    bookingStatus: 'payment_pending',
    paymentStatus: 'pending',
    paymentDeadline: pastDeadline,
    pricing: { subtotal: 300, discount: 0, deposit: 0, total: 300 },
    paymentSlip: { status: 'none' },
    deletedAt: null,
    ...overrides,
  });
};

module.exports = {
  connectTestDB,
  disconnectTestDB,
  createTestCourt,
  createTestTimeslot,
  createExpiredBooking,
};
