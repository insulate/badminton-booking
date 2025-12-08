const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const Player = require('../models/player.model');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Helper: Normalize phone number (remove dashes)
const normalizePhone = (phone) => {
  return phone.replace(/-/g, '');
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Check for user (include password for comparison)
    const user = await UserModel.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is deleted
    if (user.deletedAt) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deleted'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await UserModel.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;

    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = await UserModel.findById(req.user._id).select('+password');

    // Check current password
    const isPasswordMatch = await user.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: {
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Register player
// @route   POST /api/auth/player/register
// @access  Public
const playerRegister = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Validate input
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อ เบอร์โทร และรหัสผ่าน'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // Check if player already exists
    const existingPlayer = await Player.findOne({ phone: normalizedPhone });
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        message: 'เบอร์โทรนี้ถูกใช้งานแล้ว'
      });
    }

    // Create player
    const player = await Player.create({
      name,
      phone: normalizedPhone,
      password
    });

    // Generate token
    const token = generateToken(player._id);

    res.status(201).json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      data: {
        _id: player._id,
        name: player.name,
        phone: player.phone,
        isMember: player.isMember,
        token
      }
    });
  } catch (error) {
    console.error('Player register error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
    });
  }
};

// @desc    Login player
// @route   POST /api/auth/player/login
// @access  Public
const playerLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกเบอร์โทรและรหัสผ่าน'
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // Check for player (include password for comparison)
    const player = await Player.findOne({ 
      phone: normalizedPhone,
      isDeleted: false 
    }).select('+password');

    if (!player) {
      return res.status(401).json({
        success: false,
        message: 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    if (player.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'บัญชีถูกระงับการใช้งาน'
      });
    }

    if (!player.password) {
      return res.status(401).json({
        success: false,
        message: 'บัญชีนี้ยังไม่ได้ตั้งรหัสผ่าน กรุณาติดต่อเจ้าหน้าที่'
      });
    }

    // Check password
    const isPasswordMatch = await player.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: player._id,
        name: player.name,
        phone: player.phone,
        isMember: player.isMember,
        token: generateToken(player._id)
      }
    });
  } catch (error) {
    console.error('Player login error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    });
  }
};

// @desc    Get current logged in player
// @route   GET /api/auth/player/me
// @access  Private (Player)
const getPlayerMe = async (req, res) => {
  try {
    const player = await Player.findById(req.player._id);

    res.status(200).json({
      success: true,
      data: player
    });
  } catch (error) {
    console.error('Get player me error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    });
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword,
  playerRegister,
  playerLogin,
  getPlayerMe
};
