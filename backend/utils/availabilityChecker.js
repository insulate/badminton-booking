const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');

/**
 * Check if a court is available for booking
 *
 * @param {Object} params
 * @param {ObjectId} params.courtId - Court ID
 * @param {Date} params.date - Booking date
 * @param {ObjectId} params.timeSlotId - TimeSlot ID
 * @param {ObjectId} params.excludeBookingId - Exclude this booking ID (for updates)
 * @returns {Promise<Object>} { available: Boolean, conflictingBooking: Object }
 */
const checkAvailability = async ({ courtId, date, timeSlotId, excludeBookingId = null }) => {
  try {
    // Validate inputs
    if (!courtId || !date || !timeSlotId) {
      throw new Error('Court ID, date, and timeSlot ID are required');
    }

    // Normalize date to start of day
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // Build query
    const query = {
      court: courtId,
      date: bookingDate,
      timeSlot: timeSlotId,
      deletedAt: null,
      bookingStatus: { $ne: 'cancelled' }, // Exclude cancelled bookings
    };

    // Exclude specific booking (for update operations)
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne(query)
      .populate('court', 'courtNumber name')
      .populate('timeSlot', 'startTime endTime')
      .populate('customer.name customer.phone');

    return {
      available: !conflictingBooking,
      conflictingBooking: conflictingBooking || null,
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
};

/**
 * Get all available courts for a specific date and timeslot
 *
 * @param {Object} params
 * @param {Date} params.date - Booking date
 * @param {ObjectId} params.timeSlotId - TimeSlot ID
 * @param {String} params.courtType - Filter by court type (optional)
 * @returns {Promise<Array>} Array of available courts
 */
const getAvailableCourts = async ({ date, timeSlotId, courtType = null }) => {
  try {
    // Validate inputs
    if (!date || !timeSlotId) {
      throw new Error('Date and timeSlot ID are required');
    }

    // Normalize date to start of day
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // Get all active courts
    const courtQuery = {
      deletedAt: null,
      status: 'available',
    };

    if (courtType) {
      courtQuery.type = courtType;
    }

    const allCourts = await Court.find(courtQuery).sort({ courtNumber: 1 });

    // Get all booked court IDs for this date and timeslot
    const bookedCourts = await Booking.find({
      date: bookingDate,
      timeSlot: timeSlotId,
      deletedAt: null,
      bookingStatus: { $ne: 'cancelled' },
    }).distinct('court');

    // Filter out booked courts
    const availableCourts = allCourts.filter(
      (court) => !bookedCourts.some((bookedCourtId) => bookedCourtId.equals(court._id))
    );

    return availableCourts;
  } catch (error) {
    console.error('Error getting available courts:', error);
    throw error;
  }
};

/**
 * Get court availability schedule for a specific date
 *
 * @param {Date} date - Date to check
 * @param {String} dayType - 'weekday' or 'weekend'
 * @returns {Promise<Object>} Court availability grid
 */
const getCourtSchedule = async (date, dayType) => {
  try {
    // Normalize date to start of day
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // Get all active courts
    const courts = await Court.find({
      deletedAt: null,
      status: 'available',
    }).sort({ courtNumber: 1 });

    // Get all active timeslots for the day type
    const timeSlots = await TimeSlot.find({
      deletedAt: null,
      status: 'active',
      dayType: dayType,
    }).sort({ startTime: 1 });

    // Get all bookings for this date
    const bookings = await Booking.find({
      date: bookingDate,
      deletedAt: null,
      bookingStatus: { $ne: 'cancelled' },
    })
      .populate('court', 'courtNumber name')
      .populate('timeSlot', 'startTime endTime')
      .populate('customer.name customer.phone');

    // Build schedule grid
    const schedule = courts.map((court) => {
      const courtSlots = timeSlots.map((timeSlot) => {
        // Find booking for this court and timeslot
        const booking = bookings.find(
          (b) =>
            b.court._id.equals(court._id) && b.timeSlot._id.equals(timeSlot._id)
        );

        return {
          timeSlotId: timeSlot._id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          peakHour: timeSlot.peakHour,
          available: !booking,
          booking: booking
            ? {
                bookingId: booking._id,
                bookingCode: booking.bookingCode,
                customerName: booking.customer.name,
                bookingStatus: booking.bookingStatus,
                paymentStatus: booking.paymentStatus,
              }
            : null,
        };
      });

      return {
        courtId: court._id,
        courtNumber: court.courtNumber,
        courtName: court.name,
        courtType: court.type,
        slots: courtSlots,
      };
    });

    return {
      date: bookingDate,
      dayType,
      courts: schedule,
      timeSlots: timeSlots.map((ts) => ({
        timeSlotId: ts._id,
        startTime: ts.startTime,
        endTime: ts.endTime,
        peakHour: ts.peakHour,
      })),
    };
  } catch (error) {
    console.error('Error getting court schedule:', error);
    throw error;
  }
};

module.exports = {
  checkAvailability,
  getAvailableCourts,
  getCourtSchedule,
};
