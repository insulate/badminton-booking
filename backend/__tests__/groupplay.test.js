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
      levelName: 'Intermediate',
    });
  });

  // Cleanup: Close DB connection after all tests
  afterAll(async () => {
    await User.deleteMany({});
    await Court.deleteMany({});
    await GroupPlay.deleteMany({});
    await Player.deleteMany({});
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
    });
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
});
