const express = require('express');
const router = express.Router();
const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');
const Setting = require('../models/setting.model');
const { protect, admin, protectPlayer } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const { uploadSlip, deleteImage } = require('../middleware/upload');
const {
  validateBookingRequest,
  validateBookingUpdate,
  validateCancellation,
  validateAvailabilityCheck,
  validatePriceCalculation,
} = require('../middleware/bookingValidation');
const { generateBookingCode } = require('../utils/bookingCodeGenerator');
const { calculatePrice } = require('../utils/priceCalculator');
const {
  checkAvailability,
  getAvailableCourts,
  getCourtSchedule,
  getAvailabilityByTimeSlot,
} = require('../utils/availabilityChecker');
const { isDateBlocked } = require('../utils/blockedDateChecker');

/**
 * @route   GET /api/bookings/public/availability
 * @desc    Get availability count by time slot (public)
 * @access  Public
 */
router.get('/public/availability', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required',
      });
    }

    const availability = await getAvailabilityByTimeSlot(new Date(date));

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Get public availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get availability',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/bookings/pending-slips-count
 * @desc    Get count of bookings with pending slip verification
 * @access  Private (Admin)
 */
router.get('/pending-slips-count', protect, admin, async (req, res) => {
  try {
    const count = await Booking.countDocuments({
      'paymentSlip.status': 'pending_verification',
      deletedAt: null,
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Get pending slips count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending slips count',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/bookings/customer
 * @desc    Create booking from customer (no court assigned)
 * @access  Private (Player)
 */
router.post('/customer', protectPlayer, async (req, res) => {
  try {
    const { date, timeSlot, duration } = req.body;
    const player = req.player;

    // Validate input
    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุวันที่และเวลา',
      });
    }

    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // === Check Blocked Date ===
    const blockCheck = await isDateBlocked(bookingDate);
    if (blockCheck.isBlocked) {
      return res.status(400).json({
        success: false,
        message: blockCheck.reason || 'วันนี้ไม่เปิดให้จอง',
        isBlocked: true,
      });
    }

    // === Date Validation ===
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // เช็คว่าไม่ใช่วันในอดีต
    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถจองวันที่ผ่านมาแล้วได้',
      });
    }

    // ดึง Settings สำหรับ advance booking limit
    const settings = await Setting.findOne();
    const advanceBookingDays = settings?.booking?.advanceBookingDays || 14;

    // เช็ค advance booking limit
    const maxAdvanceDate = new Date(today);
    maxAdvanceDate.setDate(today.getDate() + advanceBookingDays);

    if (bookingDate > maxAdvanceDate) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถจองล่วงหน้าเกิน ${advanceBookingDays} วันได้`,
      });
    }

    // Get time slot details
    const timeSlotDoc = await TimeSlot.findById(timeSlot);
    if (!timeSlotDoc) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบช่วงเวลาที่เลือก',
      });
    }

    // เช็ค minimum advance booking hours
    const minimumAdvanceHours = settings?.booking?.minimumAdvanceHours || 0;
    if (minimumAdvanceHours > 0) {
      const now = new Date();
      const bookingDateTime = new Date(date);
      const [hours, minutes] = timeSlotDoc.startTime.split(':');
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const hoursDiff = (bookingDateTime - now) / (1000 * 60 * 60);

      if (hoursDiff < minimumAdvanceHours) {
        return res.status(400).json({
          success: false,
          message: `ต้องจองล่วงหน้าอย่างน้อย ${minimumAdvanceHours} ชั่วโมง`,
        });
      }
    }

    // เช็ค dayType mismatch
    const dayOfWeek = bookingDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const expectedDayType = isWeekend ? 'weekend' : 'weekday';

    if (timeSlotDoc.dayType !== expectedDayType) {
      return res.status(400).json({
        success: false,
        message: `ช่วงเวลานี้สำหรับวัน${timeSlotDoc.dayType === 'weekday' ? 'ธรรมดา' : 'หยุด'} แต่วันที่เลือกเป็นวัน${expectedDayType === 'weekday' ? 'ธรรมดา' : 'หยุด'}`,
      });
    }

    // Check availability
    const availability = await getAvailabilityByTimeSlot(bookingDate);
    const slotAvailability = availability.availability.find(
      a => a.timeSlotId.equals(timeSlot)
    );

    if (!slotAvailability || slotAvailability.availableCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'ช่วงเวลานี้ไม่มีสนามว่าง',
      });
    }

    // Calculate price
    const bookingDuration = duration || 1;
    const pricePerHour = player.isMember 
      ? slotAvailability.pricing.member 
      : slotAvailability.pricing.normal;
    const subtotal = pricePerHour * bookingDuration;

    // Generate booking code
    const bookingCode = await generateBookingCode(bookingDate);

    // Create booking without court - status: payment_pending until slip uploaded
    const paymentDeadline = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const booking = await Booking.create({
      bookingCode,
      customer: {
        name: player.name,
        phone: player.phone,
      },
      player: player._id,
      court: null, // Admin will assign later
      date: bookingDate,
      timeSlot,
      duration: bookingDuration,
      pricing: {
        subtotal,
        discount: 0,
        deposit: 0,
        total: subtotal,
      },
      bookingStatus: 'payment_pending',
      paymentStatus: 'pending',
      paymentDeadline,
      bookingSource: 'customer',
    });

    // Populate before sending response
    await booking.populate('timeSlot', 'startTime endTime peakHour');

    res.status(201).json({
      success: true,
      message: 'จองสนามสำเร็จ',
      data: booking,
    });
  } catch (error) {
    console.error('Create customer booking error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการจองสนาม',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/bookings/customer/my-bookings
 * @desc    Get player's booking history
 * @access  Private (Player)
 */
router.get('/customer/my-bookings', protectPlayer, async (req, res) => {
  try {
    const player = req.player;
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      player: player._id,
      deletedAt: null,
    };

    if (status && status !== 'all') {
      query.bookingStatus = status;
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('court', 'courtNumber name')
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
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถโหลดประวัติการจองได้',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/bookings/payment/:id
 * @desc    Get booking by ID for payment page (Public - accessed via booking link)
 * @access  Public
 */
router.get('/payment/:id', validateObjectId(), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('court', 'courtNumber name')
      .populate('timeSlot', 'startTime endTime peakHour');

    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจอง',
      });
    }

    // Return limited info for payment page (no sensitive data)
    res.status(200).json({
      success: true,
      data: {
        _id: booking._id,
        bookingCode: booking.bookingCode,
        date: booking.date,
        court: booking.court,
        timeSlot: booking.timeSlot,
        duration: booking.duration,
        pricing: booking.pricing,
        bookingStatus: booking.bookingStatus,
        paymentDeadline: booking.paymentDeadline,
        customer: {
          name: booking.customer?.name,
        },
      },
    });
  } catch (error) {
    console.error('Get booking for payment error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถโหลดข้อมูลการจองได้',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/bookings/customer/:id
 * @desc    Get single booking by ID for payment page
 * @access  Private (Player)
 */
router.get('/customer/:id', protectPlayer, validateObjectId(), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('court', 'courtNumber name')
      .populate('timeSlot', 'startTime endTime peakHour');

    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจอง',
      });
    }

    // Verify ownership
    if (!booking.player || !booking.player.equals(req.player._id)) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์ดูการจองนี้',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Get booking by id error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถโหลดข้อมูลการจองได้',
      error: error.message,
    });
  }
});

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
      // Escape special regex characters to prevent ReDoS attacks
      const escapedPhone = customerPhone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query['customer.phone'] = { $regex: escapedPhone, $options: 'i' };
    }

    if (bookingCode) {
      // Escape special regex characters to prevent ReDoS attacks
      const escapedCode = bookingCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.bookingCode = { $regex: escapedCode, $options: 'i' };
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
router.get('/:id', protect, validateObjectId(), async (req, res) => {
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
router.post('/check-availability', protect, validateAvailabilityCheck, async (req, res) => {
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
 * @route   POST /api/bookings/calculate-price
 * @desc    Calculate booking price
 * @access  Private
 */
router.post('/calculate-price', protect, validatePriceCalculation, async (req, res) => {
  try {
    const { timeSlotId, duration, customerType, discountPercent, depositAmount } = req.body;

    if (!timeSlotId) {
      return res.status(400).json({
        success: false,
        message: 'TimeSlot ID is required',
      });
    }

    const pricing = await calculatePrice({
      timeSlotId,
      duration: duration || 1,
      customerType: customerType || 'normal',
      discountPercent: discountPercent || 0,
      depositAmount: depositAmount || 0,
    });

    res.status(200).json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    console.error('Calculate price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate price',
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

    // Check if date is blocked
    const blockCheck = await isDateBlocked(bookingDate);
    if (blockCheck.isBlocked) {
      return res.status(400).json({
        success: false,
        message: blockCheck.reason || 'วันนี้ไม่เปิดให้จอง',
        isBlocked: true,
      });
    }

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
        message: availability.message || 'ไม่สามารถจองสนามได้ในวันและเวลาที่เลือก',
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
router.patch('/:id', protect, validateObjectId(), validateBookingUpdate, async (req, res) => {
  try {
    const { customer, paymentMethod, notes, paymentStatus, bookingStatus } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Validate booking status transitions
    if (bookingStatus && bookingStatus !== booking.bookingStatus) {
      const validTransitions = {
        confirmed: ['checked-in', 'cancelled'],
        'checked-in': ['completed'],
        completed: [], // Cannot transition from completed
        cancelled: [], // Cannot transition from cancelled
      };

      const allowedNextStates = validTransitions[booking.bookingStatus] || [];

      if (!allowedNextStates.includes(bookingStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from '${booking.bookingStatus}' to '${bookingStatus}'`,
        });
      }
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
router.patch('/:id/cancel', protect, validateObjectId(), async (req, res) => {
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
router.patch('/:id/checkin', protect, validateObjectId(), async (req, res) => {
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
router.patch('/:id/checkout', protect, validateObjectId(), async (req, res) => {
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
router.patch('/:id/payment', protect, validateObjectId(), async (req, res) => {
  try {
    const { amountPaid, paymentMethod } = req.body;

    if (!amountPaid || amountPaid < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount is required',
      });
    }

    // Find booking first to validate
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

    // Calculate new payment status
    const newAmountPaid = (booking.pricing.deposit || 0) + amountPaid;
    let newPaymentStatus = 'pending';

    if (newAmountPaid >= booking.pricing.total) {
      newPaymentStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newPaymentStatus = 'partial';
    }

    // Prepare update object
    const updateData = {
      'pricing.deposit': newAmountPaid,
      paymentStatus: newPaymentStatus,
    };

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    // Atomic update to prevent race conditions
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('court', 'courtNumber name type')
      .populate('timeSlot', 'startTime endTime peakHour');

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found after update',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: updatedBooking,
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

/**
 * @route   PATCH /api/bookings/:id/assign-court
 * @desc    Assign court to booking (Admin only)
 * @access  Private (Admin)
 */
router.patch('/:id/assign-court', protect, validateObjectId(), async (req, res) => {
  try {
    const { courtId } = req.body;

    if (!courtId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุสนาม',
      });
    }

    // Validate court exists
    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบสนามที่ระบุ',
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจอง',
      });
    }

    // Check if court is available for this booking's date/time
    const availability = await checkAvailability({
      courtId,
      date: booking.date,
      timeSlotId: booking.timeSlot,
      duration: booking.duration,
      excludeBookingId: booking._id,
    });

    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: 'สนามนี้ไม่ว่างในช่วงเวลาดังกล่าว',
      });
    }

    // Assign court
    booking.court = courtId;
    await booking.save();

    await booking.populate('court', 'courtNumber name');
    await booking.populate('timeSlot', 'startTime endTime peakHour');

    res.status(200).json({
      success: true,
      message: 'กำหนดสนามสำเร็จ',
      data: booking,
    });
  } catch (error) {
    console.error('Assign court error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถกำหนดสนามได้',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/bookings/:id/upload-slip
 * @desc    Upload payment slip for booking
 * @access  Private (Player)
 */
router.post('/:id/upload-slip', protectPlayer, validateObjectId(), uploadSlip.single('slip'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจอง',
      });
    }

    // Verify ownership
    if (!booking.player || !booking.player.equals(req.player._id)) {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์อัพโหลดสลิปสำหรับการจองนี้',
      });
    }

    // Check if slip file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกไฟล์สลิป',
      });
    }

    // Check booking status
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถอัพโหลดสลิปสำหรับการจองที่ถูกยกเลิกได้',
      });
    }

    // Check payment status
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'การจองนี้ชำระเงินเรียบร้อยแล้ว',
      });
    }

    // Delete old slip if exists
    if (booking.paymentSlip?.image) {
      await deleteImage(booking.paymentSlip.image);
    }

    // Update booking with new slip - set to pending verification
    const imagePath = `/uploads/slips/${req.file.filename}`;
    booking.paymentSlip = {
      image: imagePath,
      uploadedAt: new Date(),
      verifiedAt: null,
      verifiedBy: null,
      status: 'pending_verification',
      rejectReason: '',
    };

    // Keep booking pending until slip is verified
    // Don't change bookingStatus or paymentStatus here

    await booking.save();

    await booking.populate('court', 'courtNumber name');
    await booking.populate('timeSlot', 'startTime endTime peakHour');

    res.status(200).json({
      success: true,
      message: 'อัพโหลดสลิปสำเร็จ รอการตรวจสอบจากเจ้าหน้าที่',
      data: booking,
    });
  } catch (error) {
    console.error('Upload slip error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัพโหลดสลิปได้',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/bookings/payment/:id/upload-slip
 * @desc    Upload payment slip for booking (Public - accessed via payment link)
 * @access  Public
 */
router.post('/payment/:id/upload-slip', validateObjectId(), uploadSlip.single('slip'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจอง',
      });
    }

    // Check if slip file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกไฟล์สลิป',
      });
    }

    // Check booking status
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถอัพโหลดสลิปสำหรับการจองที่ถูกยกเลิกได้',
      });
    }

    // Check payment status
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'การจองนี้ชำระเงินเรียบร้อยแล้ว',
      });
    }

    // Delete old slip if exists
    if (booking.paymentSlip?.image) {
      await deleteImage(booking.paymentSlip.image);
    }

    // Update booking with new slip - set to pending verification
    const imagePath = `/uploads/slips/${req.file.filename}`;
    booking.paymentSlip = {
      image: imagePath,
      uploadedAt: new Date(),
      verifiedAt: null,
      verifiedBy: null,
      status: 'pending_verification',
      rejectReason: '',
    };

    // Keep booking pending until slip is verified
    // Don't change bookingStatus or paymentStatus here

    await booking.save();

    await booking.populate('court', 'courtNumber name');
    await booking.populate('timeSlot', 'startTime endTime peakHour');

    res.status(200).json({
      success: true,
      message: 'อัพโหลดสลิปสำเร็จ รอการตรวจสอบจากเจ้าหน้าที่',
      data: {
        _id: booking._id,
        bookingCode: booking.bookingCode,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        paymentSlip: {
          status: booking.paymentSlip.status,
        },
      },
    });
  } catch (error) {
    console.error('Public upload slip error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถอัพโหลดสลิปได้',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/bookings/:id/verify-slip
 * @desc    Verify or reject payment slip (Admin only)
 * @access  Private (Admin)
 */
router.patch('/:id/verify-slip', protect, admin, validateObjectId(), async (req, res) => {
  try {
    const { action, rejectReason } = req.body;

    if (!action || !['verify', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ action (verify หรือ reject)',
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจอง',
      });
    }

    // Check if slip exists
    if (!booking.paymentSlip?.image || booking.paymentSlip.status === 'none') {
      return res.status(400).json({
        success: false,
        message: 'ยังไม่มีสลิปที่อัพโหลด',
      });
    }

    // Check if slip is already verified
    if (booking.paymentSlip.status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'สลิปนี้ได้รับการยืนยันแล้ว',
      });
    }

    if (action === 'verify') {
      // Verify slip and mark as paid
      booking.paymentSlip.status = 'verified';
      booking.paymentSlip.verifiedAt = new Date();
      booking.paymentSlip.verifiedBy = req.user._id;
      booking.paymentSlip.rejectReason = '';

      // Update payment status to paid
      booking.paymentStatus = 'paid';
      booking.pricing.deposit = booking.pricing.total;
    } else {
      // Reject slip
      if (!rejectReason) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุเหตุผลในการปฏิเสธ',
        });
      }

      booking.paymentSlip.status = 'rejected';
      booking.paymentSlip.verifiedAt = new Date();
      booking.paymentSlip.verifiedBy = req.user._id;
      booking.paymentSlip.rejectReason = rejectReason;
    }

    await booking.save();

    await booking.populate('court', 'courtNumber name');
    await booking.populate('timeSlot', 'startTime endTime peakHour');
    await booking.populate('paymentSlip.verifiedBy', 'username');

    res.status(200).json({
      success: true,
      message: action === 'verify' ? 'ยืนยันสลิปสำเร็จ' : 'ปฏิเสธสลิปสำเร็จ',
      data: booking,
    });
  } catch (error) {
    console.error('Verify slip error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถตรวจสอบสลิปได้',
      error: error.message,
    });
  }
});

module.exports = router;
