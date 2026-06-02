const mongoose = require('mongoose');
const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');
const { cancelExpiredBookings } = require('../jobs/cancelExpiredBookings');
const {
  connectTestDB,
  disconnectTestDB,
  createTestCourt,
  createTestTimeslot,
  createExpiredBooking,
} = require('./helpers/testSetup');

let courtId, timeslotId;

beforeAll(async () => {
  await connectTestDB();
  await Booking.deleteMany({});
  await Court.deleteMany({});
  await TimeSlot.deleteMany({});

  const court = await createTestCourt();
  const timeslot = await createTestTimeslot();
  courtId = court._id;
  timeslotId = timeslot._id;
});

afterEach(async () => {
  await Booking.deleteMany({});
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('cancelExpiredBookings()', () => {
  it('cancels expired booking with no slip', async () => {
    const booking = await createExpiredBooking(courtId, timeslotId);

    await cancelExpiredBookings();

    const updated = await Booking.findById(booking._id);
    expect(updated.bookingStatus).toBe('cancelled');
    expect(updated.deletedAt).not.toBeNull();
  });

  it('sets deletedAt timestamp when cancelling', async () => {
    const before = new Date();
    const booking = await createExpiredBooking(courtId, timeslotId);

    await cancelExpiredBookings();

    const updated = await Booking.findById(booking._id);
    expect(updated.deletedAt).toBeInstanceOf(Date);
    expect(updated.deletedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('cancels expired booking with rejected slip', async () => {
    const booking = await createExpiredBooking(courtId, timeslotId, {
      paymentSlip: { status: 'rejected', image: 'slip.jpg', rejectReason: 'invalid' },
    });

    await cancelExpiredBookings();

    const updated = await Booking.findById(booking._id);
    expect(updated.bookingStatus).toBe('cancelled');
  });

  it('[BUG FIX] does NOT cancel expired booking with pending_verification slip', async () => {
    const booking = await createExpiredBooking(courtId, timeslotId, {
      paymentSlip: {
        status: 'pending_verification',
        image: 'slip.jpg',
        uploadedAt: new Date(),
      },
    });

    await cancelExpiredBookings();

    const updated = await Booking.findById(booking._id);
    expect(updated.bookingStatus).toBe('payment_pending');
    expect(updated.deletedAt).toBeNull();
  });

  it('does NOT cancel booking before deadline', async () => {
    const futureDeadline = new Date(Date.now() + 10 * 60 * 1000);
    const booking = await createExpiredBooking(courtId, timeslotId, {
      paymentDeadline: futureDeadline,
    });

    await cancelExpiredBookings();

    const updated = await Booking.findById(booking._id);
    expect(updated.bookingStatus).toBe('payment_pending');
    expect(updated.deletedAt).toBeNull();
  });

  it('does NOT cancel already confirmed booking', async () => {
    const booking = await createExpiredBooking(courtId, timeslotId, {
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
    });

    await cancelExpiredBookings();

    const updated = await Booking.findById(booking._id);
    expect(updated.bookingStatus).toBe('confirmed');
    expect(updated.deletedAt).toBeNull();
  });

  it('cancels multiple expired bookings in one run', async () => {
    await Promise.all([
      createExpiredBooking(courtId, timeslotId),
      createExpiredBooking(courtId, timeslotId),
      createExpiredBooking(courtId, timeslotId),
    ]);

    await cancelExpiredBookings();

    const remaining = await Booking.find({ bookingStatus: 'payment_pending', deletedAt: null });
    expect(remaining).toHaveLength(0);
  });
});
