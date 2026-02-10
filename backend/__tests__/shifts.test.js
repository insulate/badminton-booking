// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://admin:admin123@localhost:27017/badminton_test?authSource=admin';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'badminton_secret_key_for_development_only_change_in_production';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Try to load Shift model
let Shift;
try {
  Shift = require('../models/shift.model');
} catch (e) {
  // Model may not exist in some setups
}

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

describe('Shifts API Tests', () => {
  let adminUser, adminToken;
  let staffUser, staffToken;
  let shiftId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }

    await User.deleteMany({});
    if (Shift) await Shift.deleteMany({});

    adminUser = await User.create({
      username: 'shiftadmin',
      password: 'Admin123!',
      name: 'Shift Admin',
      role: 'admin',
    });
    adminToken = generateToken(adminUser._id);

    staffUser = await User.create({
      username: 'shiftstaff',
      password: 'Staff123!',
      name: 'Shift Staff',
      role: 'user',
    });
    staffToken = generateToken(staffUser._id);
  });

  afterAll(async () => {
    await User.deleteMany({});
    if (Shift) await Shift.deleteMany({});
    await mongoose.connection.close();
  });

  // --- OPEN SHIFT ---
  describe('POST /api/shifts/open', () => {
    it('should open a new shift', async () => {
      const res = await request(app)
        .post('/api/shifts/open')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ openingCash: 1000 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('open');
      expect(res.body.data.openingCash).toBe(1000);
      shiftId = res.body.data._id;
    });

    it('should reject opening another shift while one is open', async () => {
      const res = await request(app)
        .post('/api/shifts/open')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ openingCash: 500 });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated (401)', async () => {
      const res = await request(app)
        .post('/api/shifts/open')
        .send({ openingCash: 1000 });

      expect(res.status).toBe(401);
    });
  });

  // --- CURRENT SHIFT ---
  describe('GET /api/shifts/current', () => {
    it('should get current open shift', async () => {
      const res = await request(app)
        .get('/api/shifts/current')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('open');
    });
  });

  // --- GET SHIFT ---
  describe('GET /api/shifts/:id', () => {
    it('should get shift by id', async () => {
      const res = await request(app)
        .get(`/api/shifts/${shiftId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(shiftId);
    });
  });

  // --- EXPENSES ---
  describe('POST /api/shifts/:id/expense', () => {
    let expenseId;

    it('should add expense to open shift', async () => {
      const res = await request(app)
        .post(`/api/shifts/${shiftId}/expense`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'ice',
          description: 'ซื้อน้ำแข็ง',
          amount: 100,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Find the expense id
      const shift = res.body.data;
      expect(shift.expenses.length).toBeGreaterThanOrEqual(1);
      expenseId = shift.expenses[shift.expenses.length - 1]._id;
    });

    it('should add another expense', async () => {
      const res = await request(app)
        .post(`/api/shifts/${shiftId}/expense`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'snack',
          description: 'ซื้อขนม',
          amount: 50,
        });

      expect(res.status).toBe(200);
    });

    it('should delete expense', async () => {
      const res = await request(app)
        .delete(`/api/shifts/${shiftId}/expense/${expenseId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // --- SUMMARY ---
  describe('GET /api/shifts/:id/summary', () => {
    it('should get shift summary', async () => {
      const res = await request(app)
        .get(`/api/shifts/${shiftId}/summary`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  // --- CLOSE SHIFT ---
  describe('POST /api/shifts/:id/close', () => {
    it('should close the shift', async () => {
      const res = await request(app)
        .post(`/api/shifts/${shiftId}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          actualCash: 900,
          actualNonCash: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('closed');
    });

    it('should reject closing already closed shift', async () => {
      const res = await request(app)
        .post(`/api/shifts/${shiftId}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          actualCash: 900,
          actualNonCash: 0,
        });

      expect(res.status).toBe(400);
    });
  });

  // --- LIST SHIFTS (Admin) ---
  describe('GET /api/shifts', () => {
    it('should list all shifts (admin)', async () => {
      const res = await request(app)
        .get('/api/shifts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --- LIFECYCLE INTEGRATION ---
  describe('Full shift lifecycle', () => {
    let newShiftId;

    it('should complete open → expense → close cycle', async () => {
      // Open
      const openRes = await request(app)
        .post('/api/shifts/open')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ openingCash: 2000 });

      expect(openRes.status).toBe(201);
      newShiftId = openRes.body.data._id;

      // Add expense
      const expenseRes = await request(app)
        .post(`/api/shifts/${newShiftId}/expense`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'supplies',
          description: 'อุปกรณ์ทำความสะอาด',
          amount: 200,
        });
      expect(expenseRes.status).toBe(200);

      // Get summary
      const summaryRes = await request(app)
        .get(`/api/shifts/${newShiftId}/summary`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(summaryRes.status).toBe(200);

      // Close
      const closeRes = await request(app)
        .post(`/api/shifts/${newShiftId}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          actualCash: 1800,
          actualNonCash: 0,
        });
      expect(closeRes.status).toBe(200);
      expect(closeRes.body.data.status).toBe('closed');
    });
  });
});
