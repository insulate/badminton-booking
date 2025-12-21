const { isDateBlocked } = require('./blockedDateChecker');
const { checkAvailability } = require('./availabilityChecker');

/**
 * Generate all dates based on recurring pattern
 *
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Array<number>} daysOfWeek - Days to include [0-6] (0=Sunday, 6=Saturday)
 * @returns {Array<Date>} Array of dates
 */
const generateRecurringDates = (startDate, endDate, daysOfWeek) => {
  const dates = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const current = new Date(start);

  while (current <= end) {
    if (daysOfWeek.includes(current.getDay())) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Check availability for multiple dates (bulk check)
 *
 * @param {Object} params
 * @param {Array<Date>} params.dates - Dates to check
 * @param {ObjectId} params.courtId - Court ID
 * @param {ObjectId} params.timeSlotId - TimeSlot ID
 * @param {Number} params.duration - Duration in hours
 * @returns {Promise<Object>} { validDates, skippedDates }
 */
const checkBulkAvailability = async ({ dates, courtId, timeSlotId, duration }) => {
  const validDates = [];
  const skippedDates = [];

  for (const date of dates) {
    // Check if date is blocked
    const blockCheck = await isDateBlocked(date);
    if (blockCheck.isBlocked) {
      skippedDates.push({
        date,
        reason: 'blocked',
        detail: blockCheck.reason,
      });
      continue;
    }

    // Check court availability
    try {
      const availability = await checkAvailability({
        courtId,
        date,
        timeSlotId,
        duration,
      });

      if (!availability.available) {
        skippedDates.push({
          date,
          reason: 'conflict',
          detail: availability.message || 'สนามไม่ว่างในวันและเวลานี้',
        });
        continue;
      }

      validDates.push(date);
    } catch (error) {
      skippedDates.push({
        date,
        reason: 'conflict',
        detail: error.message || 'ไม่สามารถตรวจสอบความพร้อมได้',
      });
    }
  }

  return { validDates, skippedDates };
};

/**
 * Calculate total price for recurring bookings
 *
 * @param {Object} params
 * @param {Array<Date>} params.dates - Dates that will be booked
 * @param {ObjectId} params.timeSlotId - TimeSlot ID
 * @param {Number} params.duration - Duration in hours
 * @returns {Promise<Object>} { totalAmount, priceBreakdown }
 */
const calculateRecurringPrice = async ({ dates, timeSlotId, duration }) => {
  const TimeSlot = require('../models/timeslot.model');

  const timeSlot = await TimeSlot.findById(timeSlotId);
  if (!timeSlot) {
    throw new Error('TimeSlot not found');
  }

  let totalAmount = 0;
  const priceBreakdown = [];

  for (const date of dates) {
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Determine price based on day type and peak hour
    let pricePerHour;
    if (timeSlot.peakHour) {
      pricePerHour = timeSlot.peakPricing?.normal || timeSlot.pricing?.normal || 0;
    } else {
      pricePerHour = timeSlot.pricing?.normal || 0;
    }

    const dayPrice = pricePerHour * duration;
    totalAmount += dayPrice;

    priceBreakdown.push({
      date,
      dayOfWeek,
      isWeekend,
      isPeakHour: timeSlot.peakHour,
      pricePerHour,
      duration,
      subtotal: dayPrice,
    });
  }

  return { totalAmount, priceBreakdown };
};

/**
 * Validate recurring booking request
 *
 * @param {Object} params
 * @param {Array<number>} params.daysOfWeek - Days of week [0-6]
 * @param {Date} params.startDate - Start date
 * @param {Date} params.endDate - End date
 * @param {Number} params.maxMonths - Maximum months allowed (default: 3)
 * @returns {Object} { valid, errors }
 */
const validateRecurringRequest = ({ daysOfWeek, startDate, endDate, maxMonths = 3 }) => {
  const errors = [];

  // Validate daysOfWeek
  if (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
    errors.push('กรุณาเลือกวันที่ต้องการจองอย่างน้อย 1 วัน');
  } else {
    const invalidDays = daysOfWeek.filter((day) => !Number.isInteger(day) || day < 0 || day > 6);
    if (invalidDays.length > 0) {
      errors.push('วันที่เลือกไม่ถูกต้อง');
    }
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime())) {
    errors.push('วันเริ่มต้นไม่ถูกต้อง');
  }

  if (isNaN(end.getTime())) {
    errors.push('วันสิ้นสุดไม่ถูกต้อง');
  }

  if (start < today) {
    errors.push('วันเริ่มต้นต้องไม่น้อยกว่าวันนี้');
  }

  if (end < start) {
    errors.push('วันสิ้นสุดต้องมากกว่าหรือเท่ากับวันเริ่มต้น');
  }

  // Validate max duration (3 months)
  const maxEndDate = new Date(start);
  maxEndDate.setMonth(maxEndDate.getMonth() + maxMonths);

  if (end > maxEndDate) {
    errors.push(`ระยะเวลาการจองต้องไม่เกิน ${maxMonths} เดือน`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Get day name in Thai
 *
 * @param {number} dayOfWeek - Day of week (0-6)
 * @returns {string} Day name in Thai
 */
const getDayNameThai = (dayOfWeek) => {
  const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  return dayNames[dayOfWeek] || '';
};

/**
 * Get day names for selected days
 *
 * @param {Array<number>} daysOfWeek - Days of week [0-6]
 * @returns {string} Comma-separated day names
 */
const getDaysOfWeekDisplay = (daysOfWeek) => {
  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  return daysOfWeek.map((day) => dayNames[day]).join(', ');
};

module.exports = {
  generateRecurringDates,
  checkBulkAvailability,
  calculateRecurringPrice,
  validateRecurringRequest,
  getDayNameThai,
  getDaysOfWeekDisplay,
};
