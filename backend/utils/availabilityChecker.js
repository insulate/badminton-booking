const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');
const GroupPlay = require('../models/groupplay.model');

/**
 * Check if a court is available for booking
 *
 * @param {Object} params
 * @param {ObjectId} params.courtId - Court ID
 * @param {Date} params.date - Booking date
 * @param {ObjectId} params.timeSlotId - TimeSlot ID
 * @param {Number} params.duration - Duration in hours (default: 1)
 * @param {ObjectId} params.excludeBookingId - Exclude this booking ID (for updates)
 * @returns {Promise<Object>} { available: Boolean, conflictingBooking: Object }
 */
const checkAvailability = async ({ courtId, date, timeSlotId, duration = 1, excludeBookingId = null }) => {
  try {
    // Validate inputs
    if (!courtId || !date || !timeSlotId) {
      throw new Error('Court ID, date, and timeSlot ID are required');
    }

    // Normalize date to start of day
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // Get the starting timeslot
    const startTimeSlot = await TimeSlot.findById(timeSlotId);
    if (!startTimeSlot) {
      throw new Error('TimeSlot not found');
    }

    // Check if time is blocked by Group Play rules
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][bookingDate.getDay()];
    const isBlocked = await GroupPlay.isTimeSlotBlocked(courtId, dayOfWeek, startTimeSlot.startTime);

    if (isBlocked) {
      return {
        available: false,
        conflictingBooking: null,
        message: 'สนามถูกบล็อกโดยระบบตีก๊วนในช่วงเวลานี้',
      };
    }

    // Get all timeslots for this day type sorted by time
    const allTimeSlots = await TimeSlot.find({
      deletedAt: null,
      status: 'active',
      dayType: startTimeSlot.dayType,
    }).sort({ startTime: 1 });

    // Find the starting index
    const startIndex = allTimeSlots.findIndex((ts) => ts._id.equals(timeSlotId));
    if (startIndex === -1) {
      throw new Error('TimeSlot not found in active slots');
    }

    // Check if we have enough consecutive slots
    if (startIndex + duration > allTimeSlots.length) {
      return {
        available: false,
        conflictingBooking: null,
        message: 'Not enough consecutive time slots available',
      };
    }

    // Validate that timeslots are actually consecutive (no gaps)
    const slotsNeeded = allTimeSlots.slice(startIndex, startIndex + duration);
    for (let i = 0; i < slotsNeeded.length - 1; i++) {
      const currentSlot = slotsNeeded[i];
      const nextSlot = slotsNeeded[i + 1];

      // Check if current slot's endTime matches next slot's startTime
      if (currentSlot.endTime !== nextSlot.startTime) {
        return {
          available: false,
          conflictingBooking: null,
          message: `Time slots are not consecutive. Gap between ${currentSlot.endTime} and ${nextSlot.startTime}`,
        };
      }
    }

    // Get the timeslot IDs we need to check
    const timeSlotsToCheck = slotsNeeded.map((ts) => ts._id);

    // Get all bookings for this court and date
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      court: courtId,
      date: { $gte: bookingDate, $lte: endOfDay },
      deletedAt: null,
      bookingStatus: { $ne: 'cancelled' },
      ...(excludeBookingId && { _id: { $ne: excludeBookingId } }),
    })
      .populate('court', 'courtNumber name')
      .populate('timeSlot', 'startTime endTime');

    // Create a set of all occupied timeslot IDs (considering duration)
    const occupiedSlots = new Set();
    bookings.forEach((booking) => {
      const bookingStartIndex = allTimeSlots.findIndex((ts) => ts._id.equals(booking.timeSlot._id));
      if (bookingStartIndex !== -1) {
        // Mark all slots covered by this booking's duration
        for (let i = 0; i < booking.duration && bookingStartIndex + i < allTimeSlots.length; i++) {
          occupiedSlots.add(allTimeSlots[bookingStartIndex + i]._id.toString());
        }
      }
    });

    // Check if any of our required slots are occupied
    const conflictingSlotId = timeSlotsToCheck.find((slotId) => occupiedSlots.has(slotId.toString()));

    if (conflictingSlotId) {
      // Find the booking that conflicts
      const conflictingBooking = bookings.find((booking) => {
        const bookingStartIndex = allTimeSlots.findIndex((ts) => ts._id.equals(booking.timeSlot._id));
        if (bookingStartIndex !== -1) {
          for (let i = 0; i < booking.duration; i++) {
            if (allTimeSlots[bookingStartIndex + i]._id.equals(conflictingSlotId)) {
              return true;
            }
          }
        }
        return false;
      });

      return {
        available: false,
        conflictingBooking: conflictingBooking || null,
      };
    }

    return {
      available: true,
      conflictingBooking: null,
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

    // Calculate day of week for Group Play blocking check
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][bookingDate.getDay()];

    // Get the time slot to check start time
    const timeSlot = await TimeSlot.findById(timeSlotId);
    if (!timeSlot) {
      throw new Error('TimeSlot not found');
    }

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

    // Filter out booked courts and courts blocked by Group Play
    const availableCourts = await Promise.all(
      allCourts.map(async (court) => {
        // Check if booked
        const isBooked = bookedCourts.some((bookedCourtId) => bookedCourtId.equals(court._id));
        if (isBooked) {
          return null;
        }

        // Check if blocked by Group Play
        const isBlockedByGroupPlay = await GroupPlay.isTimeSlotBlocked(
          court._id,
          dayOfWeek,
          timeSlot.startTime
        );
        if (isBlockedByGroupPlay) {
          return null;
        }

        return court;
      })
    );

    // Filter out null values (booked or blocked courts)
    return availableCourts.filter((court) => court !== null);
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

    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Calculate day of week for Group Play blocking check
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][bookingDate.getDay()];

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
      date: { $gte: bookingDate, $lte: endOfDay },
      deletedAt: null,
      bookingStatus: { $ne: 'cancelled' },
    })
      .populate('court', 'courtNumber name')
      .populate('timeSlot', 'startTime endTime');

    // Build schedule grid
    const schedule = await Promise.all(
      courts.map(async (court) => {
        // Create a map to track which timeslots are booked for this court
        const bookedSlots = new Map(); // key: timeSlotId, value: booking

        // Process all bookings for this court
        bookings
          .filter((b) => b.court && b.court._id.equals(court._id))
          .forEach((booking) => {
            // Find the starting timeslot index
            const startIndex = timeSlots.findIndex((ts) =>
              booking.timeSlot && ts._id.equals(booking.timeSlot._id)
            );

            if (startIndex !== -1) {
              // Mark the starting slot and all consecutive slots based on duration
              for (let i = 0; i < booking.duration && startIndex + i < timeSlots.length; i++) {
                const slot = timeSlots[startIndex + i];
                bookedSlots.set(slot._id.toString(), booking);
              }
            }
          });

        // Map each timeslot with availability info (check Group Play blocking)
        const courtSlots = await Promise.all(
          timeSlots.map(async (timeSlot) => {
            const booking = bookedSlots.get(timeSlot._id.toString());

            // Check if time slot is blocked by Group Play
            const isBlockedByGroupPlay = await GroupPlay.isTimeSlotBlocked(
              court._id,
              dayOfWeek,
              timeSlot.startTime
            );

            return {
              timeSlotId: timeSlot._id,
              startTime: timeSlot.startTime,
              endTime: timeSlot.endTime,
              peakHour: timeSlot.peakHour,
              available: !booking && !isBlockedByGroupPlay,
              blockedByGroupPlay: isBlockedByGroupPlay,
              booking: booking
                ? {
                    bookingId: booking._id,
                    bookingCode: booking.bookingCode,
                    customerName: booking.customer.name,
                    customerPhone: booking.customer.phone,
                    bookingStatus: booking.bookingStatus,
                    paymentStatus: booking.paymentStatus,
                  }
                : null,
            };
          })
        );

        return {
          courtId: court._id,
          courtNumber: court.courtNumber,
          courtName: court.name,
          courtType: court.type,
          slots: courtSlots,
        };
      })
    );

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
