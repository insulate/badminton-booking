const RecurringBookingGroup = require('../models/recurringBookingGroup.model');
const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');
const { generateGroupCode } = require('../utils/groupCodeGenerator');
const { generateBookingCode } = require('../utils/bookingCodeGenerator');
const {
  generateRecurringDates,
  checkBulkAvailability,
  calculateRecurringPrice,
  validateRecurringRequest,
  getDaysOfWeekDisplay,
} = require('../utils/recurringDateGenerator');

/**
 * Preview recurring booking (show dates and pricing before creating)
 * POST /api/recurring-bookings/preview
 */
const previewRecurringBooking = async (req, res) => {
  try {
    const { daysOfWeek, startDate, endDate, court, timeSlot, duration = 1 } = req.body;

    // Validate request
    const validation = validateRecurringRequest({
      daysOfWeek,
      startDate,
      endDate,
      maxMonths: 3,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors,
      });
    }

    // Validate court exists
    const courtDoc = await Court.findById(court);
    if (!courtDoc) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบสนามที่เลือก',
      });
    }

    // Validate timeSlot exists
    const timeSlotDoc = await TimeSlot.findById(timeSlot);
    if (!timeSlotDoc) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบช่วงเวลาที่เลือก',
      });
    }

    // Generate all dates based on pattern
    const allDates = generateRecurringDates(startDate, endDate, daysOfWeek);

    if (allDates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่มีวันที่ตรงกับเงื่อนไขที่เลือก',
      });
    }

    // Check availability for all dates
    const { validDates, skippedDates } = await checkBulkAvailability({
      dates: allDates,
      courtId: court,
      timeSlotId: timeSlot,
      duration,
    });

    if (validDates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่มีวันที่สามารถจองได้ กรุณาเลือกช่วงเวลาอื่น',
        skippedDates: skippedDates.map((s) => ({
          date: s.date,
          reason: s.reason,
          detail: s.detail,
        })),
      });
    }

    // Calculate pricing
    const { totalAmount, priceBreakdown } = await calculateRecurringPrice({
      dates: validDates,
      timeSlotId: timeSlot,
      duration,
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDates: allDates.length,
          validDates: validDates.length,
          skippedDates: skippedDates.length,
          daysOfWeekDisplay: getDaysOfWeekDisplay(daysOfWeek),
          court: {
            _id: courtDoc._id,
            name: courtDoc.name,
            courtNumber: courtDoc.courtNumber,
          },
          timeSlot: {
            _id: timeSlotDoc._id,
            startTime: timeSlotDoc.startTime,
            endTime: timeSlotDoc.endTime,
          },
          duration,
          startDate,
          endDate,
        },
        dates: validDates.map((date) => ({
          date,
          dayOfWeek: date.getDay(),
        })),
        skippedDates: skippedDates.map((s) => ({
          date: s.date,
          dayOfWeek: s.date.getDay(),
          reason: s.reason,
          detail: s.detail,
        })),
        pricing: {
          totalAmount,
          pricePerSession: validDates.length > 0 ? totalAmount / validDates.length : 0,
          breakdown: priceBreakdown,
        },
      },
    });
  } catch (error) {
    console.error('Preview recurring booking error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการแสดงตัวอย่าง',
      error: error.message,
    });
  }
};

/**
 * Create recurring booking
 * POST /api/recurring-bookings
 */
const createRecurringBooking = async (req, res) => {
  try {
    const {
      customer,
      daysOfWeek,
      startDate,
      endDate,
      court,
      timeSlot,
      duration = 1,
      paymentMode = 'per_session',
      notes,
    } = req.body;

    // Validate request
    const validation = validateRecurringRequest({
      daysOfWeek,
      startDate,
      endDate,
      maxMonths: 3,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', '),
        errors: validation.errors,
      });
    }

    // Validate customer
    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุชื่อและเบอร์โทรศัพท์ลูกค้า',
      });
    }

    // Validate court exists
    const courtDoc = await Court.findById(court);
    if (!courtDoc) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบสนามที่เลือก',
      });
    }

    // Validate timeSlot exists
    const timeSlotDoc = await TimeSlot.findById(timeSlot);
    if (!timeSlotDoc) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบช่วงเวลาที่เลือก',
      });
    }

    // Generate all dates based on pattern
    const allDates = generateRecurringDates(startDate, endDate, daysOfWeek);

    if (allDates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่มีวันที่ตรงกับเงื่อนไขที่เลือก',
      });
    }

    // Check availability for all dates
    const { validDates, skippedDates } = await checkBulkAvailability({
      dates: allDates,
      courtId: court,
      timeSlotId: timeSlot,
      duration,
    });

    if (validDates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่มีวันที่สามารถจองได้ กรุณาเลือกช่วงเวลาอื่น',
      });
    }

    // Calculate pricing
    const { totalAmount, priceBreakdown } = await calculateRecurringPrice({
      dates: validDates,
      timeSlotId: timeSlot,
      duration,
    });

    // Generate group code
    const groupCode = await generateGroupCode();

    // Create recurring booking group
    const recurringGroup = await RecurringBookingGroup.create({
      groupCode,
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
      },
      pattern: {
        daysOfWeek,
        timeSlot,
        duration,
        court,
      },
      startDate,
      endDate,
      paymentMode,
      bulkPayment: {
        totalAmount,
        paidAmount: 0,
        paymentStatus: 'pending',
      },
      totalBookings: validDates.length,
      skippedDates: skippedDates.map((s) => ({
        date: s.date,
        reason: s.reason,
        detail: s.detail,
      })),
      status: 'active',
      createdBy: req.user._id,
      notes,
    });

    // Create individual bookings
    const bookings = [];
    for (let i = 0; i < validDates.length; i++) {
      const date = validDates[i];
      const priceInfo = priceBreakdown[i];
      const bookingCode = await generateBookingCode(date);

      const booking = await Booking.create({
        bookingCode,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
        },
        court,
        date,
        timeSlot,
        duration,
        startMinute: 0,
        pricing: {
          subtotal: priceInfo.subtotal,
          discount: 0,
          deposit: 0,
          total: priceInfo.subtotal,
        },
        paymentStatus: paymentMode === 'bulk' ? 'pending' : 'pending',
        bookingStatus: 'confirmed',
        bookingSource: 'admin',
        isRecurring: true,
        recurringGroupId: recurringGroup._id,
        recurringSequence: i + 1,
        notes: `การจองประจำ ${groupCode} (${i + 1}/${validDates.length})`,
      });

      bookings.push(booking);
    }

    // Populate the recurring group
    await recurringGroup.populate([
      { path: 'pattern.court', select: 'courtNumber name' },
      { path: 'pattern.timeSlot', select: 'startTime endTime' },
      { path: 'createdBy', select: 'username' },
    ]);

    res.status(201).json({
      success: true,
      message: `สร้างการจองประจำสำเร็จ ${validDates.length} รายการ`,
      data: {
        recurringGroup,
        bookingsCreated: bookings.length,
        skippedDates: skippedDates.length,
      },
    });
  } catch (error) {
    console.error('Create recurring booking error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างการจองประจำ',
      error: error.message,
    });
  }
};

