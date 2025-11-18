const TimeSlot = require('../models/timeslot.model');

/**
 * Calculate booking price
 *
 * @param {Object} params
 * @param {ObjectId} params.timeSlotId - TimeSlot ID
 * @param {Number} params.duration - Duration in hours (1-8)
 * @param {String} params.customerType - 'normal' or 'member'
 * @param {Number} params.discountPercent - Discount percentage (0-100)
 * @param {Number} params.depositAmount - Deposit amount
 * @returns {Promise<Object>} Pricing details { subtotal, discount, deposit, total }
 */
const calculatePrice = async ({
  timeSlotId,
  duration = 1,
  customerType = 'normal',
  discountPercent = 0,
  depositAmount = 0,
}) => {
  try {
    // Validate inputs
    if (!timeSlotId) {
      throw new Error('TimeSlot ID is required');
    }

    if (duration < 1 || duration > 8) {
      throw new Error('Duration must be between 1 and 8 hours');
    }

    if (!['normal', 'member'].includes(customerType)) {
      throw new Error('Customer type must be "normal" or "member"');
    }

    if (discountPercent < 0 || discountPercent > 100) {
      throw new Error('Discount percent must be between 0 and 100');
    }

    // Get timeslot
    const timeSlot = await TimeSlot.findById(timeSlotId);

    if (!timeSlot) {
      throw new Error('TimeSlot not found');
    }

    if (timeSlot.status !== 'active') {
      throw new Error('TimeSlot is not active');
    }

    // Determine price based on peak hour and customer type
    let pricePerHour;

    if (timeSlot.peakHour) {
      // Use peak pricing
      pricePerHour =
        customerType === 'member'
          ? timeSlot.peakPricing.member
          : timeSlot.peakPricing.normal;
    } else {
      // Use regular pricing
      pricePerHour =
        customerType === 'member' ? timeSlot.pricing.member : timeSlot.pricing.normal;
    }

    // Calculate subtotal
    const subtotal = pricePerHour * duration;

    // Calculate discount
    const discount = Math.round((subtotal * discountPercent) / 100);

    // Calculate total
    const total = subtotal - discount;

    // Validate deposit
    const deposit = depositAmount > total ? total : depositAmount;

    return {
      subtotal,
      discount,
      deposit,
      total,
      pricePerHour,
      isPeakHour: timeSlot.peakHour,
    };
  } catch (error) {
    console.error('Error calculating price:', error);
    throw error;
  }
};

/**
 * Calculate price for multiple hours (for display purposes)
 *
 * @param {ObjectId} timeSlotId - TimeSlot ID
 * @param {String} customerType - 'normal' or 'member'
 * @returns {Promise<Array>} Array of pricing for 1-8 hours
 */
const calculatePriceTable = async (timeSlotId, customerType = 'normal') => {
  try {
    const priceTable = [];

    for (let duration = 1; duration <= 8; duration++) {
      const pricing = await calculatePrice({
        timeSlotId,
        duration,
        customerType,
      });

      priceTable.push({
        duration,
        ...pricing,
      });
    }

    return priceTable;
  } catch (error) {
    console.error('Error calculating price table:', error);
    throw error;
  }
};

module.exports = {
  calculatePrice,
  calculatePriceTable,
};
