const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const {
  previewRecurringBooking,
  createRecurringBooking,
  getRecurringBookings,
  getRecurringBookingById,
  getBookingsInGroup,
  cancelRecurringBooking,
  updateBulkPayment,
} = require('../controllers/recurringBookings.controller');

/**
 * @route   POST /api/recurring-bookings/preview
 * @desc    Preview recurring booking (show dates and pricing)
 * @access  Private (Admin/Staff)
 */
router.post('/preview', protect, previewRecurringBooking);

/**
 * @route   POST /api/recurring-bookings
 * @desc    Create recurring booking group
 * @access  Private (Admin/Staff)
 */
router.post('/', protect, createRecurringBooking);

/**
 * @route   GET /api/recurring-bookings
 * @desc    Get all recurring booking groups
 * @access  Private (Admin/Staff)
 */
router.get('/', protect, getRecurringBookings);

/**
 * @route   GET /api/recurring-bookings/:id
 * @desc    Get recurring booking group by ID
 * @access  Private (Admin/Staff)
 */
router.get('/:id', protect, validateObjectId(), getRecurringBookingById);

/**
 * @route   GET /api/recurring-bookings/:id/bookings
 * @desc    Get all bookings in a recurring group
 * @access  Private (Admin/Staff)
 */
router.get('/:id/bookings', protect, validateObjectId(), getBookingsInGroup);

/**
 * @route   PATCH /api/recurring-bookings/:id/cancel
 * @desc    Cancel recurring booking group
 * @access  Private (Admin/Staff)
 */
router.patch('/:id/cancel', protect, validateObjectId(), cancelRecurringBooking);

/**
 * @route   PATCH /api/recurring-bookings/:id/payment
 * @desc    Update bulk payment for recurring booking group
 * @access  Private (Admin/Staff)
 */
router.patch('/:id/payment', protect, validateObjectId, updateBulkPayment);

module.exports = router;
