const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const shiftController = require('../controllers/shift.controller');

// All routes require authentication
router.use(protect);

// User routes
router.get('/current', shiftController.getCurrent);
router.post('/open', shiftController.openShift);
router.get('/:id', shiftController.getById);
router.get('/:id/summary', shiftController.getSummary);
router.post('/:id/expense', shiftController.addExpense);
router.delete('/:id/expense/:expenseId', shiftController.removeExpense);
router.post('/:id/close', shiftController.closeShift);

// Admin routes
router.get('/', admin, shiftController.getAll);
router.get('/report', admin, shiftController.getReport);
router.put('/:id', admin, shiftController.update);

module.exports = router;
