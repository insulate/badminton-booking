const Counter = require('../models/counter.model');

/**
 * Generate unique sale code using atomic counter
 * Format: SL{YYYYMMDD}{0001}
 * Example: SL202501180001
 *
 * This implementation uses MongoDB's atomic findAndModify operation
 * to prevent race conditions when multiple sales are created simultaneously.
 *
 * @param {Date} date - Sale date
 * @returns {Promise<string>} Generated sale code
 */
const generateSaleCode = async (date = new Date()) => {
  try {
    // Format date as YYYYMMDD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Prefix for sale code
    const prefix = 'SL';

    // Counter name for this date (resets daily)
    const counterName = `sale-${prefix}${dateStr}`;

    // Get next sequence number atomically (thread-safe)
    // This prevents race conditions by using MongoDB's atomic $inc operation
    const runningNumber = await Counter.getNextSequence(counterName);

    // Generate new sale code
    const saleCode = `${prefix}${dateStr}${String(runningNumber).padStart(4, '0')}`;

    return saleCode;
  } catch (error) {
    console.error('Error generating sale code:', error);
    throw new Error('Failed to generate sale code');
  }
};

module.exports = {
  generateSaleCode,
};
