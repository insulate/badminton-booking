const Counter = require('../models/counter.model');

/**
 * Generate unique booking code using atomic counter
 * Format: BK{YYYYMMDD}{0001}
 * Example: BK202501180001
 *
 * This implementation uses MongoDB's atomic findAndModify operation
 * to prevent race conditions when multiple bookings are created simultaneously.
 *
 * @param {Date} date - Booking date
 * @returns {Promise<string>} Generated booking code
 */
const generateBookingCode = async (date = new Date()) => {
  try {
    // Format date as YYYYMMDD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Prefix for booking code
    const prefix = 'BK';

    // Counter name for this date (resets daily)
    const counterName = `booking-${prefix}${dateStr}`;

    // Get next sequence number atomically (thread-safe)
    // This prevents race conditions by using MongoDB's atomic $inc operation
    const runningNumber = await Counter.getNextSequence(counterName);

    // Generate new booking code
    const bookingCode = `${prefix}${dateStr}${String(runningNumber).padStart(4, '0')}`;

    return bookingCode;
  } catch (error) {
    console.error('Error generating booking code:', error);
    throw new Error('Failed to generate booking code');
  }
};

module.exports = {
  generateBookingCode,
};
