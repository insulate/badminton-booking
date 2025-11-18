const Booking = require('../models/booking.model');

/**
 * Generate unique booking code
 * Format: BK{YYYYMMDD}{0001}
 * Example: BK202501180001
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

    // Find the latest booking code for today
    const latestBooking = await Booking.findOne({
      bookingCode: new RegExp(`^${prefix}${dateStr}`),
    })
      .sort({ bookingCode: -1 })
      .select('bookingCode');

    let runningNumber = 1;

    if (latestBooking) {
      // Extract running number from the latest booking code
      const lastNumber = parseInt(latestBooking.bookingCode.slice(-4));
      runningNumber = lastNumber + 1;
    }

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
