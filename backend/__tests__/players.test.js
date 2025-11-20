// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://admin:admin123@localhost:27017/badminton_test?authSource=admin';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'badminton_secret_key_for_development_only_change_in_production';

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/user.model');
const Player = require('../models/player.model');
const jwt = require('jsonwebtoken');

// Generate JWT token for testing
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

describe('Players API Tests', () => {
  let adminUser;
  let adminToken;
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
    await Player.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      username: 'admin-players',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin',
    });

    // Generate token
    adminToken = generateToken(adminUser._id);
  });

  // Cleanup: Close DB connection after all tests
  afterAll(async () => {
    await User.deleteMany({});
    await Player.deleteMany({});
    await mongoose.connection.close();
  });

  // Clean up players before each test
  beforeEach(async () => {
    await Player.deleteMany({});
  });

  describe('POST /api/players', () => {
    it('should create a new player with all fields', async () => {
      const playerData = {
        name: 'Test Player',
        phone: '0812345678',
        level: '5',
        password: 'password123',
        notes: 'Test notes',
      };

      const response = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(playerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(playerData.name);
      expect(response.body.data.phone).toBe(playerData.phone);
      expect(response.body.data.level).toBe(playerData.level);
      expect(response.body.data.levelName).toBe('A-'); // Level 5 = A-
      expect(response.body.data.notes).toBe(playerData.notes);
      expect(response.body.data.status).toBe('active'); // Default status
      expect(response.body.data.password).toBeUndefined(); // Password should not be returned
    });

    it('should create a player without optional fields', async () => {
      const playerData = {
        name: 'Simple Player',
        phone: '0898765432',
      };

      const response = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(playerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(playerData.name);
      expect(response.body.data.phone).toBe(playerData.phone);
      expect(response.body.data.level).toBeNull(); // No level provided
      expect(response.body.data.levelName).toBe('ไม่ระบุ');
    });

    it('should hash password when creating player', async () => {
      const playerData = {
        name: 'Password Test Player',
        phone: '0811111111',
        password: 'mypassword123',
      };

      const response = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(playerData)
        .expect(201);

      // Get player with password field (using select)
      const player = await Player.findById(response.body.data._id).select('+password');

      // Password should be hashed, not plain text
      expect(player.password).not.toBe(playerData.password);
      expect(player.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern

      // Should be able to compare with original password
      const isMatch = await bcrypt.compare(playerData.password, player.password);
      expect(isMatch).toBe(true);
    });

    it('should fail with duplicate phone number', async () => {
      const playerData = {
        name: 'Player 1',
        phone: '0822222222',
      };

      // Create first player
      await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(playerData)
        .expect(201);

      // Try to create second player with same phone
      const response = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...playerData, name: 'Player 2' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('มีผู้เล่นที่ใช้เบอร์โทรนี้แล้ว');
    });

    it('should normalize phone number by removing dashes', async () => {
      const playerData = {
        name: 'Dash Player',
        phone: '081-234-5678',
      };

      const response = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(playerData)
        .expect(201);

      // Phone should be stored without dashes
      expect(response.body.data.phone).toBe('0812345678');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid phone number format', async () => {
      const playerData = {
        name: 'Invalid Phone Player',
        phone: '123', // Invalid format
      };

      const response = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(playerData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid level', async () => {
      const playerData = {
        name: 'Invalid Level Player',
        phone: '0833333333',
        level: '15', // Invalid level (must be 0-10)
      };

      const response = await request(app)
        .post('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(playerData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/players', () => {
    beforeEach(async () => {
      // Create test players
      await Player.create([
        { name: 'Alice', phone: '0811111111', level: '5', status: 'active' },
        { name: 'Bob', phone: '0822222222', level: '3', status: 'active' },
        { name: 'Charlie', phone: '0833333333', level: '5', status: 'active' },
        { name: 'David', phone: '0844444444', level: '7', status: 'active' },
      ]);
    });

    it('should get all players', async () => {
      const response = await request(app)
        .get('/api/players')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(4);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(4);
    });

    it('should filter players by level', async () => {
      const response = await request(app)
        .get('/api/players?level=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data.every(p => p.level === '5')).toBe(true);
    });

    it('should filter players by status', async () => {
      const response = await request(app)
        .get('/api/players?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(3);
      expect(response.body.data.every(p => p.status === 'active')).toBe(true);
    });

    it('should search players by name', async () => {
      const response = await request(app)
        .get('/api/players?search=alice')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].name).toBe('Alice');
    });

    it('should search players by phone', async () => {
      const response = await request(app)
        .get('/api/players?search=0822')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].name).toBe('Bob');
    });

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/players?level=5&status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].name).toBe('Alice');
    });
  });

  describe('GET /api/players/:id', () => {
    beforeEach(async () => {
      testPlayer = await Player.create({
        name: 'Test Player',
        phone: '0812345678',
        level: '5',
      });
    });

    it('should get player by ID', async () => {
      const response = await request(app)
        .get(`/api/players/${testPlayer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testPlayer._id.toString());
      expect(response.body.data.name).toBe(testPlayer.name);
      expect(response.body.data.phone).toBe(testPlayer.phone);
    });

    it('should return 404 for non-existent player', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/players/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ไม่พบผู้เล่น');
    });
  });

  describe('GET /api/players/stats/:id', () => {
    beforeEach(async () => {
      testPlayer = await Player.create({
        name: 'Stats Player',
        phone: '0812345678',
        level: '5',
        stats: {
          totalGames: 10,
          totalSpent: 500,
          lastPlayed: new Date('2025-01-15'),
        },
      });
    });

    it('should get player stats', async () => {
      const response = await request(app)
        .get(`/api/players/stats/${testPlayer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.player.name).toBe('Stats Player');
      expect(response.body.data.stats.totalGames).toBe(10);
      expect(response.body.data.stats.totalSpent).toBe(500);
    });

    it('should return 404 for non-existent player', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/players/stats/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/players/:id', () => {
    beforeEach(async () => {
      testPlayer = await Player.create({
        name: 'Original Name',
        phone: '0812345678',
        level: '5',
        notes: 'Original notes',
      });
    });

    it('should update player name', async () => {
      const updates = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .put(`/api/players/${testPlayer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updates.name);
    });

    it('should update player level', async () => {
      const updates = {
        level: '8',
      };

      const response = await request(app)
        .put(`/api/players/${testPlayer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.level).toBe('8');
      expect(response.body.data.levelName).toBe('B'); // Level 8 = B
    });

    it('should update password and hash it', async () => {
      const updates = {
        password: 'newpassword123',
      };

      const response = await request(app)
        .put(`/api/players/${testPlayer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Get player with password field
      const player = await Player.findById(testPlayer._id).select('+password');

      // Password should be hashed
      expect(player.password).not.toBe(updates.password);
      const isMatch = await bcrypt.compare(updates.password, player.password);
      expect(isMatch).toBe(true);
    });

    it('should update phone number', async () => {
      const updates = {
        phone: '0899999999',
      };

      const response = await request(app)
        .put(`/api/players/${testPlayer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBe(updates.phone);
    });

    it('should fail when updating to duplicate phone number', async () => {
      // Create another player
      const anotherPlayer = await Player.create({
        name: 'Another Player',
        phone: '0877777777',
      });

      // Try to update first player's phone to second player's phone
      const updates = {
        phone: anotherPlayer.phone,
      };

      const response = await request(app)
        .put(`/api/players/${testPlayer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('มีผู้เล่นที่ใช้เบอร์โทรนี้แล้ว');
    });

    it('should allow updating same player with same phone number', async () => {
      // Update player but keep same phone
      const updates = {
        name: 'New Name',
        phone: testPlayer.phone, // Same phone
      };

      const response = await request(app)
        .put(`/api/players/${testPlayer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updates.name);
      expect(response.body.data.phone).toBe(testPlayer.phone);
    });

    it('should return 404 for non-existent player', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/players/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/players/:id', () => {
    beforeEach(async () => {
      testPlayer = await Player.create({
        name: 'Player to Delete',
        phone: '0812345678',
      });
    });

    it('should delete player', async () => {
      const response = await request(app)
        .delete(`/api/players/${testPlayer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('ลบผู้เล่นสำเร็จ');

      // Verify player is deleted
      const deletedPlayer = await Player.findById(testPlayer._id);
      expect(deletedPlayer).toBeNull();
    });

    it('should return 404 when deleting non-existent player', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/players/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Player Model - Stats Update', () => {
    it('should update player stats correctly', async () => {
      const player = await Player.create({
        name: 'Stats Test Player',
        phone: '0812345678',
        level: '5',
      });

      // Initial stats should be 0
      expect(player.stats.totalGames).toBe(0);
      expect(player.stats.totalSpent).toBe(0);
      expect(player.stats.lastPlayed).toBeNull();

      // Update stats
      await player.updateStats(3, 150);

      // Reload player
      const updatedPlayer = await Player.findById(player._id);
      expect(updatedPlayer.stats.totalGames).toBe(3);
      expect(updatedPlayer.stats.totalSpent).toBe(150);
      expect(updatedPlayer.stats.lastPlayed).not.toBeNull();
    });

    it('should accumulate stats over multiple updates', async () => {
      const player = await Player.create({
        name: 'Accumulate Stats Player',
        phone: '0812345678',
      });

      // First update
      await player.updateStats(2, 100);
      let updatedPlayer = await Player.findById(player._id);
      expect(updatedPlayer.stats.totalGames).toBe(2);
      expect(updatedPlayer.stats.totalSpent).toBe(100);

      // Second update (should add to existing)
      await updatedPlayer.updateStats(3, 150);
      updatedPlayer = await Player.findById(player._id);
      expect(updatedPlayer.stats.totalGames).toBe(5); // 2 + 3
      expect(updatedPlayer.stats.totalSpent).toBe(250); // 100 + 150
    });
  });
});
