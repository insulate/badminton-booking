const express = require('express');
const router = express.Router();
const GroupPlay = require('../models/groupplay.model');
const Player = require('../models/player.model');
const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const Product = require('../models/product.model');
const { protect } = require('../middleware/auth');
const { getLevelName } = require('../constants/playerLevels');

// Protect all routes
router.use(protect);

/**
 * @route   GET /api/groupplay
 * @desc    Get all group play sessions with filters
 * @access  Private
 * @query   date, court, status
 */
router.get('/', async (req, res) => {
  try {
    const { date, court, status } = req.query;

    // Build query
    const query = {};

    if (date) {
      const searchDate = new Date(date);
      query.date = {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lte: new Date(searchDate.setHours(23, 59, 59, 999)),
      };
    }

    if (court) {
      query.court = court;
    }

    if (status) {
      query.status = status;
    }

    const sessions = await GroupPlay.find(query)
      .populate('court', 'name courtNumber')
      .populate('createdBy', 'username')
      .populate('players.player', 'name phone level levelName')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching group play sessions:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล session',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/groupplay
 * @desc    Create a new group play session and block court in calendar
 * @access  Private
 * @body    sessionName, court, date, startTime, endTime, entryFee, recurring, daysOfWeek
 */
router.post('/', async (req, res) => {
  try {
    const { sessionName, court, date, startTime, endTime, entryFee, recurring, daysOfWeek } = req.body;

    // Validate court exists
    const courtDoc = await Court.findById(court);
    if (!courtDoc) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบสนามที่เลือก',
      });
    }

    // Check court availability
    // Note: For recurring sessions, we should check multiple dates
    // For now, we'll check the first date only
    const sessionDate = new Date(date);

    // Check for conflicts with existing bookings
    const existingBookings = await Booking.find({
      court,
      date: sessionDate,
      bookingStatus: { $in: ['confirmed', 'checked-in'] },
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: `สนามถูกจองแล้วในวันที่เลือก`,
      });
    }

    // Create group play session
    const session = await GroupPlay.create({
      sessionName,
      court,
      date: sessionDate,
      startTime,
      endTime,
      entryFee: entryFee || 30,
      recurring: recurring || false,
      daysOfWeek: recurring ? daysOfWeek : [],
      status: 'scheduled',
      createdBy: req.user.id,
    });

    // Create blocking booking in calendar
    // This prevents regular bookings from conflicting with group play sessions
    const booking = await Booking.create({
      customer: {
        name: `ก๊วนสนาม - ${sessionName}`,
        phone: '-',
      },
      court,
      date: sessionDate,
      timeSlot: null, // Group play uses startTime/endTime instead of timeSlots
      duration: 1,
      pricing: {
        subtotal: 0,
        total: 0,
      },
      paymentStatus: 'paid', // Group play handles payment separately
      bookingStatus: 'confirmed',
      notes: `Group Play Session: ${session._id}`,
    });

    const populatedSession = await GroupPlay.findById(session._id)
      .populate('court', 'name courtNumber')
      .populate('createdBy', 'username');

    res.status(201).json({
      success: true,
      message: 'สร้าง session สำเร็จ',
      data: {
        session: populatedSession,
        booking: booking,
      },
    });
  } catch (error) {
    console.error('Error creating group play session:', error);

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
      message: 'เกิดข้อผิดพลาดในการสร้าง session',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/groupplay/:id
 * @desc    Get group play session by ID with full details
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const session = await GroupPlay.findById(req.params.id)
      .populate('court', 'name courtNumber')
      .populate('createdBy', 'username')
      .populate('players.player', 'name phone level levelName')
      .populate('players.games.teammates', 'name level levelName')
      .populate('players.games.opponents', 'name level levelName')
      .populate('players.games.items.product', 'name sku price');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ session',
      });
    }

    // Get session summary
    const summary = session.getSessionSummary();

    res.json({
      success: true,
      data: {
        session,
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching group play session:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล session',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/groupplay/:id/checkin
 * @desc    Check-in a player to the session
 * @access  Private
 * @body    playerId (optional), name, phone, level (optional)
 */
router.post('/:id/checkin', async (req, res) => {
  try {
    const { playerId, name, phone, level } = req.body;

    const session = await GroupPlay.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ session',
      });
    }

    let playerData = {
      name,
      phone: phone.replace(/-/g, ''),
    };

    // If playerId is provided, get player data from database
    if (playerId) {
      const player = await Player.findById(playerId);
      if (player) {
        playerData = {
          player: player._id,
          name: player.name,
          phone: player.phone,
          level: player.level,
          levelName: player.levelName,
        };
      }
    } else {
      // Walk-in player: use provided data
      if (level) {
        playerData.level = level;
        playerData.levelName = getLevelName(level);
      }
    }

    // Add totalCost with entry fee
    playerData.totalCost = session.entryFee;

    // Check in player
    await session.checkInPlayer(playerData);

    const updatedSession = await GroupPlay.findById(session._id)
      .populate('court', 'name courtNumber')
      .populate('players.player', 'name phone level levelName');

    res.json({
      success: true,
      message: 'Check-in สำเร็จ',
      data: updatedSession,
    });
  } catch (error) {
    console.error('Error checking in player:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการ check-in',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/groupplay/:id/entry-fee/:playerId
 * @desc    Mark entry fee as paid
 * @access  Private
 */
router.patch('/:id/entry-fee/:playerId', async (req, res) => {
  try {
    const session = await GroupPlay.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ session',
      });
    }

    await session.markEntryFeePaid(req.params.playerId);

    res.json({
      success: true,
      message: 'บันทึกการชำระค่าเข้าร่วมสำเร็จ',
    });
  } catch (error) {
    console.error('Error marking entry fee as paid:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/groupplay/:id/game/start
 * @desc    Start a new game with selected players
 * @access  Private
 * @body    playerIds (array of session player _ids), teammates (array), opponents (array)
 */
router.post('/:id/game/start', async (req, res) => {
  try {
    const { playerIds, teammates, opponents } = req.body;

    if (!playerIds || playerIds.length < 2 || playerIds.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกผู้เล่น 2-4 คน',
      });
    }

    const session = await GroupPlay.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ session',
      });
    }

    // Validate all players are checked in
    const invalidPlayers = playerIds.filter(
      (id) => !session.players.id(id)
    );

    if (invalidPlayers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'มีผู้เล่นที่ไม่ได้ check-in',
      });
    }

    // Start game
    await session.startGame(playerIds, teammates, opponents);

    const updatedSession = await GroupPlay.findById(session._id)
      .populate('players.player', 'name level levelName');

    res.json({
      success: true,
      message: 'เริ่มเกมสำเร็จ',
      data: updatedSession,
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเริ่มเกม',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/groupplay/:id/game/:playerId/:gameNumber/finish
 * @desc    Finish a game and add items used
 * @access  Private
 * @body    items (array of { product, quantity, price })
 */
router.patch('/:id/game/:playerId/:gameNumber/finish', async (req, res) => {
  try {
    const { items } = req.body;
    const { playerId, gameNumber } = req.params;

    const session = await GroupPlay.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ session',
      });
    }

    // Validate products exist and have enough stock
    if (items && items.length > 0) {
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `ไม่พบสินค้า ID: ${item.product}`,
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `สินค้า ${product.name} มีสต็อกไม่เพียงพอ`,
          });
        }
      }
    }

    // Finish game
    await session.finishGame(playerId, parseInt(gameNumber), items || []);

    // Update product stock
    if (items && items.length > 0) {
      for (const item of items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    const updatedSession = await GroupPlay.findById(session._id)
      .populate('players.player', 'name level levelName')
      .populate('players.games.items.product', 'name sku price');

    res.json({
      success: true,
      message: 'จบเกมสำเร็จ',
      data: updatedSession,
    });
  } catch (error) {
    console.error('Error finishing game:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการจบเกม',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/groupplay/:id/checkout/:playerId
 * @desc    Check out a player and update their stats
 * @access  Private
 */
router.post('/:id/checkout/:playerId', async (req, res) => {
  try {
    const session = await GroupPlay.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ session',
      });
    }

    const sessionPlayer = session.players.id(req.params.playerId);
    if (!sessionPlayer) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้เล่นใน session',
      });
    }

    // Check out player
    await session.checkOutPlayer(req.params.playerId);

    // Update player stats if player is from database (not walk-in)
    if (sessionPlayer.player) {
      const player = await Player.findById(sessionPlayer.player);
      if (player) {
        await player.updateStats(sessionPlayer.games.length, sessionPlayer.totalCost);
      }
    }

    const updatedSession = await GroupPlay.findById(session._id)
      .populate('players.player', 'name phone level levelName');

    res.json({
      success: true,
      message: 'Check-out สำเร็จ',
      data: {
        session: updatedSession,
        totalCost: sessionPlayer.totalCost,
      },
    });
  } catch (error) {
    console.error('Error checking out player:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการ check-out',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/groupplay/:id
 * @desc    Delete a group play session and its associated booking
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const session = await GroupPlay.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ session',
      });
    }

    // Delete associated booking (if exists)
    await Booking.deleteMany({
      notes: { $regex: `Group Play Session: ${session._id}` },
    });

    // Delete session
    await session.deleteOne();

    res.json({
      success: true,
      message: 'ลบ session สำเร็จ',
    });
  } catch (error) {
    console.error('Error deleting group play session:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบ session',
      error: error.message,
    });
  }
});

module.exports = router;
