const express = require('express');
const router = express.Router();
const Setting = require('../models/setting.model');
const { protect, admin } = require('../middleware/auth');

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
    const allowedFields = ['venue', 'operating', 'booking', 'payment', 'general'];
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

module.exports = router;
