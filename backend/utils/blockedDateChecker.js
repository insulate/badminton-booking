const Setting = require('../models/setting.model');

/**
 * Check if a specific date is blocked
 * @param {Date|string} date - The date to check
 * @returns {Promise<{isBlocked: boolean, reason: string|null}>}
 */
const isDateBlocked = async (date) => {
  try {
    const settings = await Setting.getSettings();
    const blockedDates = settings.booking?.blockedDates || [];

    if (blockedDates.length === 0) {
      return { isBlocked: false, reason: null };
    }

    // Normalize the input date to start of day (midnight)
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Find if the date is blocked
    const blockedEntry = blockedDates.find((entry) => {
      const blockedDate = new Date(entry.date);
      blockedDate.setHours(0, 0, 0, 0);
      return blockedDate.getTime() === checkDate.getTime();
    });

    if (blockedEntry) {
      return {
        isBlocked: true,
        reason: blockedEntry.reason || 'วันนี้ไม่เปิดให้จอง',
      };
    }

    return { isBlocked: false, reason: null };
  } catch (error) {
    console.error('Error checking blocked date:', error);
    throw error;
  }
};

/**
 * Get all blocked dates within a date range
 * @param {Date|string} startDate - Start of range
 * @param {Date|string} endDate - End of range
 * @returns {Promise<Array<{date: Date, reason: string}>>}
 */
const getBlockedDatesInRange = async (startDate, endDate) => {
  try {
    const settings = await Setting.getSettings();
    const blockedDates = settings.booking?.blockedDates || [];

    if (blockedDates.length === 0) {
      return [];
    }

    // Normalize dates
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Filter blocked dates within range
    return blockedDates
      .filter((entry) => {
        const blockedDate = new Date(entry.date);
        return blockedDate >= start && blockedDate <= end;
      })
      .map((entry) => ({
        date: entry.date,
        reason: entry.reason || 'วันนี้ไม่เปิดให้จอง',
      }));
  } catch (error) {
    console.error('Error getting blocked dates in range:', error);
    throw error;
  }
};

/**
 * Get all blocked dates
 * @returns {Promise<Array<{date: Date, reason: string, createdAt: Date}>>}
 */
const getAllBlockedDates = async () => {
  try {
    const settings = await Setting.getSettings();
    const blockedDates = settings.booking?.blockedDates || [];

    return blockedDates.map((entry) => ({
      date: entry.date,
      reason: entry.reason || '',
      createdAt: entry.createdAt,
    }));
  } catch (error) {
    console.error('Error getting all blocked dates:', error);
    throw error;
  }
};

module.exports = {
  isDateBlocked,
  getBlockedDatesInRange,
  getAllBlockedDates,
};
