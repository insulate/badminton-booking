const express = require('express');
const router = express.Router();
const TimeSlot = require('../models/timeslot.model');
const Booking = require('../models/booking.model');
const { protect, admin } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

// @route   GET /api/timeslots
// @desc    Get all timeslots with optional filters
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const { dayType, status, peakHour } = req.query;

    // Build query
    const query = { deletedAt: null };
    if (dayType) query.dayType = dayType;
    if (status) query.status = status;
    if (peakHour !== undefined) query.peakHour = peakHour === 'true';

    const timeslots = await TimeSlot.find(query).sort({ dayType: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: timeslots.length,
      data: timeslots,
    });
  } catch (error) {
    console.error('Error fetching timeslots:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลา',
    });
  }
});

// @route   GET /api/timeslots/active
// @desc    Get active timeslots only
// @access  Private/Admin
router.get('/active', protect, admin, async (req, res) => {
  try {
    const { dayType } = req.query;
    const timeslots = await TimeSlot.getActiveTimeslots(dayType);

    res.status(200).json({
      success: true,
      count: timeslots.length,
      data: timeslots,
    });
  } catch (error) {
    console.error('Error fetching active timeslots:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลาที่เปิดใช้งาน',
    });
  }
});

// @route   PATCH /api/timeslots/bulk-update-pricing
// @desc    Bulk update pricing for multiple timeslots
// @access  Private/Admin
router.patch('/bulk-update-pricing', protect, admin, async (req, res) => {
  try {
    const { dayType, pricing, peakPricing } = req.body;

    // Build query
    const query = { deletedAt: null };
    if (dayType) query.dayType = dayType;

    // Build update object
    const updateFields = {};
    if (pricing) {
      if (pricing.normal !== undefined) updateFields['pricing.normal'] = pricing.normal;
      if (pricing.member !== undefined) updateFields['pricing.member'] = pricing.member;
    }
    if (peakPricing) {
      if (peakPricing.normal !== undefined)
        updateFields['peakPricing.normal'] = peakPricing.normal;
      if (peakPricing.member !== undefined)
        updateFields['peakPricing.member'] = peakPricing.member;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่มีข้อมูลราคาที่ต้องการอัปเดต',
      });
    }

    // Update all matching timeslots
    const result = await TimeSlot.updateMany(query, { $set: updateFields });

    res.status(200).json({
      success: true,
      message: `อัปเดตราคา ${result.modifiedCount} ช่วงเวลาสำเร็จ`,
      data: {
        matched: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Error bulk updating pricing:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตราคา',
    });
  }
});

// @route   GET /api/timeslots/:id
// @desc    Get single timeslot by ID
// @access  Private/Admin
router.get('/:id', protect, admin, validateObjectId(), async (req, res) => {
  try {
    const timeslot = await TimeSlot.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!timeslot) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลช่วงเวลา',
      });
    }

    res.status(200).json({
      success: true,
      data: timeslot,
    });
  } catch (error) {
    console.error('Error fetching timeslot:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลช่วงเวลา',
    });
  }
});

// @route   POST /api/timeslots
// @desc    Create new timeslot
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { startTime, endTime, dayType, pricing, peakHour, status } = req.body;

    // Check for overlapping timeslots
    const existingTimeslots = await TimeSlot.find({
      dayType,
      deletedAt: null,
    });

    const newTimeslot = new TimeSlot({
      startTime,
      endTime,
      dayType,
      pricing,
      peakHour,
      status,
    });

    // Check for overlaps
    for (const existing of existingTimeslots) {
      if (newTimeslot.overlaps(existing)) {
        return res.status(400).json({
          success: false,
          message: `ช่วงเวลาซ้อนทับกับช่วงเวลา ${existing.startTime}-${existing.endTime} (${existing.dayType})`,
        });
      }
    }

    const timeslot = await TimeSlot.create(req.body);

    res.status(201).json({
      success: true,
      data: timeslot,
    });
  } catch (error) {
    console.error('Error creating timeslot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการสร้างช่วงเวลา',
    });
  }
});

// @route   PUT /api/timeslots/:id
// @desc    Update timeslot
// @access  Private/Admin
router.put('/:id', protect, admin, validateObjectId(), async (req, res) => {
  try {
    const timeslot = await TimeSlot.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!timeslot) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลช่วงเวลา',
      });
    }

    // Check for overlaps if time or dayType is being updated
    if (req.body.startTime || req.body.endTime || req.body.dayType) {
      const updatedTimeslot = {
        ...timeslot.toObject(),
        ...req.body,
      };

      const existingTimeslots = await TimeSlot.find({
        _id: { $ne: req.params.id },
        dayType: updatedTimeslot.dayType,
        deletedAt: null,
      });

      const testTimeslot = new TimeSlot(updatedTimeslot);

      for (const existing of existingTimeslots) {
        if (testTimeslot.overlaps(existing)) {
          return res.status(400).json({
            success: false,
            message: `ช่วงเวลาซ้อนทับกับช่วงเวลา ${existing.startTime}-${existing.endTime} (${existing.dayType})`,
          });
        }
      }
    }

    // Update fields
    Object.assign(timeslot, req.body);
    await timeslot.save();

    res.status(200).json({
      success: true,
      data: timeslot,
    });
  } catch (error) {
    console.error('Error updating timeslot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการแก้ไขช่วงเวลา',
    });
  }
});

// @route   PATCH /api/timeslots/:id/pricing
// @desc    Update timeslot pricing only
// @access  Private/Admin
router.patch('/:id/pricing', protect, admin, validateObjectId(), async (req, res) => {
  try {
    const timeslot = await TimeSlot.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!timeslot) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลช่วงเวลา',
      });
    }

    // Update pricing
    if (req.body.pricing) {
      timeslot.pricing = {
        ...timeslot.pricing,
        ...req.body.pricing,
      };
    }

    await timeslot.save();

    res.status(200).json({
      success: true,
      data: timeslot,
    });
  } catch (error) {
    console.error('Error updating pricing:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการแก้ไขราคา',
    });
  }
});

// @route   DELETE /api/timeslots/:id
// @desc    Delete timeslot (soft delete)
// @access  Private/Admin
router.delete('/:id', protect, admin, validateObjectId(), async (req, res) => {
  try {
    const timeslot = await TimeSlot.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!timeslot) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลช่วงเวลา',
      });
    }

    // Check if timeslot has active bookings
    const activeBookings = await Booking.countDocuments({
      timeSlot: req.params.id,
      deletedAt: null,
      bookingStatus: { $ne: 'cancelled' },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `ไม่สามารถลบช่วงเวลาได้ เนื่องจากมีการจองที่ยังใช้งานอยู่ ${activeBookings} รายการ`,
      });
    }

    await timeslot.softDelete();

    res.status(200).json({
      success: true,
      message: 'ลบช่วงเวลาสำเร็จ',
    });
  } catch (error) {
    console.error('Error deleting timeslot:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบช่วงเวลา',
    });
  }
});

module.exports = router;
