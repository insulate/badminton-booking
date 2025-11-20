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
 * @desc    Get all group play rules with filters
 * @access  Private
 * @query   court, isActive
 */
router.get('/', async (req, res) => {
  try {
    const { court, isActive } = req.query;

    // Build query
    const query = {};

    if (court) {
      query.courts = court;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const rules = await GroupPlay.find(query)
      .populate('courts', 'name courtNumber')
      .populate('createdBy', 'username')
      .populate('players.player', 'name phone level levelName')
      .populate('players.games.court', 'name courtNumber')
      .populate('players.standaloneItems.product', 'name sku price')
      .sort({ sessionName: 1, startTime: 1 });

    res.json({
      success: true,
      count: rules.length,
      data: rules,
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
 * @desc    Create a new group play rule
 * @access  Private
 * @body    sessionName, courts, daysOfWeek, startTime, endTime, entryFee
 */
router.post('/', async (req, res) => {
  try {
    const { sessionName, courts, daysOfWeek, startTime, endTime, entryFee } = req.body;

    // Debug logging
    console.log('Creating group play rule with data:', {
      sessionName,
      courts,
      courtsType: typeof courts,
      courtsIsArray: Array.isArray(courts),
      daysOfWeek,
      startTime,
      endTime,
      entryFee,
    });

    // Validate required fields
    if (!sessionName || !courts || courts.length === 0 || !daysOfWeek || daysOfWeek.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, สนาม, วันในสัปดาห์)',
      });
    }

    // Validate all courts exist
    console.log('Validating courts:', courts);
    const courtDocs = await Court.find({ _id: { $in: courts } });
    console.log('Found court docs:', courtDocs.length, 'Expected:', courts.length);

    if (courtDocs.length !== courts.length) {
      console.log('Court validation failed. Requested courts:', courts);
      console.log('Found courts:', courtDocs.map(c => c._id.toString()));
      return res.status(404).json({
        success: false,
        message: 'ไม่พบสนามบางสนามที่เลือก',
      });
    }

    // Create group play rule
    const rule = await GroupPlay.create({
      sessionName,
      courts,
      daysOfWeek,
      startTime,
      endTime,
      entryFee: entryFee || 30,
      status: 'scheduled',
      isActive: true,
      createdBy: req.user.id,
    });

    const populatedRule = await GroupPlay.findById(rule._id)
      .populate('courts', 'name courtNumber')
      .populate('createdBy', 'username');

    res.status(201).json({
      success: true,
      message: 'สร้างกฎก๊วนสนามสำเร็จ',
      data: populatedRule,
    });
  } catch (error) {
    console.error('Error creating group play rule:', error);

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
      message: 'เกิดข้อผิดพลาดในการสร้างกฎก๊วนสนาม',
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
      .populate('courts', 'name courtNumber')
      .populate('createdBy', 'username')
      .populate('players.player', 'name phone level levelName')
      .populate('players.games.court', 'name courtNumber')
      .populate('players.games.teammates', 'name level levelName')
      .populate('players.games.opponents', 'name level levelName')
      .populate('players.games.items.product', 'name sku price')
      .populate('players.standaloneItems.product', 'name sku price');

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
      phone,
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
      .populate('courts', 'name courtNumber')
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
      message: error.message || 'เกิดข้อผิดพลาดในการ check-in',
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
 * @body    playerIds (array of session player _ids), courtId, teammates (array), opponents (array)
 */
router.post('/:id/game/start', async (req, res) => {
  try {
    const { playerIds, courtId, teammates, opponents } = req.body;

    if (!playerIds || playerIds.length < 2 || playerIds.length > 4) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกผู้เล่น 2-4 คน',
      });
    }

    if (!courtId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกสนาม',
      });
    }

    const session = await GroupPlay.findById(req.params.id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ session',
      });
    }

    // Validate court is in session's courts
    const isValidCourt = session.courts.some(
      (court) => court._id.toString() === courtId
    );

    if (!isValidCourt) {
      return res.status(400).json({
        success: false,
        message: 'สนามที่เลือกไม่อยู่ในกฎก๊วนนี้',
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
    await session.startGame(playerIds, courtId, teammates, opponents);

    const updatedSession = await GroupPlay.findById(session._id)
      .populate('players.player', 'name level levelName')
      .populate('players.games.court', 'name courtNumber');

    res.json({
      success: true,
      message: 'เริ่มเกมสำเร็จ',
      data: updatedSession,
    });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการเริ่มเกม',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/groupplay/:id/game/:gameNumber/players
 * @desc    Update players in an active game
 * @access  Private
 * @body    playerIds (array of session player _ids)
 */
router.patch('/:id/game/:gameNumber/players', async (req, res) => {
  try {
    const { playerIds } = req.body;
    const { gameNumber } = req.params;

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

    // Update game players
    await session.updateGamePlayers(parseInt(gameNumber), playerIds);

    const updatedSession = await GroupPlay.findById(session._id)
      .populate('players.player', 'name level levelName')
      .populate('players.games.court', 'name courtNumber');

    res.json({
      success: true,
      message: 'อัปเดตผู้เล่นสำเร็จ',
      data: updatedSession,
    });
  } catch (error) {
    console.error('Error updating game players:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการอัปเดตผู้เล่น',
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
 * @route   POST /api/groupplay/:id/player/:playerId/products
 * @desc    Add product costs to a player
 * @access  Private
 * @body    items (array of { product, quantity, price })
 */
router.post('/:id/player/:playerId/products', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ',
      });
    }

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

    // Validate products exist and have enough stock
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
          message: `สินค้า ${product.name} มีสต็อกไม่เพียงพอ (คงเหลือ: ${product.stock})`,
        });
      }
    }

    // Calculate total cost from items
    let totalItemsCost = 0;
    for (const item of items) {
      totalItemsCost += item.price * item.quantity;
    }

    // Add items to player's standalone items and update total cost
    if (!sessionPlayer.standaloneItems) {
      sessionPlayer.standaloneItems = [];
    }

    items.forEach(item => {
      sessionPlayer.standaloneItems.push({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
      });
    });

    sessionPlayer.totalCost = (sessionPlayer.totalCost || 0) + totalItemsCost;

    await session.save();

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    const updatedSession = await GroupPlay.findById(session._id)
      .populate('players.player', 'name phone level levelName')
      .populate('players.standaloneItems.product', 'name sku price');

    res.json({
      success: true,
      message: 'เพิ่มค่าใช้จ่ายสินค้าสำเร็จ',
      data: updatedSession,
    });
  } catch (error) {
    console.error('Error adding player products:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มค่าใช้จ่ายสินค้า',
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

    // Check if player has any playing games
    const hasPlayingGames = sessionPlayer.games.some(g => g.status === 'playing');
    if (hasPlayingGames) {
      return res.status(400).json({
        success: false,
        message: 'ผู้เล่นกำลังอยู่ในเกม กรุณาจบเกมก่อน Check Out',
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
 * @route   PATCH /api/groupplay/:id
 * @desc    Update group play rule (toggle active status or update fields)
 * @access  Private
 * @body    isActive, sessionName, courts, daysOfWeek, startTime, endTime, entryFee (all optional)
 */
router.patch('/:id', async (req, res) => {
  try {
    const rule = await GroupPlay.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบกฎก๊วนสนาม',
      });
    }

    const { isActive, sessionName, courts, daysOfWeek, startTime, endTime, entryFee } = req.body;

    // Validate courts if provided
    if (courts && courts.length > 0) {
      const courtDocs = await Court.find({ _id: { $in: courts } });
      if (courtDocs.length !== courts.length) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบสนามบางสนามที่เลือก',
        });
      }
      rule.courts = courts;
    }

    // Update fields if provided
    if (isActive !== undefined) rule.isActive = isActive;
    if (sessionName) rule.sessionName = sessionName;
    if (daysOfWeek && daysOfWeek.length > 0) rule.daysOfWeek = daysOfWeek;
    if (startTime) rule.startTime = startTime;
    if (endTime) rule.endTime = endTime;
    if (entryFee !== undefined) rule.entryFee = entryFee;

    await rule.save({ validateModifiedOnly: true });

    const updatedRule = await GroupPlay.findById(rule._id)
      .populate('courts', 'name courtNumber')
      .populate('createdBy', 'username');

    res.json({
      success: true,
      message: 'อัปเดตกฎก๊วนสนามสำเร็จ',
      data: updatedRule,
    });
  } catch (error) {
    console.error('Error updating group play rule:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      console.error('Validation errors:', messages);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตกฎก๊วนสนาม',
      error: error.message,
    });
  }
});

module.exports = router;