/**
 * Get all recurring booking groups
 * GET /api/recurring-bookings
 */
const getRecurringBookings = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = { deletedAt: null };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
        { groupCode: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await RecurringBookingGroup.countDocuments(query);
    const groups = await RecurringBookingGroup.find(query)
      .populate('pattern.court', 'courtNumber name')
      .populate('pattern.timeSlot', 'startTime endTime')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: groups,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get recurring bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: error.message,
    });
  }
};

/**
 * Get recurring booking group by ID
 * GET /api/recurring-bookings/:id
 */
const getRecurringBookingById = async (req, res) => {
  try {
    const group = await RecurringBookingGroup.findOne({
      _id: req.params.id,
      deletedAt: null,
    })
      .populate('pattern.court', 'courtNumber name')
      .populate('pattern.timeSlot', 'startTime endTime')
      .populate('createdBy', 'username');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจองประจำที่ต้องการ',
      });
    }

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error('Get recurring booking by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: error.message,
    });
  }
};

/**
 * Get bookings in a recurring group
 * GET /api/recurring-bookings/:id/bookings
 */
const getBookingsInGroup = async (req, res) => {
  try {
    const bookings = await Booking.find({
      recurringGroupId: req.params.id,
      deletedAt: null,
    })
      .populate('court', 'courtNumber name')
      .populate('timeSlot', 'startTime endTime')
      .sort({ date: 1, recurringSequence: 1 });

    res.status(200).json({
      success: true,
      data: bookings,
      total: bookings.length,
    });
  } catch (error) {
    console.error('Get bookings in group error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: error.message,
    });
  }
};

/**
 * Cancel recurring booking group (cancel all future bookings)
 * PATCH /api/recurring-bookings/:id/cancel
 */
const cancelRecurringBooking = async (req, res) => {
  try {
    const group = await RecurringBookingGroup.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจองประจำที่ต้องการ',
      });
    }

    if (group.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'การจองประจำนี้ถูกยกเลิกไปแล้ว',
      });
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cancel all future bookings in this group
    const result = await Booking.updateMany(
      {
        recurringGroupId: group._id,
        date: { $gte: today },
        bookingStatus: { $in: ['confirmed', 'payment_pending'] },
        deletedAt: null,
      },
      {
        $set: {
          bookingStatus: 'cancelled',
          deletedAt: new Date(),
        },
      }
    );

    // Update group status
    group.status = 'cancelled';
    group.cancelledBookings = result.modifiedCount;
    await group.save();

    res.status(200).json({
      success: true,
      message: `ยกเลิกการจองประจำสำเร็จ (${result.modifiedCount} รายการ)`,
      data: {
        cancelledCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Cancel recurring booking error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยกเลิก',
      error: error.message,
    });
  }
};

/**
 * Update bulk payment for recurring booking group
 * PATCH /api/recurring-bookings/:id/payment
 */
const updateBulkPayment = async (req, res) => {
  try {
    console.log('updateBulkPayment called with:', req.body);
    const { amount, paymentMethod } = req.body;

    const group = await RecurringBookingGroup.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจองประจำที่ต้องการ',
      });
    }

    if (group.paymentMode !== 'bulk') {
      return res.status(400).json({
        success: false,
        message: 'การจองนี้ไม่ได้ตั้งค่าเป็นชำระแบบรวม',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุจำนวนเงินที่ถูกต้อง',
      });
    }

    console.log('About to call updateBulkPayment method');
    // Update payment
    await group.updateBulkPayment(amount, paymentMethod);
    console.log('updateBulkPayment method completed');

    // If fully paid, update all bookings in the group
    if (group.bulkPayment.paymentStatus === 'paid') {
      await Booking.updateMany(
        {
          recurringGroupId: group._id,
          deletedAt: null,
        },
        {
          $set: {
            paymentStatus: 'paid',
            paymentMethod,
          },
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'อัพเดทการชำระเงินสำเร็จ',
      data: group,
    });
  } catch (error) {
    console.error('Update bulk payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการอัพเดทการชำระเงิน',
    });
  }
};

module.exports = {
  previewRecurringBooking,
  createRecurringBooking,
  getRecurringBookings,
  getRecurringBookingById,
  getBookingsInGroup,
  cancelRecurringBooking,
  updateBulkPayment,
};
