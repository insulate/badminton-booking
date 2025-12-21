const Counter = require('../models/counter.model');

/**
 * Generate unique recurring booking group code using atomic counter
 * Format: RG{YYYYMMDD}{0001}
 * Example: RG202512210001
 *
 * @param {Date} date - Creation date
 * @returns {Promise<string>} Generated group code
 */
const generateGroupCode = async (date = new Date()) => {
  try {
    // Format date as YYYYMMDD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // Prefix for group code
    const prefix = 'RG';

    // Counter name for this date (resets daily)
    const counterName = `recurring-group-${prefix}${dateStr}`;

    // Get next sequence number atomically (thread-safe)
    const runningNumber = await Counter.getNextSequence(counterName);

    // Generate new group code
    const groupCode = `${prefix}${dateStr}${String(runningNumber).padStart(4, '0')}`;

    return groupCode;
  } catch (error) {
    console.error('Error generating group code:', error);
    throw new Error('Failed to generate group code');
  }
};

module.exports = {
  generateGroupCode,
};
