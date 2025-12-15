const Booking = require('../models/booking.model');

/**
 * Cancel expired payment_pending bookings
 * Runs every 5 minutes
 */
const cancelExpiredBookings = async () => {
  try {
    const now = new Date();

    const result = await Booking.updateMany(
      {
        bookingStatus: 'payment_pending',
        paymentDeadline: { $lt: now },
        deletedAt: null,
      },
      {
        $set: {
          bookingStatus: 'cancelled',
          deletedAt: now,
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[CronJob] Cancelled ${result.modifiedCount} expired booking(s)`);
    }
  } catch (error) {
    console.error('[CronJob] Cancel expired bookings error:', error);
  }
};

/**
 * Start the cron job
 * @param {number} intervalMinutes - Interval in minutes (default: 5)
 */
const startCancelExpiredBookingsJob = (intervalMinutes = 5) => {
  // Run immediately on startup
  cancelExpiredBookings();

  // Then run every X minutes
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(cancelExpiredBookings, intervalMs);

  console.log(`[CronJob] Cancel expired bookings job started (every ${intervalMinutes} minutes)`);
};

module.exports = {
  cancelExpiredBookings,
  startCancelExpiredBookingsJob,
};
