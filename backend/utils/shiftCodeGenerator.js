const Counter = require('../models/counter.model');

/**
 * Generate unique shift code using atomic counter
 * Format: SH{YYYYMMDD}{0001}
 * Example: SH202501180001
 *
 * This implementation uses MongoDB's atomic findAndModify operation
 * to prevent race conditions when multiple shifts are created simultaneously.
 *
 * @param {Date} date - Shift date
 * @returns {Promise<string>} Generated shift code
 */
const generateShiftCode = async (date = new Date()) => {
  try {
    // Format date as YYYYMMDD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Prefix for shift code
    const prefix = 'SH';

    // Counter name for this date (resets daily)
    const counterName = `shift-${prefix}${dateStr}`;

    // Get next sequence number atomically (thread-safe)
    // This prevents race conditions by using MongoDB's atomic $inc operation
    const runningNumber = await Counter.getNextSequence(counterName);

    // Generate new shift code
    const shiftCode = `${prefix}${dateStr}${String(runningNumber).padStart(4, '0')}`;

    return shiftCode;
  } catch (error) {
    console.error('Error generating shift code:', error);
    throw new Error('Failed to generate shift code');
  }
};

module.exports = {
  generateShiftCode,
};
