const express = require('express');
const router = express.Router();
const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');
const Setting = require('../models/setting.model');
const { protect, authorize } = require('../middleware/auth');
const {
  validateBookingRequest,
  validateBookingUpdate,
  validateCancellation,
} = require('../middleware/bookingValidation');
const { generateBookingCode } = require('../utils/bookingCodeGenerator');
const { calculatePrice } = require('../utils/priceCalculator');
const {
  checkAvailability,
  getAvailableCourts,
  getCourtSchedule,
} = require('../utils/availabilityChecker');

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with filters
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const {
      date,
      court,
      bookingStatus,
      paymentStatus,
      customerPhone,
      bookingCode,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    // Build query
    const query = { deletedAt: null };

    if (date) {
      const bookingDate = new Date(date);
      bookingDate.setHours(0, 0, 0, 0);
      const endOfDay = new Date(bookingDate);
      endOfDay.setHours(23, 59, 59, 999);

      query.date = { $gte: bookingDate, $lte: endOfDay };
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    }

    if (court) {
      query.court = court;
    }

    if (bookingStatus) {
      query.bookingStatus = bookingStatus;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (customerPhone) {
      query['customer.phone'] = new RegExp(customerPhone, 'i');
    }

    if (bookingCode) {
      query.bookingCode = new RegExp(bookingCode, 'i');
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const bookings = await Booking.find(query)
      .populate('court', 'courtNumber name type')
      .populate('timeSlot', 'startTime endTime peakHour')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/bookings/schedule/daily
 * @desc    Get daily court schedule with availability
 * @access  Private
 */
router.get('/schedule/daily', protect, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required',
      });
    }

    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayType = isWeekend ? 'weekend' : 'weekday';

    const schedule = await getCourtSchedule(bookingDate, dayType);

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Get daily schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily schedule',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('court', 'courtNumber name type')
      .populate('timeSlot', 'startTime endTime peakHour dayType');

    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/bookings/check-availability
 * @desc    Check court availability
 * @access  Private
 */
router.post('/check-availability', protect, async (req, res) => {
  try {
    const { courtId, date, timeSlotId, duration } = req.body;

    if (!courtId && !date && !timeSlotId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courtId, date, or timeSlotId to check availability',
      });
    }

    // If all parameters provided, check specific slot
    if (courtId && date && timeSlotId) {
      const availability = await checkAvailability({
        courtId,
        date,
        timeSlotId,
        duration: duration || 1,
      });
      return res.status(200).json({
        success: true,
        data: availability,
      });
    }

    // If only date and timeSlot provided, get all available courts
    if (date && timeSlotId) {
      const availableCourts = await getAvailableCourts({ date, timeSlotId });
      return res.status(200).json({
        success: true,
        data: {
          availableCourts,
          count: availableCourts.length,
        },
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid parameters for availability check',
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/bookings
 * @desc    Create new booking
 * @access  Private
 */
router.post('/', protect, validateBookingRequest, async (req, res) => {
  try {
    const { customer, court, date, timeSlot, duration, paymentMethod, paymentStatus, notes } = req.body;
    const { court: courtDoc, timeSlot: timeSlotDoc, bookingDate } = req.validatedData;

    // Check availability
    const availability = await checkAvailability({
      courtId: court,
      date: bookingDate,
      timeSlotId: timeSlot,
      duration: duration || 1,
    });

    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: 'Court is not available for the selected date and time',
        conflictingBooking: availability.conflictingBooking,
      });
    }

    // Generate booking code
    const bookingCode = await generateBookingCode(bookingDate);

    // Calculate pricing
    const pricing = await calculatePrice({
      timeSlotId: timeSlot,
      duration,
      customerType: 'normal', // TODO: Get from user profile when member system is implemented
    });

    // Create booking
    const booking = await Booking.create({
      bookingCode,
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
      },
      court,
      date: bookingDate,
      timeSlot,
      duration,
      pricing: {
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        deposit: pricing.deposit,
        total: pricing.total,
      },
      paymentMethod: paymentMethod || null,
      notes: notes || '',
      bookingStatus: 'confirmed',
      paymentStatus: paymentStatus || 'pending',
    });

    // Populate before sending response
    await booking.populate('court', 'courtNumber name type');
    await booking.populate('timeSlot', 'startTime endTime peakHour');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/bookings/:id
 * @desc    Update booking
 * @access  Private
 */
router.patch('/:id', protect, validateBookingUpdate, async (req, res) => {
  try {
    const { customer, paymentMethod, notes, paymentStatus, bookingStatus } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Update fields
    if (customer) {
      if (customer.name) booking.customer.name = customer.name;
      if (customer.phone) booking.customer.phone = customer.phone;
      if (customer.email !== undefined) booking.customer.email = customer.email;
    }

    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (notes !== undefined) booking.notes = notes;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (bookingStatus) booking.bookingStatus = bookingStatus;

    await booking.save();

    // Populate before sending response
    await booking.populate('court', 'courtNumber name type');
    await booking.populate('timeSlot', 'startTime endTime peakHour');

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Private
 */
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      'timeSlot',
      'startTime endTime'
    );

    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Attach booking to request for validation
    req.booking = booking;

    // Validate cancellation (will call next() if valid)
    await validateCancellation(req, res, async () => {
      await booking.cancel();

      await booking.populate('court', 'courtNumber name type');

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: booking,
      });
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/bookings/:id/checkin
 * @desc    Check-in booking
 * @access  Private
 */
router.patch('/:id/checkin', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    await booking.checkIn();

    await booking.populate('court', 'courtNumber name type');
    await booking.populate('timeSlot', 'startTime endTime peakHour');

    res.status(200).json({
      success: true,
      message: 'Checked in successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to check-in',
    });
  }
});

/**
 * @route   PATCH /api/bookings/:id/checkout
 * @desc    Check-out booking
 * @access  Private
 */
router.patch('/:id/checkout', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    await booking.checkOut();

    await booking.populate('court', 'courtNumber name type');
    await booking.populate('timeSlot', 'startTime endTime peakHour');

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to check-out',
    });
  }
});

/**
 * @route   PATCH /api/bookings/:id/payment
 * @desc    Update payment
 * @access  Private
 */
router.patch('/:id/payment', protect, async (req, res) => {
  try {
    const { amountPaid, paymentMethod } = req.body;

    if (!amountPaid || amountPaid < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required',
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update payment for cancelled booking',
      });
    }

    await booking.updatePayment(amountPaid);

    if (paymentMethod) {
      booking.paymentMethod = paymentMethod;
      await booking.save();
    }

    await booking.populate('court', 'courtNumber name type');
    await booking.populate('timeSlot', 'startTime endTime peakHour');

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message,
    });
  }
});

module.exports = router;
