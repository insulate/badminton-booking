const express = require('express');
const router = express.Router();
const Player = require('../models/player.model');
const { protect } = require('../middleware/auth');
const { getLevelName } = require('../constants/playerLevels');

// Protect all routes
router.use(protect);

/**
 * @route   GET /api/players
 * @desc    Get all players with filters
 * @access  Private
 * @query   level, status, search (name or phone), includeDeleted
 */
router.get('/', async (req, res) => {
  try {
    const { level, status, search, includeDeleted } = req.query;

    // Build query - show only deleted when includeDeleted is true
    const query = {
      isDeleted: includeDeleted === 'true' ? true : false
    };

    if (level) {
      query.level = level;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      // Search by name or phone
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search.replace(/-/g, ''), $options: 'i' } },
      ];
    }

    const players = await Player.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: players.length,
      data: players,
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้เล่น',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/players
 * @desc    Create a new player
 * @access  Private
 * @body    name, phone, level (optional), password (optional), notes (optional)
 */
router.post('/', async (req, res) => {
  try {
    const { name, phone, level, password, notes } = req.body;

    // Check if required fields are provided
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกเบอร์โทรศัพท์',
      });
    }

    // Check if player with same phone already exists
    const existingPlayer = await Player.findOne({ phone: phone.replace(/-/g, '') });
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        message: 'มีผู้เล่นที่ใช้เบอร์โทรนี้แล้ว',
      });
    }

    // Create player data
    const playerData = {
      name,
      phone: phone.replace(/-/g, ''),
      notes: notes || '',
    };

    // Add level if provided
    if (level) {
      playerData.level = level;
      playerData.levelName = getLevelName(level);
    }

    // Add password if provided
    if (password) {
      playerData.password = password;
    }

    const player = await Player.create(playerData);

    res.status(201).json({
      success: true,
      message: 'เพิ่มผู้เล่นสำเร็จ',
      data: player,
    });
  } catch (error) {
    console.error('Error creating player:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มผู้เล่น',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/players/stats/:id
 * @desc    Get player statistics
 * @access  Private
 */
router.get('/stats/:id', async (req, res) => {
  try {
    const player = await Player.findOne({ _id: req.params.id, isDeleted: false });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้เล่น',
      });
    }

    const stats = {
      player: {
        id: player._id,
        name: player.name,
        phone: player.phone,
        level: player.level,
        levelName: player.levelName,
      },
      stats: player.stats,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสถิติผู้เล่น',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/players/:id
 * @desc    Get player by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findOne({ _id: req.params.id, isDeleted: false });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้เล่น',
      });
    }

    res.json({
      success: true,
      data: player,
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้เล่น',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/players/:id
 * @desc    Update player
 * @access  Private
 * @body    name, phone, level, notes, status
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, level, notes, status, password } = req.body;

    const player = await Player.findOne({ _id: req.params.id, isDeleted: false });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้เล่น',
      });
    }

    // Check if phone is being changed and if it's already used
    if (phone && phone.replace(/-/g, '') !== player.phone) {
      const existingPlayer = await Player.findOne({
        phone: phone.replace(/-/g, ''),
        _id: { $ne: req.params.id },
      });

      if (existingPlayer) {
        return res.status(400).json({
          success: false,
          message: 'มีผู้เล่นที่ใช้เบอร์โทรนี้แล้ว',
        });
      }
    }

    // Update fields
    if (name) player.name = name;
    if (phone) player.phone = phone.replace(/-/g, '');
    if (level !== undefined) {
      player.level = level;
      player.levelName = getLevelName(level);
    }
    if (notes !== undefined) player.notes = notes;
    if (status) player.status = status;
    if (password) player.password = password;

    await player.save();

    res.json({
      success: true,
      message: 'อัพเดทข้อมูลผู้เล่นสำเร็จ',
      data: player,
    });
  } catch (error) {
    console.error('Error updating player:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทผู้เล่น',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/players/:id
 * @desc    Soft delete player
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id).select('+isDeleted +deletedAt');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้เล่น',
      });
    }

    // Check if already deleted
    if (player.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'ผู้เล่นถูกลบไปแล้ว',
      });
    }

    // Soft delete
    player.isDeleted = true;
    player.deletedAt = new Date();
    await player.save();

    res.json({
      success: true,
      message: 'ลบผู้เล่นสำเร็จ',
    });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบผู้เล่น',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/players/:id/restore
 * @desc    Restore a soft-deleted player
 * @access  Private
 */
router.post('/:id/restore', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id).select('+isDeleted +deletedAt');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้เล่น',
      });
    }

    // Check if not deleted
    if (!player.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'ผู้เล่นนี้ยังไม่ได้ถูกลบ',
      });
    }

    // Restore player
    player.isDeleted = false;
    player.deletedAt = null;
    await player.save();

    res.json({
      success: true,
      message: 'กู้คืนข้อมูลผู้เล่นสำเร็จ',
      data: player,
    });
  } catch (error) {
    console.error('Error restoring player:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการกู้คืนข้อมูลผู้เล่น',
      error: error.message,
    });
  }
});

module.exports = router;
