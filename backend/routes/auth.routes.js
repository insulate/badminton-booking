const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  updateProfile,
  changePassword,
  playerRegister,
  playerLogin,
  getPlayerMe
} = require('../controllers/auth.controller');
const { protect, protectPlayer } = require('../middleware/auth');
const { authLimiter, strictLimiter } = require('../middleware/rateLimiter');

// Admin/Staff routes
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, strictLimiter, changePassword);

// Player routes
router.post('/player/register', playerRegister);
router.post('/player/login', authLimiter, playerLogin);
router.get('/player/me', protectPlayer, getPlayerMe);

module.exports = router;
