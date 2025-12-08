const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const Player = require('../models/player.model');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      req.user = await UserModel.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (req.user.deletedAt) {
        return res.status(401).json({
          success: false,
          message: 'User account has been deleted'
        });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Admin only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as admin'
    });
  }
};

// Protect routes for Players - verify JWT token
const protectPlayer = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get player from token (exclude password)
      req.player = await Player.findById(decoded.id).select('-password');

      if (!req.player) {
        return res.status(401).json({
          success: false,
          message: 'Player not found'
        });
      }

      if (req.player.isDeleted) {
        return res.status(401).json({
          success: false,
          message: 'Player account has been deleted'
        });
      }

      if (req.player.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Player account is inactive'
        });
      }

      next();
    } catch (error) {
      console.error('Player auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

module.exports = { protect, admin, protectPlayer };
