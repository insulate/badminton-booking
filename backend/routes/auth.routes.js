const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { authLimiter, strictLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/login', authLimiter, login);

// Private routes (require authentication)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, strictLimiter, changePassword);

module.exports = router;
