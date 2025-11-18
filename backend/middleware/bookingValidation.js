const Setting = require('../models/setting.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');

/**
 * Validate booking request data
 */
const validateBookingRequest = async (req, res, next) => {
  try {
    const { customer, court, date, timeSlot, duration } = req.body;

    // Validate customer information
    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone are required',
      });
    }

    // Validate email format if provided
    if (customer.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer.email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }
    }

    // Validate phone format (Thai phone: 10 digits)
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(customer.phone.replace(/[-\s]/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Must be 10 digits starting with 0',
      });
    }

    // Validate court ID
    if (!court) {
      return res.status(400).json({
        success: false,
        message: 'Court ID is required',
      });
    }

    // Check if court exists and is available
    const courtDoc = await Court.findById(court);
    if (!courtDoc || courtDoc.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Court not found',
      });
    }

    if (courtDoc.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `Court is ${courtDoc.status}. Cannot make booking.`,
      });
    }

    // Validate date
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Booking date is required',
      });
    }

    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }

    // Validate timeSlot ID
    if (!timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'TimeSlot ID is required',
      });
    }

    // Check if timeSlot exists and is active
    const timeSlotDoc = await TimeSlot.findById(timeSlot);
    if (!timeSlotDoc || timeSlotDoc.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'TimeSlot not found',
      });
    }

    if (timeSlotDoc.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'TimeSlot is not active',
      });
    }

    // Validate duration
    if (!duration || duration < 1 || duration > 8) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 1 and 8 hours',
      });
    }

    // Get settings for validation
    const settings = await Setting.findOne();

    if (settings && settings.booking) {
      // Check advance booking limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxAdvanceDate = new Date(today);
      maxAdvanceDate.setDate(today.getDate() + settings.booking.advanceBookingDays);

      if (bookingDate > maxAdvanceDate) {
        return res.status(400).json({
          success: false,
          message: `Cannot book more than ${settings.booking.advanceBookingDays} days in advance`,
        });
      }

      // Check minimum booking date (cannot book in the past)
      if (bookingDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book in the past',
        });
      }

      // Check duration limits
      if (duration < settings.booking.minBookingHours) {
        return res.status(400).json({
          success: false,
          message: `Minimum booking duration is ${settings.booking.minBookingHours} hour(s)`,
        });
      }

      if (duration > settings.booking.maxBookingHours) {
        return res.status(400).json({
          success: false,
          message: `Maximum booking duration is ${settings.booking.maxBookingHours} hour(s)`,
        });
      }
    }

    // Check if booking date matches timeSlot dayType
    const dayOfWeek = bookingDate.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const expectedDayType = isWeekend ? 'weekend' : 'weekday';

    if (timeSlotDoc.dayType !== expectedDayType) {
      return res.status(400).json({
        success: false,
        message: `Selected timeSlot is for ${timeSlotDoc.dayType}, but the date is a ${expectedDayType}`,
      });
    }

    // Attach validated documents to request
    req.validatedData = {
      court: courtDoc,
      timeSlot: timeSlotDoc,
      bookingDate,
      settings,
    };

    next();
  } catch (error) {
    console.error('Booking validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Validation error',
      error: error.message,
    });
  }
};

/**
 * Validate booking update request
 */
const validateBookingUpdate = async (req, res, next) => {
  try {
    const { paymentStatus, bookingStatus } = req.body;

    // Validate payment status
    if (paymentStatus && !['pending', 'partial', 'paid'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Must be: pending, partial, or paid',
      });
    }

    // Validate booking status
    if (
      bookingStatus &&
      !['confirmed', 'checked-in', 'completed', 'cancelled'].includes(bookingStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking status. Must be: confirmed, checked-in, completed, or cancelled',
      });
    }

    next();
  } catch (error) {
    console.error('Booking update validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Validation error',
      error: error.message,
    });
  }
};

/**
 * Validate cancellation request
 */
const validateCancellation = async (req, res, next) => {
  try {
    const booking = req.booking; // Should be attached by a previous middleware

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Cannot cancel already cancelled bookings
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    // Cannot cancel completed bookings
    if (booking.bookingStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed bookings',
      });
    }

    // Get settings for cancellation policy
    const settings = await Setting.findOne();

    if (settings && settings.booking && settings.booking.cancellationHours > 0) {
      const now = new Date();
      const bookingDateTime = new Date(booking.date);

      // Add timeSlot start time to booking date
      if (booking.timeSlot && booking.timeSlot.startTime) {
        const [hours, minutes] = booking.timeSlot.startTime.split(':');
        bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const hoursDifference = (bookingDateTime - now) / (1000 * 60 * 60);

      if (hoursDifference < settings.booking.cancellationHours) {
        return res.status(400).json({
          success: false,
          message: `Cancellation must be made at least ${settings.booking.cancellationHours} hours in advance`,
        });
      }
    }

    next();
  } catch (error) {
    console.error('Cancellation validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Validation error',
      error: error.message,
    });
  }
};

module.exports = {
  validateBookingRequest,
  validateBookingUpdate,
  validateCancellation,
};
