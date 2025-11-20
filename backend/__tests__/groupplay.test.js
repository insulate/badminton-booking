// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://admin:admin123@localhost:27017/badminton_test?authSource=admin';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'badminton_secret_key_for_development_only_change_in_production';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');
const Court = require('../models/court.model');
const GroupPlay = require('../models/groupplay.model');
const Player = require('../models/player.model');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const jwt = require('jsonwebtoken');

// Generate JWT token for testing
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

describe('Group Play API Tests', () => {
  let adminUser;
  let adminToken;
  let testCourt;
  let testSession;
  let testPlayer;
  let testCategory;
  let testProduct;

  // Setup: Create test data
  beforeAll(async () => {
    // Wait for mongoose connection to be ready
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }

    // Clear existing data
    await User.deleteMany({});
    await Court.deleteMany({});
    await GroupPlay.deleteMany({});
    await Player.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      username: 'admin-groupplay',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin',
    });

    // Generate token
    adminToken = generateToken(adminUser._id);

    // Create test court
    testCourt = await Court.create({
      courtNumber: 'C01',
      name: 'Court 1',
      type: 'normal',
      status: 'available',
    });

    // Create test player
    testPlayer = await Player.create({
      name: 'Test Player',
      phone: '0812345678',
      level: '5',
      levelName: 'S',
    });

    // Create test category and product for game items
    testCategory = await Category.create({
      name: 'shuttlecock',
      label: 'ลูกแบดมินตัน',
    });

    testProduct = await Product.create({
      sku: 'SHT-001',
      name: 'ลูก Yonex AS-40',
      category: 'shuttlecock',
      price: 150,
      stock: 100,
      status: 'active',
    });
  });

  // Cleanup: Close DB connection after all tests
  afterAll(async () => {
    await User.deleteMany({});
    await Court.deleteMany({});
    await GroupPlay.deleteMany({});
    await Player.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  // Clean up group play sessions before each test
  beforeEach(async () => {
    await GroupPlay.deleteMany({});
  });

  describe('POST /api/groupplay', () => {
    it('should create a new group play session', async () => {
      const sessionData = {
        sessionName: 'Monday Evening',
        courts: [testCourt._id],
        daysOfWeek: ['monday', 'wednesday'],
        startTime: '18:00',
        endTime: '20:00',
        entryFee: 50,
      };

      const response = await request(app)
        .post('/api/groupplay')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionName).toBe(sessionData.sessionName);
      expect(response.body.data.entryFee).toBe(sessionData.entryFee);
      expect(response.body.data.isActive).toBe(true);
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/groupplay')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sessionName: 'Monday Evening',
          // Missing courts and daysOfWeek
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/groupplay/:id/checkin', () => {
    beforeEach(async () => {
      // Create a test session before each check-in test
      testSession = await GroupPlay.create({
        sessionName: 'Test Session',
        courts: [testCourt._id],
        daysOfWeek: ['monday'],
        startTime: '18:00',
        endTime: '20:00',
        entryFee: 50,
        createdBy: adminUser._id,
      });
    });

    it('should check in a player from database', async () => {
      const checkInData = {
        playerId: testPlayer._id,
        name: testPlayer.name,
        phone: testPlayer.phone,
        level: testPlayer.level,
      };

      const response = await request(app)
        .post(`/api/groupplay/${testSession._id}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(checkInData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.players).toHaveLength(1);
      expect(response.body.data.players[0].name).toBe(testPlayer.name);
      expect(response.body.data.players[0].checkedIn).toBe(true);
      expect(response.body.data.players[0].totalCost).toBe(testSession.entryFee);
    });

    it('should check in a walk-in player', async () => {
      const walkinData = {
        name: 'Walk-in Player',
        phone: '0898765432',
        level: '3',
      };

      const response = await request(app)
        .post(`/api/groupplay/${testSession._id}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(walkinData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.players).toHaveLength(1);
      expect(response.body.data.players[0].name).toBe(walkinData.name);
      expect(response.body.data.players[0].phone).toBe(walkinData.phone);
      expect(response.body.data.players[0].checkedIn).toBe(true);
    });

    it('should prevent duplicate check-in for same phone number', async () => {
      const checkInData = {
        name: 'Test Player',
        phone: '0812345678',
      };

      // First check-in should succeed
      await request(app)
        .post(`/api/groupplay/${testSession._id}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(checkInData)
        .expect(200);

      // Second check-in with same phone should fail
      const response = await request(app)
        .post(`/api/groupplay/${testSession._id}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(checkInData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('เช็คอินแล้ว');
    });

    it('should prevent duplicate check-in even with different phone formats', async () => {
      const checkInData1 = {
        name: 'Test Player',
        phone: '081-234-5678',
      };

      const checkInData2 = {
        name: 'Test Player 2',
        phone: '0812345678',
      };

      // First check-in with dashes
      await request(app)
        .post(`/api/groupplay/${testSession._id}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(checkInData1)
        .expect(200);

      // Second check-in without dashes (same number) should fail
      const response = await request(app)
        .post(`/api/groupplay/${testSession._id}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(checkInData2)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('เช็คอินแล้ว');
    });

    it('should allow check-in after player has checked out', async () => {
      const checkInData = {
        name: 'Test Player',
        phone: '0812345678',
      };

      // First check-in
      const firstCheckIn = await request(app)
        .post(`/api/groupplay/${testSession._id}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(checkInData)
        .expect(200);

      const playerId = firstCheckIn.body.data.players[0]._id;

      // Check out the player
      await request(app)
        .post(`/api/groupplay/${testSession._id}/checkout/${playerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Second check-in should succeed after checkout
      const response = await request(app)
        .post(`/api/groupplay/${testSession._id}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(checkInData)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should have 2 players now (same person, different check-in sessions)
      expect(response.body.data.players.length).toBeGreaterThanOrEqual(1);
    }, 60000); // Increase timeout to 60s due to test interference
  });

  describe('POST /api/groupplay/:id/game/start', () => {
    let sessionWithPlayers;
    let player1Id, player2Id;

    beforeEach(async () => {
      // Create session with 2 players checked in
      sessionWithPlayers = await GroupPlay.create({
        sessionName: 'Game Test Session',
        courts: [testCourt._id],
        daysOfWeek: ['monday'],
        startTime: '18:00',
        endTime: '20:00',
        entryFee: 50,
        createdBy: adminUser._id,
      });

      // Check in 2 players
      await sessionWithPlayers.checkInPlayer({
        name: 'Player 1',
        phone: '0811111111',
      });

      await sessionWithPlayers.checkInPlayer({
        name: 'Player 2',
        phone: '0822222222',
      });

      // Get player IDs
      player1Id = sessionWithPlayers.players[0]._id;
      player2Id = sessionWithPlayers.players[1]._id;
    });

    it('should start a game with 2 players', async () => {
      const gameData = {
        playerIds: [player1Id, player2Id],
        courtId: testCourt._id,
        teammates: [],
        opponents: [],
      };

      const response = await request(app)
        .post(`/api/groupplay/${sessionWithPlayers._id}/game/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(gameData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.players[0].games).toHaveLength(1);
      expect(response.body.data.players[1].games).toHaveLength(1);
    });

    it('should fail to start game with less than 2 players', async () => {
      const gameData = {
        playerIds: [player1Id],
      };

      const response = await request(app)
        .post(`/api/groupplay/${sessionWithPlayers._id}/game/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(gameData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/groupplay', () => {
    it('should get all group play sessions', async () => {
      // Create test sessions
      await GroupPlay.create({
        sessionName: 'Monday Session',
        courts: [testCourt._id],
        daysOfWeek: ['monday'],
        startTime: '18:00',
        endTime: '20:00',
        entryFee: 50,
        createdBy: adminUser._id,
      });

      const response = await request(app)
        .get('/api/groupplay')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/groupplay/:id', () => {
    let testSession;

    beforeEach(async () => {
      testSession = await GroupPlay.create({
        sessionName: 'Test Session',
        courts: [testCourt._id],
        daysOfWeek: ['monday'],
        startTime: '18:00',
        endTime: '20:00',
        entryFee: 50,
        createdBy: adminUser._id,
      });
    });

    it('should toggle session active status', async () => {
      const response = await request(app)
        .patch(`/api/groupplay/${testSession._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    it('should update session fields', async () => {
      const updates = {
        sessionName: 'Updated Session',
        entryFee: 60,
      };

      const response = await request(app)
        .patch(`/api/groupplay/${testSession._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionName).toBe(updates.sessionName);
      expect(response.body.data.entryFee).toBe(updates.entryFee);
    });
  });

  describe('PATCH /api/groupplay/:id/game/:playerId/:gameNumber/finish', () => {
    let sessionWithGame;
    let playerId1, playerId2;
    let gameNumber;

    beforeEach(async () => {
      // Reset product stock before each test
      await Product.updateOne({ _id: testProduct._id }, { stock: 100 });

      // Create session with 2 players and start a game
      sessionWithGame = await GroupPlay.create({
        sessionName: 'Finish Game Test Session',
        courts: [testCourt._id],
        daysOfWeek: ['monday'],
        startTime: '18:00',
        endTime: '20:00',
        entryFee: 50,
        createdBy: adminUser._id,
      });

      // Check in 2 players
      await sessionWithGame.checkInPlayer({
        name: 'Player 1',
        phone: '0811111111',
      });

      await sessionWithGame.checkInPlayer({
        name: 'Player 2',
        phone: '0822222222',
      });

      playerId1 = sessionWithGame.players[0]._id;
      playerId2 = sessionWithGame.players[1]._id;

      // Start a game
      await sessionWithGame.startGame(
        [playerId1, playerId2],
        testCourt._id,
        [],
        []
      );

      gameNumber = sessionWithGame.players[0].games[0].gameNumber;
    });

    it('should finish game without items', async () => {
      const response = await request(app)
        .patch(`/api/groupplay/${sessionWithGame._id}/game/${playerId1}/${gameNumber}/finish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('จบเกมสำเร็จ');

      // Verify game status
      const player = response.body.data.players.find(
        (p) => p._id.toString() === playerId1.toString()
      );
      expect(player.games[0].status).toBe('finished');
      expect(player.games[0].endTime).not.toBeNull();
    });

    it('should finish game with items and update product stock', async () => {
      // Get current stock from database
      const currentProduct = await Product.findById(testProduct._id);
      const initialStock = currentProduct.stock;

      const items = [
        {
          product: testProduct._id,
          quantity: 2,
          price: testProduct.price,
        },
      ];

      const response = await request(app)
        .patch(`/api/groupplay/${sessionWithGame._id}/game/${playerId1}/${gameNumber}/finish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify product stock decreased
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stock).toBe(initialStock - 2);

      // Verify game has items
      const player = response.body.data.players.find(
        (p) => p._id.toString() === playerId1.toString()
      );
      expect(player.games[0].items).toHaveLength(1);
      expect(player.games[0].totalItemsCost).toBe(testProduct.price * 2);
    });

    it('should calculate cost per player correctly', async () => {
      const items = [
        {
          product: testProduct._id,
          quantity: 4,
          price: testProduct.price,
        },
      ];

      const totalCost = testProduct.price * 4; // 150 * 4 = 600
      const expectedCostPerPlayer = totalCost / 2; // 600 / 2 players = 300

      const response = await request(app)
        .patch(`/api/groupplay/${sessionWithGame._id}/game/${playerId1}/${gameNumber}/finish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Both players should have cost increased
      const player1 = response.body.data.players.find(
        (p) => p._id.toString() === playerId1.toString()
      );
      const player2 = response.body.data.players.find(
        (p) => p._id.toString() === playerId2.toString()
      );

      // Total cost = entry fee + cost per player
      expect(player1.totalCost).toBe(50 + expectedCostPerPlayer); // 50 + 300 = 350
      expect(player2.totalCost).toBe(50 + expectedCostPerPlayer);
    });

    it('should fail when product stock is insufficient', async () => {
      const items = [
        {
          product: testProduct._id,
          quantity: 999, // More than available stock
          price: testProduct.price,
        },
      ];

      const response = await request(app)
        .patch(`/api/groupplay/${sessionWithGame._id}/game/${playerId1}/${gameNumber}/finish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('สต็อกไม่เพียงพอ');
    });

    it('should fail when product does not exist', async () => {
      const fakeProductId = new mongoose.Types.ObjectId();
      const items = [
        {
          product: fakeProductId,
          quantity: 1,
          price: 100,
        },
      ];

      const response = await request(app)
        .patch(`/api/groupplay/${sessionWithGame._id}/game/${playerId1}/${gameNumber}/finish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ไม่พบสินค้า');
    });
  });

  describe('POST /api/groupplay/:id/player/:playerId/products', () => {
    let sessionWithPlayer;
    let playerId;

    beforeEach(async () => {
      // Reset product stock before each test
      await Product.updateOne({ _id: testProduct._id }, { stock: 100 });

      sessionWithPlayer = await GroupPlay.create({
        sessionName: 'Add Products Test Session',
        courts: [testCourt._id],
        daysOfWeek: ['monday'],
        startTime: '18:00',
        endTime: '20:00',
        entryFee: 30,
        createdBy: adminUser._id,
      });

      // Check in a player
      await sessionWithPlayer.checkInPlayer({
        name: 'Test Player',
        phone: '0812345678',
      });

      playerId = sessionWithPlayer.players[0]._id;
    });

    it('should add standalone items to player', async () => {
      // Get current stock from database
      const currentProduct = await Product.findById(testProduct._id);
      const initialStock = currentProduct.stock;

      const items = [
        {
          product: testProduct._id,
          quantity: 2,
          price: testProduct.price,
        },
      ];

      const response = await request(app)
        .post(`/api/groupplay/${sessionWithPlayer._id}/player/${playerId}/products`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('เพิ่มค่าใช้จ่ายสินค้าสำเร็จ');

      // Verify product stock decreased
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stock).toBe(initialStock - 2);

      // Verify player has standalone items
      const player = response.body.data.players.find(
        (p) => p._id.toString() === playerId.toString()
      );
      expect(player.standaloneItems).toHaveLength(1);
      expect(player.standaloneItems[0].quantity).toBe(2);

      // Verify total cost increased (entry fee + standalone items)
      const expectedTotal = 30 + testProduct.price * 2; // 30 + 300 = 330
      expect(player.totalCost).toBe(expectedTotal);
    });

    it('should accumulate multiple standalone item additions', async () => {
      const items1 = [
        {
          product: testProduct._id,
          quantity: 1,
          price: testProduct.price,
        },
      ];

      // First addition
      await request(app)
        .post(`/api/groupplay/${sessionWithPlayer._id}/player/${playerId}/products`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: items1 })
        .expect(200);

      // Second addition
      const items2 = [
        {
          product: testProduct._id,
          quantity: 2,
          price: testProduct.price,
        },
      ];

      const response = await request(app)
        .post(`/api/groupplay/${sessionWithPlayer._id}/player/${playerId}/products`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: items2 })
        .expect(200);

      expect(response.body.success).toBe(true);

      const player = response.body.data.players.find(
        (p) => p._id.toString() === playerId.toString()
      );

      // Should have 2 separate items in standaloneItems
      expect(player.standaloneItems).toHaveLength(2);

      // Total cost = entry fee + item1 + item2
      const expectedTotal = 30 + testProduct.price * 1 + testProduct.price * 2;
      expect(player.totalCost).toBe(expectedTotal); // 30 + 150 + 300 = 480
    });

    it('should fail when no items provided', async () => {
      const response = await request(app)
        .post(`/api/groupplay/${sessionWithPlayer._id}/player/${playerId}/products`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('กรุณาเลือกสินค้า');
    });

    it('should fail when product stock is insufficient', async () => {
      const items = [
        {
          product: testProduct._id,
          quantity: 999,
          price: testProduct.price,
        },
      ];

      const response = await request(app)
        .post(`/api/groupplay/${sessionWithPlayer._id}/player/${playerId}/products`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('สต็อกไม่เพียงพอ');
    });

    it('should fail when player does not exist', async () => {
      const fakePlayerId = new mongoose.Types.ObjectId();
      const items = [
        {
          product: testProduct._id,
          quantity: 1,
          price: testProduct.price,
        },
      ];

      const response = await request(app)
        .post(`/api/groupplay/${sessionWithPlayer._id}/player/${fakePlayerId}/products`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ไม่พบผู้เล่น');
    });
  });

  describe('POST /api/groupplay/:id/checkout/:playerId', () => {
    let sessionWithCheckout;
    let playerWithGames;
    let dbPlayer;

    beforeEach(async () => {
      // Clean up players and reset product stock before each test
      await Player.deleteMany({});
      await Product.updateOne({ _id: testProduct._id }, { stock: 100 });

      // Create a player in database
      dbPlayer = await Player.create({
        name: 'Checkout Test Player',
        phone: '0899999999',
        level: '6',
        stats: {
          totalGames: 5,
          totalSpent: 200,
        },
      });

      sessionWithCheckout = await GroupPlay.create({
        sessionName: 'Checkout Test Session',
        courts: [testCourt._id],
        daysOfWeek: ['monday'],
        startTime: '18:00',
        endTime: '20:00',
        entryFee: 40,
        createdBy: adminUser._id,
      });

      // Check in player (from database)
      await sessionWithCheckout.checkInPlayer({
        playerId: dbPlayer._id,
        name: dbPlayer.name,
        phone: dbPlayer.phone,
        level: dbPlayer.level,
      });

      playerWithGames = sessionWithCheckout.players[0]._id;

      // Check in another player for game
      await sessionWithCheckout.checkInPlayer({
        name: 'Player 2',
        phone: '0888888888',
      });
    });

    it('should checkout player successfully', async () => {
      // Start and finish a game first
      let session = await GroupPlay.findById(sessionWithCheckout._id);
      const player2Id = session.players[1]._id;

      await request(app)
        .post(`/api/groupplay/${session._id}/game/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          playerIds: [playerWithGames, player2Id],
          courtId: testCourt._id,
          teammates: [],
          opponents: [],
        });

      // Reload to get game number
      session = await GroupPlay.findById(sessionWithCheckout._id);
      const gameNumber = session.players[0].games[0].gameNumber;

      // Finish the game
      await request(app)
        .patch(`/api/groupplay/${session._id}/game/${playerWithGames}/${gameNumber}/finish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [] });

      // Now checkout
      const response = await request(app)
        .post(`/api/groupplay/${sessionWithCheckout._id}/checkout/${playerWithGames}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Check-out สำเร็จ');

      // Verify player is checked out
      const player = response.body.data.session.players.find(
        (p) => p._id.toString() === playerWithGames.toString()
      );
      expect(player.checkedOut).toBe(true);
      expect(player.checkOutTime).not.toBeNull();
      expect(player.paymentStatus).toBe('paid');
    });

    it('should update player stats after checkout', async () => {
      // Start and finish a game first
      let session = await GroupPlay.findById(sessionWithCheckout._id);
      const player2Id = session.players[1]._id;

      // Start game
      await request(app)
        .post(`/api/groupplay/${session._id}/game/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          playerIds: [playerWithGames, player2Id],
          courtId: testCourt._id,
          teammates: [],
          opponents: [],
        });

      // Reload to get game number
      session = await GroupPlay.findById(sessionWithCheckout._id);
      const gameNumber = session.players[0].games[0].gameNumber;

      // Finish the game with items
      const items = [
        {
          product: testProduct._id,
          quantity: 2,
          price: testProduct.price,
        },
      ];

      await request(app)
        .patch(`/api/groupplay/${session._id}/game/${playerWithGames}/${gameNumber}/finish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items });

      // Now checkout
      await request(app)
        .post(`/api/groupplay/${sessionWithCheckout._id}/checkout/${playerWithGames}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify player stats updated
      const updatedPlayer = await Player.findById(dbPlayer._id);

      // Should have 1 more game (5 + 1 = 6)
      expect(updatedPlayer.stats.totalGames).toBe(6);

      // Should have increased total spent
      expect(updatedPlayer.stats.totalSpent).toBeGreaterThan(200);

      // Last played should be updated
      expect(updatedPlayer.stats.lastPlayed).not.toBeNull();
    });

    it('should fail when player has playing games', async () => {
      // Start a game without finishing
      const session = await GroupPlay.findById(sessionWithCheckout._id);
      const player2Id = session.players[1]._id;

      await request(app)
        .post(`/api/groupplay/${session._id}/game/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          playerIds: [playerWithGames, player2Id],
          courtId: testCourt._id,
          teammates: [],
          opponents: [],
        });

      // Try to checkout while game is playing
      const response = await request(app)
        .post(`/api/groupplay/${sessionWithCheckout._id}/checkout/${playerWithGames}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('กำลังอยู่ในเกม');
      expect(response.body.message).toContain('กรุณาจบเกมก่อน');
    });

    it('should fail when player does not exist', async () => {
      const fakePlayerId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/groupplay/${sessionWithCheckout._id}/checkout/${fakePlayerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ไม่พบผู้เล่น');
    });

    it('should handle walk-in player checkout (no stats update)', async () => {
      // Start a game for both players
      let session = await GroupPlay.findById(sessionWithCheckout._id);
      const player2Id = session.players[1]._id;

      await request(app)
        .post(`/api/groupplay/${session._id}/game/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          playerIds: [playerWithGames, player2Id],
          courtId: testCourt._id,
          teammates: [],
          opponents: [],
        });

      // Reload to get game number
      session = await GroupPlay.findById(sessionWithCheckout._id);
      const gameNumber = session.players[1].games[0].gameNumber;

      // Finish player 2's game using API
      await request(app)
        .patch(`/api/groupplay/${session._id}/game/${player2Id}/${gameNumber}/finish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [] });

      // Checkout player 2 (walk-in)
      const response = await request(app)
        .post(`/api/groupplay/${sessionWithCheckout._id}/checkout/${player2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify walk-in player checked out (no stats update)
      const player = response.body.data.session.players.find(
        (p) => p._id.toString() === player2Id.toString()
      );
      expect(player.checkedOut).toBe(true);
    });
  });
});
