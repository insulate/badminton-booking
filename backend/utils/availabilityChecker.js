const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');
const GroupPlay = require('../models/groupplay.model');
const { isDateBlocked } = require('./blockedDateChecker');

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
const checkAvailability = async ({ courtId, date, timeSlotId, duration = 1, startMinute = 0, excludeBookingId = null }) => {
  try {
    // Validate inputs
    if (!courtId || !date || !timeSlotId) {
      throw new Error('Court ID, date, and timeSlot ID are required');
    }

    // Normalize date to start of day
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // Calculate day of week for Group Play blocking check
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][bookingDate.getDay()];

    // Get the starting timeslot
    const startTimeSlot = await TimeSlot.findById(timeSlotId);
    if (!startTimeSlot) {
      throw new Error('TimeSlot not found');
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

    // Calculate half-slot requirements
    const halfSlotsNeeded = duration * 2;
    const startHalf = startMinute === 30 ? 1 : 0;
    const totalHalfsFromStart = startHalf + halfSlotsNeeded;
    const slotsToSpan = Math.ceil(totalHalfsFromStart / 2);

    // Check if we have enough consecutive slots
    if (startIndex + slotsToSpan > allTimeSlots.length) {
      return {
        available: false,
        conflictingBooking: null,
        message: 'Not enough consecutive time slots available',
      };
    }

    // Validate that timeslots are actually consecutive (no gaps)
    const slotsNeeded = allTimeSlots.slice(startIndex, startIndex + slotsToSpan);
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

    // Check if ANY of the required time slots are blocked by Group Play rules
    for (const slot of slotsNeeded) {
      const isBlocked = await GroupPlay.isTimeSlotBlocked(courtId, dayOfWeek, slot.startTime);
      if (isBlocked) {
        return {
          available: false,
          conflictingBooking: null,
          message: 'ไม่สามารถจองสนามได้ในวันและเวลาที่เลือก',
        };
      }
    }

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

    // Create a set of all occupied half-slots (considering duration and startMinute)
    const occupiedHalfSlots = new Set();
    bookings.forEach((booking) => {
      const bookingStartIndex = allTimeSlots.findIndex((ts) => ts._id.equals(booking.timeSlot._id));
      if (bookingStartIndex !== -1) {
        const bStartHalf = (booking.startMinute || 0) === 30 ? 1 : 0;
        const bHalfSlots = (booking.duration || 1) * 2;

        for (let h = 0; h < bHalfSlots; h++) {
          const absoluteHalf = bStartHalf + h;
          const slotOffset = Math.floor(absoluteHalf / 2);
          const halfInSlot = absoluteHalf % 2;
          const slotIdx = bookingStartIndex + slotOffset;
          if (slotIdx < allTimeSlots.length) {
            const suffix = halfInSlot === 0 ? 'first' : 'second';
            occupiedHalfSlots.add(`${allTimeSlots[slotIdx]._id.toString()}_${suffix}`);
          }
        }
      }
    });

    // Check if any of our required half-slots are occupied
    for (let h = 0; h < halfSlotsNeeded; h++) {
      const absoluteHalf = startHalf + h;
      const slotOffset = Math.floor(absoluteHalf / 2);
      const halfInSlot = absoluteHalf % 2;
      const slotIdx = startIndex + slotOffset;
      const suffix = halfInSlot === 0 ? 'first' : 'second';
      const key = `${allTimeSlots[slotIdx]._id.toString()}_${suffix}`;

      if (occupiedHalfSlots.has(key)) {
        // Find the conflicting booking
        const conflictingBooking = bookings.find((booking) => {
          const bookingStartIndex = allTimeSlots.findIndex((ts) => ts._id.equals(booking.timeSlot._id));
          if (bookingStartIndex === -1) return false;

          const bStartHalf = (booking.startMinute || 0) === 30 ? 1 : 0;
          const bHalfSlots = (booking.duration || 1) * 2;

          for (let bh = 0; bh < bHalfSlots; bh++) {
            const bAbsoluteHalf = bStartHalf + bh;
            const bSlotOffset = Math.floor(bAbsoluteHalf / 2);
            const bHalfInSlot = bAbsoluteHalf % 2;
            const bSlotIdx = bookingStartIndex + bSlotOffset;
            if (bSlotIdx < allTimeSlots.length) {
              const bSuffix = bHalfInSlot === 0 ? 'first' : 'second';
              if (`${allTimeSlots[bSlotIdx]._id.toString()}_${bSuffix}` === key) return true;
            }
          }
          return false;
        });

        return {
          available: false,
          conflictingBooking: conflictingBooking || null,
        };
      }
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

    // Helper to format booking info
    const formatBookingInfo = (booking) => booking
      ? {
          bookingId: booking._id,
          bookingCode: booking.bookingCode,
          customerName: booking.customer.name,
          customerPhone: booking.customer.phone,
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
          duration: booking.duration,
          startMinute: booking.startMinute || 0,
        }
      : null;

    // Build schedule grid
    const schedule = await Promise.all(
      courts.map(async (court) => {
        // Create a map to track which half-slots are booked for this court
        const bookedHalfSlots = new Map(); // key: "slotId_first"/"slotId_second", value: booking

        // Process all bookings for this court
        bookings
          .filter((b) => b.court && b.court._id.equals(court._id))
          .forEach((booking) => {
            const startIndex = timeSlots.findIndex((ts) =>
              booking.timeSlot && ts._id.equals(booking.timeSlot._id)
            );

            if (startIndex !== -1) {
              const bStartHalf = (booking.startMinute || 0) === 30 ? 1 : 0;
              const bHalfSlots = (booking.duration || 1) * 2;

              for (let h = 0; h < bHalfSlots; h++) {
                const absoluteHalf = bStartHalf + h;
                const slotOffset = Math.floor(absoluteHalf / 2);
                const halfInSlot = absoluteHalf % 2;
                const slotIdx = startIndex + slotOffset;
                if (slotIdx < timeSlots.length) {
                  const suffix = halfInSlot === 0 ? 'first' : 'second';
                  bookedHalfSlots.set(`${timeSlots[slotIdx]._id.toString()}_${suffix}`, booking);
                }
              }
            }
          });

        // Map each timeslot with availability info (check Group Play blocking)
        const courtSlots = await Promise.all(
          timeSlots.map(async (timeSlot) => {
            const firstHalfBooking = bookedHalfSlots.get(`${timeSlot._id.toString()}_first`);
            const secondHalfBooking = bookedHalfSlots.get(`${timeSlot._id.toString()}_second`);

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
              available: !firstHalfBooking && !secondHalfBooking && !isBlockedByGroupPlay,
              blockedByGroupPlay: isBlockedByGroupPlay,
              firstHalf: {
                available: !firstHalfBooking && !isBlockedByGroupPlay,
                booking: formatBookingInfo(firstHalfBooking),
              },
              secondHalf: {
                available: !secondHalfBooking && !isBlockedByGroupPlay,
                booking: formatBookingInfo(secondHalfBooking),
              },
              booking: formatBookingInfo(firstHalfBooking || secondHalfBooking),
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

/**
 * Get availability count by time slot for a specific date
 * Used for customer booking page (shows count, not court names)
 *
 * @param {Date} date - Date to check
 * @returns {Promise<Object>} Object with date, dayType, and availability array
 */
const getAvailabilityByTimeSlot = async (date) => {
  try {
    // Normalize date to start of day
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if date is blocked
    const blockCheck = await isDateBlocked(bookingDate);
    if (blockCheck.isBlocked) {
      // Return blocked status
      const dayOfWeek = bookingDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayType = isWeekend ? 'weekend' : 'weekday';

      return {
        date: bookingDate,
        dayType,
        isBlocked: true,
        blockedReason: blockCheck.reason,
        availability: [],
      };
    }

    // Determine day type
    const dayOfWeek = bookingDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayType = isWeekend ? 'weekend' : 'weekday';
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];

    // Get all active courts
    const courts = await Court.find({
      deletedAt: null,
      status: 'available',
    });

    const totalCourts = courts.length;

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
    });

    // Build availability for each time slot
    const availability = await Promise.all(
      timeSlots.map(async (timeSlot) => {
        let bookedCount = 0;
        let blockedByGroupPlayCount = 0;

        // Count bookings for this time slot
        // Need to consider duration - a booking can span multiple time slots
        const allTimeSlots = timeSlots;
        const timeSlotIndex = allTimeSlots.findIndex(ts => ts._id.equals(timeSlot._id));

        for (const court of courts) {
          // Check if both halves of this slot are booked for this court
          let firstHalfBooked = false;
          let secondHalfBooked = false;

          bookings.forEach(booking => {
            if (!booking.court || !booking.court.equals(court._id)) return;

            const bookingSlotIndex = allTimeSlots.findIndex(ts =>
              booking.timeSlot && ts._id.equals(booking.timeSlot)
            );

            if (bookingSlotIndex === -1) return;

            const bStartHalf = (booking.startMinute || 0) === 30 ? 1 : 0;
            const bHalfSlots = (booking.duration || 1) * 2;

            for (let h = 0; h < bHalfSlots; h++) {
              const absoluteHalf = bStartHalf + h;
              const slotOffset = Math.floor(absoluteHalf / 2);
              const halfInSlot = absoluteHalf % 2;
              const slotIdx = bookingSlotIndex + slotOffset;

              if (slotIdx === timeSlotIndex) {
                if (halfInSlot === 0) firstHalfBooked = true;
                if (halfInSlot === 1) secondHalfBooked = true;
              }
            }
          });

          // Court is fully booked only if both halves are occupied
          if (firstHalfBooked && secondHalfBooked) {
            bookedCount++;
            continue;
          }

          // Check if blocked by Group Play
          const isBlocked = await GroupPlay.isTimeSlotBlocked(
            court._id,
            dayName,
            timeSlot.startTime
          );

          if (isBlocked) {
            blockedByGroupPlayCount++;
          }
        }

        const availableCount = totalCourts - bookedCount - blockedByGroupPlayCount;

        // Determine pricing based on peak hour
        const pricing = timeSlot.peakHour
          ? timeSlot.peakPricing
          : timeSlot.pricing;

        return {
          timeSlotId: timeSlot._id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          peakHour: timeSlot.peakHour,
          availableCount: Math.max(0, availableCount),
          totalCourts,
          pricing: {
            normal: pricing.normal,
            member: pricing.member,
          },
        };
      })
    );

    return {
      date: bookingDate,
      dayType,
      isBlocked: false,
      blockedReason: null,
      availability,
    };
  } catch (error) {
    console.error('Error getting availability by time slot:', error);
    throw error;
  }
};

module.exports = {
  checkAvailability,
  getAvailableCourts,
  getCourtSchedule,
  getAvailabilityByTimeSlot,
};
