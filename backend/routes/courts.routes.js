const express = require('express');
const router = express.Router();
const Court = require('../models/court.model');
const { protect, admin } = require('../middleware/auth');

/**
 * @route   GET /api/courts
 * @desc    Get all courts (exclude soft-deleted)
 * @access  Private
 * @query   ?status=available&type=normal
 */
router.get('/', protect, async (req, res) => {
  try {
    const { status, type } = req.query;
    const filters = { deletedAt: null };

    if (status) filters.status = status;
    if (type) filters.type = type;

    const courts = await Court.find(filters).sort({ courtNumber: 1 });

    res.json({
      success: true,
      count: courts.length,
      data: courts,
    });
  } catch (error) {
    console.error('Get courts error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสนาม',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/courts/:id
 * @desc    Get single court by ID
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const court = await Court.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลสนาม',
      });
    }

    res.json({
      success: true,
      data: court,
    });
  } catch (error) {
    console.error('Get court error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสนาม',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/courts
 * @desc    Create new court
 * @access  Private (Admin)
 */
router.post('/', protect, admin, async (req, res) => {
  try {
    const { courtNumber, name, type, status, description, hourlyRate } =
      req.body;

    // Check if court number already exists
    const existingCourt = await Court.findOne({ courtNumber, deletedAt: null });
    if (existingCourt) {
      return res.status(400).json({
        success: false,
        message: 'รหัสสนามนี้มีอยู่ในระบบแล้ว',
      });
    }

    const court = await Court.create({
      courtNumber,
      name,
      type,
      status,
      description,
      hourlyRate,
    });

    res.status(201).json({
      success: true,
      message: 'เพิ่มสนามใหม่สำเร็จ',
      data: court,
    });
  } catch (error) {
    console.error('Create court error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มสนาม',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/courts/:id
 * @desc    Update court
 * @access  Private (Admin)
 */
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const court = await Court.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลสนาม',
      });
    }

    // Check if court number is being changed and if it's already in use
    if (req.body.courtNumber && req.body.courtNumber !== court.courtNumber) {
      const existingCourt = await Court.findOne({
        courtNumber: req.body.courtNumber,
        deletedAt: null,
        _id: { $ne: req.params.id },
      });

      if (existingCourt) {
        return res.status(400).json({
          success: false,
          message: 'รหัสสนามนี้มีอยู่ในระบบแล้ว',
        });
      }
    }

    // Update court fields
    const allowedUpdates = [
      'courtNumber',
      'name',
      'type',
      'status',
      'description',
      'hourlyRate',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        court[field] = req.body[field];
      }
    });

    await court.save();

    res.json({
      success: true,
      message: 'แก้ไขข้อมูลสนามสำเร็จ',
      data: court,
    });
  } catch (error) {
    console.error('Update court error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลสนาม',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/courts/:id
 * @desc    Soft delete court
 * @access  Private (Admin)
 */
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const court = await Court.findOne({
      _id: req.params.id,
      deletedAt: null,
    });

    if (!court) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลสนาม',
      });
    }

    // Soft delete
    await court.softDelete();

    res.json({
      success: true,
      message: 'ลบสนามสำเร็จ',
      data: court,
    });
  } catch (error) {
    console.error('Delete court error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบสนาม',
      error: error.message,
    });
  }
});

module.exports = router;
