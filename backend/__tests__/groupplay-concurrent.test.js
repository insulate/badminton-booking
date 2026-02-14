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

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

describe('Group Play - Concurrent Game Start Tests', () => {
  let adminUser, adminToken;
  let court1, court2;
  let testProduct;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }

    await User.deleteMany({});
    await Court.deleteMany({});
    await GroupPlay.deleteMany({});
    await Player.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});

    adminUser = await User.create({
      username: 'admin-concurrent',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin',
    });
    adminToken = generateToken(adminUser._id);

    court1 = await Court.create({
      courtNumber: 'C01',
      name: 'Court 1',
      type: 'normal',
      status: 'available',
    });

    court2 = await Court.create({
      courtNumber: 'C02',
      name: 'Court 2',
      type: 'normal',
      status: 'available',
    });

    testProduct = await Product.create({
      sku: 'SHT-CONC',
      name: 'Test Shuttlecock',
      category: 'shuttlecock',
      price: 100,
      stock: 100,
      status: 'active',
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Court.deleteMany({});
    await GroupPlay.deleteMany({});
    await Player.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await GroupPlay.deleteMany({});
    await Product.updateOne({ _id: testProduct._id }, { stock: 100 });
  });

  it('should generate unique gameNumbers for concurrent startGame requests', async () => {
    // Create session with 2 courts and 4 players
    const session = await GroupPlay.create({
      sessionName: 'Concurrent Test',
      courts: [court1._id, court2._id],
      daysOfWeek: ['monday'],
      startTime: '18:00',
      endTime: '22:00',
      entryFee: 50,
      createdBy: adminUser._id,
    });

    // Check in 4 players
    for (let i = 1; i <= 4; i++) {
      await session.checkInPlayer({
        name: `Player ${i}`,
        phone: `080000000${i}`,
      });
    }

    const p1 = session.players[0]._id;
    const p2 = session.players[1]._id;
    const p3 = session.players[2]._id;
    const p4 = session.players[3]._id;

    // Start 2 games concurrently on different courts
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/groupplay/${session._id}/game/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ playerIds: [p1, p2], courtId: court1._id }),
      request(app)
        .post(`/api/groupplay/${session._id}/game/start`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ playerIds: [p3, p4], courtId: court2._id }),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    // Verify unique gameNumbers
    const updated = await GroupPlay.findById(session._id);
    const gameNumbers = new Set();
    updated.players.forEach(p => {
      p.games.forEach(g => gameNumbers.add(g.gameNumber));
    });

    // Must have 2 unique gameNumbers (not collision)
    expect(gameNumbers.size).toBe(2);

    // gameCounter should be 2
    expect(updated.gameCounter).toBe(2);
  });

  it('should show separate games for each court after concurrent start', async () => {
    const session = await GroupPlay.create({
      sessionName: 'Multi-Court Test',
      courts: [court1._id, court2._id],
      daysOfWeek: ['monday'],
      startTime: '18:00',
      endTime: '22:00',
      entryFee: 50,
      createdBy: adminUser._id,
    });

    // Check in 4 players
    for (let i = 1; i <= 4; i++) {
      await session.checkInPlayer({
        name: `Player ${i}`,
        phone: `080000000${i}`,
      });
    }

    const p1 = session.players[0]._id;
    const p2 = session.players[1]._id;
    const p3 = session.players[2]._id;
    const p4 = session.players[3]._id;

    // Start games sequentially
    await request(app)
      .post(`/api/groupplay/${session._id}/game/start`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ playerIds: [p1, p2], courtId: court1._id })
      .expect(200);

    await request(app)
      .post(`/api/groupplay/${session._id}/game/start`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ playerIds: [p3, p4], courtId: court2._id })
      .expect(200);

    // Verify: each game has correct number of players
    const updated = await GroupPlay.findById(session._id);

    // Collect active games by gameNumber
    const gamesMap = new Map();
    updated.players.forEach(p => {
      p.games.forEach(g => {
        if (g.status === 'playing') {
          if (!gamesMap.has(g.gameNumber)) {
            gamesMap.set(g.gameNumber, { court: g.court.toString(), players: [] });
          }
          gamesMap.get(g.gameNumber).players.push(p._id.toString());
        }
      });
    });

    // Must have 2 separate games
    expect(gamesMap.size).toBe(2);

    // Each game must have exactly 2 players
    for (const [, game] of gamesMap) {
      expect(game.players).toHaveLength(2);
    }
  });

  it('should calculate cost correctly when finishing one game without affecting another', async () => {
    const session = await GroupPlay.create({
      sessionName: 'Cost Test',
      courts: [court1._id, court2._id],
      daysOfWeek: ['monday'],
      startTime: '18:00',
      endTime: '22:00',
      entryFee: 50,
      createdBy: adminUser._id,
    });

    // Check in 4 players
    for (let i = 1; i <= 4; i++) {
      await session.checkInPlayer({
        name: `Player ${i}`,
        phone: `080000000${i}`,
      });
    }

    const p1 = session.players[0]._id;
    const p2 = session.players[1]._id;
    const p3 = session.players[2]._id;
    const p4 = session.players[3]._id;

    // Start game 1 on court 1
    await request(app)
      .post(`/api/groupplay/${session._id}/game/start`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ playerIds: [p1, p2], courtId: court1._id })
      .expect(200);

    // Start game 2 on court 2
    await request(app)
      .post(`/api/groupplay/${session._id}/game/start`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ playerIds: [p3, p4], courtId: court2._id })
      .expect(200);

    // Find game numbers
    const afterStart = await GroupPlay.findById(session._id);
    const game1Number = afterStart.players.find(p => p._id.equals(p1)).games[0].gameNumber;
    const game2Number = afterStart.players.find(p => p._id.equals(p3)).games[0].gameNumber;

    // Finish game 2 with items (should only affect 2 players, not 4)
    const items = [{
      product: testProduct._id,
      quantity: 2,
      price: testProduct.price, // 100
    }];

    const finishRes = await request(app)
      .patch(`/api/groupplay/${session._id}/game/${p3}/${game2Number}/finish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items })
      .expect(200);

    expect(finishRes.body.success).toBe(true);

    // Verify costs
    const afterFinish = await GroupPlay.findById(session._id);

    // Players 1 & 2 (game 1, still playing): cost should only be entry fee
    const player1 = afterFinish.players.find(p => p._id.equals(p1));
    const player2 = afterFinish.players.find(p => p._id.equals(p2));
    expect(player1.totalCost).toBe(50); // Only entry fee
    expect(player2.totalCost).toBe(50);
    expect(player1.games[0].status).toBe('playing'); // Game 1 still playing

    // Players 3 & 4 (game 2, finished): cost = entry fee + items/2
    const player3 = afterFinish.players.find(p => p._id.equals(p3));
    const player4 = afterFinish.players.find(p => p._id.equals(p4));
    const expectedCostPerPlayer = (100 * 2) / 2; // 200 / 2 = 100
    expect(player3.totalCost).toBe(50 + expectedCostPerPlayer); // 50 + 100 = 150
    expect(player4.totalCost).toBe(50 + expectedCostPerPlayer);
    expect(player3.games[0].status).toBe('finished');
  });

  it('should increment gameCounter atomically', async () => {
    const session = await GroupPlay.create({
      sessionName: 'Counter Test',
      courts: [court1._id, court2._id],
      daysOfWeek: ['monday'],
      startTime: '18:00',
      endTime: '22:00',
      entryFee: 50,
      createdBy: adminUser._id,
    });

    // Check gameCounter starts at 0
    expect(session.gameCounter).toBe(0);

    // Check in 4 players
    for (let i = 1; i <= 4; i++) {
      await session.checkInPlayer({
        name: `Player ${i}`,
        phone: `080000000${i}`,
      });
    }

    const p1 = session.players[0]._id;
    const p2 = session.players[1]._id;

    // Start a game
    await GroupPlay.startGameAtomic(session._id, [p1, p2], court1._id);

    // Check gameCounter is 1
    let updated = await GroupPlay.findById(session._id);
    expect(updated.gameCounter).toBe(1);
    expect(updated.players[0].games[0].gameNumber).toBe(1);

    // Start another game
    const p3 = updated.players[2]._id;
    const p4 = updated.players[3]._id;
    await GroupPlay.startGameAtomic(session._id, [p3, p4], court2._id);

    // Check gameCounter is 2
    updated = await GroupPlay.findById(session._id);
    expect(updated.gameCounter).toBe(2);
    expect(updated.players[2].games[0].gameNumber).toBe(2);
  });
});
