const express = require('express');
const router = express.Router();
const Setting = require('../models/setting.model');
const { protect, admin } = require('../middleware/auth');
const { uploadVenue, deleteImage } = require('../middleware/upload');

/**
 * @route   GET /api/settings
 * @desc    Get system settings
 * @access  Private (Admin)
 */
router.get('/', protect, admin, async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/settings
 * @desc    Update all settings
 * @access  Private (Admin)
 */
router.put('/', protect, admin, async (req, res) => {
  try {
    let settings = await Setting.findOne();

    // Whitelist allowed fields to prevent mass assignment vulnerabilities
    const allowedFields = ['venue', 'operating', 'booking', 'payment', 'general', 'playerLevels'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (!settings) {
      // Create new settings if none exist
      settings = new Setting(updateData);
    } else {
      // Update existing settings with whitelisted fields only
      Object.assign(settings, updateData);
    }

    await settings.save();

    res.json({
      success: true,
      message: 'อัพเดทการตั้งค่าสำเร็จ',
      data: settings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/settings/venue
 * @desc    Update venue settings only
 * @access  Private (Admin)
 */
router.patch('/venue', protect, admin, async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    settings.venue = {
      ...settings.venue,
      ...req.body,
    };

    await settings.save();

    res.json({
      success: true,
      message: 'อัพเดทข้อมูลสนามสำเร็จ',
      data: settings.venue,
    });
  } catch (error) {
    console.error('Update venue settings error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลสนาม',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/settings/operating
 * @desc    Update operating hours settings
 * @access  Private (Admin)
 */
router.patch('/operating', protect, admin, async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    settings.operating = {
      ...settings.operating,
      ...req.body,
    };

    await settings.save();

    res.json({
      success: true,
      message: 'อัพเดทเวลาทำการสำเร็จ',
      data: settings.operating,
    });
  } catch (error) {
    console.error('Update operating hours error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทเวลาทำการ',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/settings/booking
 * @desc    Update booking settings
 * @access  Private (Admin)
 */
router.patch('/booking', protect, admin, async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    settings.booking = {
      ...settings.booking,
      ...req.body,
    };

    await settings.save();

    res.json({
      success: true,
      message: 'อัพเดทการตั้งค่าการจองสำเร็จ',
      data: settings.booking,
    });
  } catch (error) {
    console.error('Update booking settings error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่าการจอง',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/settings/payment
 * @desc    Update payment settings
 * @access  Private (Admin)
 */
router.patch('/payment', protect, admin, async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    // Handle nested bankAccount object properly
    const updatedPayment = {
      ...settings.payment.toObject(),
      ...req.body,
    };

    // If bankAccount is being updated, merge it with existing values
    if (req.body.bankAccount) {
      updatedPayment.bankAccount = {
        ...settings.payment.bankAccount.toObject(),
        ...req.body.bankAccount,
      };
    }

    settings.payment = updatedPayment;

    await settings.save();

    res.json({
      success: true,
      message: 'อัพเดทการตั้งค่าการชำระเงินสำเร็จ',
      data: settings.payment,
    });
  } catch (error) {
    console.error('Update payment settings error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่าการชำระเงิน',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/settings/general
 * @desc    Update general settings
 * @access  Private (Admin)
 */
router.patch('/general', protect, admin, async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    settings.general = {
      ...settings.general,
      ...req.body,
    };

    await settings.save();

    res.json({
      success: true,
      message: 'อัพเดทการตั้งค่าทั่วไปสำเร็จ',
      data: settings.general,
    });
  } catch (error) {
    console.error('Update general settings error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่าทั่วไป',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/settings/reset
 * @desc    Reset settings to default
 * @access  Private (Admin)
 */
router.post('/reset', protect, admin, async (req, res) => {
  try {
    // Delete existing settings
    await Setting.deleteMany({});

    // Create new default settings
    const settings = await Setting.create({});

    res.json({
      success: true,
      message: 'รีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นสำเร็จ',
      data: settings,
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการรีเซ็ตการตั้งค่า',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/settings/venue-info
 * @desc    Get venue, operating hours, and booking settings (Public - for customers)
 * @access  Public
 */
router.get('/venue-info', async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    res.json({
      success: true,
      data: {
        venue: {
          name: settings.venue?.name || '',
          phone: settings.venue?.phone || '',
          email: settings.venue?.email || '',
          address: settings.venue?.address || '',
          lineId: settings.venue?.lineId || '',
        },
        operating: {
          openTime: settings.operating?.openTime || '09:00',
          closeTime: settings.operating?.closeTime || '22:00',
          daysOpen: settings.operating?.daysOpen || [],
        },
        booking: {
          advanceBookingDays: settings.booking?.advanceBookingDays || 7,
        },
      },
    });
  } catch (error) {
    console.error('Get venue info error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสนาม',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/settings/player-levels
 * @desc    Get player levels (Public - for player registration and display)
 * @access  Public
 */
router.get('/player-levels', async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    res.json({
      success: true,
      data: settings.playerLevels || [],
    });
  } catch (error) {
    console.error('Get player levels error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลระดับมือ',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/settings/player-levels
 * @desc    Update player levels
 * @access  Private (Admin)
 */
router.patch('/player-levels', protect, admin, async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    const { levels } = req.body;

    if (!Array.isArray(levels) || levels.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุระดับมืออย่างน้อย 1 ระดับ',
      });
    }

    // Validate each level
    for (const level of levels) {
      if (!level.value || !level.name) {
        return res.status(400).json({
          success: false,
          message: 'แต่ละระดับต้องมี value และ name',
        });
      }
    }

    // Check for duplicate values
    const values = levels.map((l) => l.value);
    if (new Set(values).size !== values.length) {
      return res.status(400).json({
        success: false,
        message: 'ค่า value ของแต่ละระดับต้องไม่ซ้ำกัน',
      });
    }

    settings.playerLevels = levels;
    await settings.save();

    res.json({
      success: true,
      message: 'อัพเดทระดับมือสำเร็จ',
      data: settings.playerLevels,
    });
  } catch (error) {
    console.error('Update player levels error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทระดับมือ',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/settings/floor-plan
 * @desc    Get floor plan image (Public - for customers)
 * @access  Public
 */
router.get('/floor-plan', async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    res.json({
      success: true,
      data: {
        floorPlanImage: settings.venue?.floorPlanImage || '',
      },
    });
  } catch (error) {
    console.error('Get floor plan error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรูปแผนผัง',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/settings/floor-plan
 * @desc    Upload floor plan image
 * @access  Private (Admin)
 */
router.post('/floor-plan', protect, admin, uploadVenue.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกไฟล์รูปภาพ',
      });
    }

    const settings = await Setting.getSettings();

    // Delete old image if exists
    if (settings.venue?.floorPlanImage) {
      await deleteImage(settings.venue.floorPlanImage);
    }

    // Update with new image path
    const imagePath = `/uploads/venue/${req.file.filename}`;
    settings.venue.floorPlanImage = imagePath;
    await settings.save();

    res.json({
      success: true,
      message: 'อัพโหลดรูปแผนผังสำเร็จ',
      data: {
        floorPlanImage: imagePath,
      },
    });
  } catch (error) {
    console.error('Upload floor plan error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปแผนผัง',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/settings/floor-plan
 * @desc    Delete floor plan image
 * @access  Private (Admin)
 */
router.delete('/floor-plan', protect, admin, async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    // Delete image file if exists
    if (settings.venue?.floorPlanImage) {
      await deleteImage(settings.venue.floorPlanImage);
    }

    // Clear image path in database
    settings.venue.floorPlanImage = '';
    await settings.save();

    res.json({
      success: true,
      message: 'ลบรูปแผนผังสำเร็จ',
    });
  } catch (error) {
    console.error('Delete floor plan error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบรูปแผนผัง',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/settings/qr-code
 * @desc    Upload QR Code image for payment
 * @access  Private (Admin)
 */
router.post('/qr-code', protect, admin, uploadVenue.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกไฟล์รูปภาพ',
      });
    }

    const settings = await Setting.getSettings();

    // Delete old image if exists
    if (settings.payment?.qrCodeImage) {
      await deleteImage(settings.payment.qrCodeImage);
    }

    // Update with new image path
    const imagePath = `/uploads/venue/${req.file.filename}`;
    settings.payment.qrCodeImage = imagePath;
    await settings.save();

    res.json({
      success: true,
      message: 'อัพโหลด QR Code สำเร็จ',
      data: {
        qrCodeImage: imagePath,
      },
    });
  } catch (error) {
    console.error('Upload QR Code error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพโหลด QR Code',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/settings/qr-code
 * @desc    Delete QR Code image
 * @access  Private (Admin)
 */
router.delete('/qr-code', protect, admin, async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    // Delete image file if exists
    if (settings.payment?.qrCodeImage) {
      await deleteImage(settings.payment.qrCodeImage);
    }

    // Clear image path in database
    settings.payment.qrCodeImage = '';
    await settings.save();

    res.json({
      success: true,
      message: 'ลบ QR Code สำเร็จ',
    });
  } catch (error) {
    console.error('Delete QR Code error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบ QR Code',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/settings/payment-info
 * @desc    Get payment info for customers (PromptPay, Bank Account)
 * @access  Public
 */
router.get('/payment-info', async (req, res) => {
  try {
    const settings = await Setting.getSettings();

    res.json({
      success: true,
      data: {
        promptPayNumber: settings.payment?.promptPayNumber || '',
        qrCodeImage: settings.payment?.qrCodeImage || '',
        bankAccount: {
          bankName: settings.payment?.bankAccount?.bankName || '',
          accountNumber: settings.payment?.bankAccount?.accountNumber || '',
          accountName: settings.payment?.bankAccount?.accountName || '',
        },
        acceptPromptPay: settings.payment?.acceptPromptPay ?? false,
        acceptTransfer: settings.payment?.acceptTransfer ?? false,
        acceptQRCode: settings.payment?.acceptQRCode ?? false,
      },
    });
  } catch (error) {
    console.error('Get payment info error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการชำระเงิน',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/settings/blocked-dates
 * @desc    Get all blocked dates
 * @access  Public (for customers to see which dates are blocked)
 */
router.get('/blocked-dates', async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    const blockedDates = settings.booking?.blockedDates || [];

    // Sort by date ascending
    const sortedDates = [...blockedDates].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json({
      success: true,
      data: sortedDates.map((entry) => ({
        date: entry.date,
        reason: entry.reason || '',
        createdAt: entry.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get blocked dates error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลวันปิดการจอง',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/settings/blocked-dates
 * @desc    Add a new blocked date
 * @access  Private (Admin)
 */
router.post('/blocked-dates', protect, admin, async (req, res) => {
  try {
    const { date, reason } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุวันที่',
      });
    }

    // Validate date format
    const blockedDate = new Date(date);
    if (isNaN(blockedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบวันที่ไม่ถูกต้อง',
      });
    }

    // Normalize date to start of day
    blockedDate.setHours(0, 0, 0, 0);

    const settings = await Setting.getSettings();

    // Check if date already exists
    const existingDate = settings.booking.blockedDates.find((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === blockedDate.getTime();
    });

    if (existingDate) {
      return res.status(400).json({
        success: false,
        message: 'วันนี้ถูกปิดการจองไปแล้ว',
      });
    }

    // Add new blocked date
    settings.booking.blockedDates.push({
      date: blockedDate,
      reason: reason || '',
      createdAt: new Date(),
    });

    await settings.save();

    res.status(201).json({
      success: true,
      message: 'เพิ่มวันปิดการจองสำเร็จ',
      data: {
        date: blockedDate,
        reason: reason || '',
      },
    });
  } catch (error) {
    console.error('Add blocked date error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มวันปิดการจอง',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/settings/blocked-dates/:date
 * @desc    Remove a blocked date
 * @access  Private (Admin)
 */
router.delete('/blocked-dates/:date', protect, admin, async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'รูปแบบวันที่ไม่ถูกต้อง',
      });
    }

    // Normalize date to start of day
    targetDate.setHours(0, 0, 0, 0);

    const settings = await Setting.getSettings();

    // Find and remove the blocked date
    const initialLength = settings.booking.blockedDates.length;
    settings.booking.blockedDates = settings.booking.blockedDates.filter((entry) => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() !== targetDate.getTime();
    });

    if (settings.booking.blockedDates.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบวันปิดการจองที่ระบุ',
      });
    }

    await settings.save();

    res.json({
      success: true,
      message: 'ลบวันปิดการจองสำเร็จ',
    });
  } catch (error) {
    console.error('Delete blocked date error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบวันปิดการจอง',
      error: error.message,
    });
  }
});

module.exports = router;
