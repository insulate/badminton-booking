const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const attendanceController = require('../controllers/attendance.controller');

// All routes require authentication
router.use(protect);

// User routes
router.get('/my', attendanceController.getMyAttendance);
router.get('/today', attendanceController.getToday);
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);

// Admin routes
router.get('/', admin, attendanceController.getAll);
router.get('/report', admin, attendanceController.getReport);
router.put('/:id', admin, attendanceController.update);

module.exports = router;
