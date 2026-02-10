// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://admin:admin123@localhost:27017/badminton_test?authSource=admin';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'badminton_secret_key_for_development_only_change_in_production';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');
const Setting = require('../models/setting.model');
const jwt = require('jsonwebtoken');

// Generate JWT token for testing
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

describe('Settings API Tests', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;

  // Setup: Create test users
  beforeAll(async () => {
    // Wait for mongoose connection to be ready
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }

    // Clear existing data
    await User.deleteMany({});
    await Setting.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      username: 'admin-test',
      password: 'Admin123!',
      name: 'Admin Test User',
      role: 'admin',
    });

    // Create regular user
    regularUser = await User.create({
      username: 'user-test',
      password: 'User123!',
      name: 'Regular Test User',
      role: 'user',
    });

    // Generate tokens
    adminToken = generateToken(adminUser._id);
    userToken = generateToken(regularUser._id);
  });

  // Cleanup: Close DB connection after all tests
  afterAll(async () => {
    await User.deleteMany({});
    await Setting.deleteMany({});
    await mongoose.connection.close();
  });

  // Reset settings before each test
  beforeEach(async () => {
    await Setting.deleteMany({});
  });

  describe('GET /api/settings', () => {
    it('should get settings for admin user', async () => {
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('venue');
      expect(response.body.data).toHaveProperty('operating');
      expect(response.body.data).toHaveProperty('booking');
      expect(response.body.data).toHaveProperty('payment');
      expect(response.body.data).toHaveProperty('general');
    });

    it('should deny access to regular user', async () => {
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should deny access without token', async () => {
      const response = await request(app).get('/api/settings');

      expect(response.status).toBe(401);
    });

    it('should auto-create settings if none exist', async () => {
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify default values
      expect(response.body.data.venue.name).toBe('Badminton Club');
      expect(response.body.data.general.currency).toBe('THB');
    });
  });

  describe('PUT /api/settings', () => {
    it('should update all settings for admin', async () => {
      const updateData = {
        venue: {
          name: 'New Court Name',
          address: '123 Test St',
          phone: '0812345678',
          email: 'test@example.com',
        },
        general: {
          currency: 'USD',
          timezone: 'Asia/Singapore',
          language: 'en',
        },
      };

      const response = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.venue.name).toBe('New Court Name');
      expect(response.body.data.general.currency).toBe('USD');
    });

    it('should deny access to regular user', async () => {
      const response = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/settings/venue', () => {
    it('should update venue settings only', async () => {
      const venueData = {
        name: 'Updated Venue',
        address: '456 New St',
        phone: '0898765432',
        email: 'venue@test.com',
      };

      const response = await request(app)
        .patch('/api/settings/venue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(venueData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Venue');
      expect(response.body.data.address).toBe('456 New St');
    });

    it('should update venue settings with lineId', async () => {
      const venueData = {
        name: 'Line Test Venue',
        lineId: '@testbadminton',
      };

      const response = await request(app)
        .patch('/api/settings/venue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(venueData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Line Test Venue');
      expect(response.body.data.lineId).toBe('@testbadminton');
    });

    it('should deny access to regular user', async () => {
      const response = await request(app)
        .patch('/api/settings/venue')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/settings/operating', () => {
    it('should update operating hours', async () => {
      const operatingData = {
        openTime: '08:00',
        closeTime: '20:00',
        daysOpen: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      };

      const response = await request(app)
        .patch('/api/settings/operating')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(operatingData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.openTime).toBe('08:00');
      expect(response.body.data.closeTime).toBe('20:00');
      expect(response.body.data.daysOpen).toHaveLength(5);
    });

    it('should reject invalid time format', async () => {
      const invalidData = {
        openTime: '25:00', // Invalid hour
        closeTime: '20:00',
      };

      const response = await request(app)
        .patch('/api/settings/operating')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /api/settings/booking', () => {
    it('should update booking settings', async () => {
      const bookingData = {
        advanceBookingDays: 14,
        minBookingHours: 1,
        maxBookingHours: 4,
        cancellationHours: 48,
        requireDeposit: true,
        depositAmount: 100,
        depositPercentage: 20,
      };

      const response = await request(app)
        .patch('/api/settings/booking')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bookingData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.advanceBookingDays).toBe(14);
      expect(response.body.data.requireDeposit).toBe(true);
      expect(response.body.data.depositAmount).toBe(100);
    });

    it('should handle partial updates', async () => {
      const partialData = {
        advanceBookingDays: 10,
      };

      const response = await request(app)
        .patch('/api/settings/booking')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(partialData);

      expect(response.status).toBe(200);
      expect(response.body.data.advanceBookingDays).toBe(10);
    });
  });

  describe('PATCH /api/settings/payment', () => {
    it('should update payment settings', async () => {
      const paymentData = {
        acceptCash: true,
        acceptTransfer: true,
        acceptCreditCard: false,
        acceptPromptPay: true,
        promptPayNumber: '0812345678',
        bankAccount: {
          bankName: 'Test Bank',
          accountNumber: '123-4-56789-0',
          accountName: 'Test Account',
        },
      };

      const response = await request(app)
        .patch('/api/settings/payment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(paymentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.acceptCash).toBe(true);
      expect(response.body.data.promptPayNumber).toBe('0812345678');
      expect(response.body.data.bankAccount.bankName).toBe('Test Bank');
    });

    it('should update nested bankAccount object', async () => {
      // First set some data
      await request(app)
        .patch('/api/settings/payment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bankAccount: {
            bankName: 'Bank A',
            accountNumber: '111',
            accountName: 'Account A',
          },
        });

      // Update only account number
      const response = await request(app)
        .patch('/api/settings/payment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bankAccount: {
            accountNumber: '222',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.bankAccount.accountNumber).toBe('222');
      expect(response.body.data.bankAccount.bankName).toBe('Bank A');
    });
  });

  describe('PATCH /api/settings/general', () => {
    it('should update general settings', async () => {
      const generalData = {
        currency: 'EUR',
        timezone: 'Asia/Tokyo',
        language: 'en',
      };

      const response = await request(app)
        .patch('/api/settings/general')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(generalData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currency).toBe('EUR');
      expect(response.body.data.timezone).toBe('Asia/Tokyo');
      expect(response.body.data.language).toBe('en');
    });
  });

  describe('POST /api/settings/reset', () => {
    it('should reset settings to default', async () => {
      // First, modify some settings
      await request(app)
        .patch('/api/settings/venue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Modified Name' });

      // Reset settings
      const response = await request(app)
        .post('/api/settings/reset')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.venue.name).toBe('Badminton Club');
      expect(response.body.data.general.currency).toBe('THB');
    });

    it('should deny access to regular user', async () => {
      const response = await request(app)
        .post('/api/settings/reset')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  // --- PUBLIC ENDPOINTS (Bug #3 regression) ---
  describe('GET /api/settings/venue-info', () => {
    it('should return venue info without authentication (Bug #3 regression)', async () => {
      // First set some venue data
      await request(app)
        .patch('/api/settings/venue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Badminton Club', phone: '02-123-4567', address: '123 Test Rd' });

      const response = await request(app).get('/api/settings/venue-info');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('venue');
      expect(response.body.data).toHaveProperty('operating');
      expect(response.body.data).toHaveProperty('booking');
      expect(response.body.data.venue.name).toBe('Test Badminton Club');
      expect(response.body.data.venue.phone).toBe('02-123-4567');
    });

    it('should include lineId in venue-info response', async () => {
      await request(app)
        .patch('/api/settings/venue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Line Venue', lineId: '@mybadminton' });

      const response = await request(app).get('/api/settings/venue-info');

      expect(response.status).toBe(200);
      expect(response.body.data.venue.lineId).toBe('@mybadminton');
    });

    it('should include operating hours and booking settings', async () => {
      // Set operating and booking data
      await request(app)
        .patch('/api/settings/operating')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ openTime: '06:00', closeTime: '22:00' });

      await request(app)
        .patch('/api/settings/booking')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ advanceBookingDays: 14 });

      const response = await request(app).get('/api/settings/venue-info');

      expect(response.status).toBe(200);
      expect(response.body.data.operating.openTime).toBe('06:00');
      expect(response.body.data.operating.closeTime).toBe('22:00');
      expect(response.body.data.booking.advanceBookingDays).toBe(14);
    });

    it('should return defaults when no settings exist', async () => {
      const response = await request(app).get('/api/settings/venue-info');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.venue).toBeDefined();
      expect(response.body.data.operating).toBeDefined();
      expect(response.body.data.booking).toBeDefined();
    });
  });

  describe('GET /api/settings/payment-info', () => {
    it('should return payment info without authentication', async () => {
      // Set payment data
      await request(app)
        .patch('/api/settings/payment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          acceptPromptPay: true,
          promptPayNumber: '0812345678',
          acceptTransfer: true,
          bankAccount: {
            bankName: 'ธนาคารกสิกรไทย',
            accountNumber: '123-4-56789-0',
            accountName: 'Test Account',
          },
        });

      const response = await request(app).get('/api/settings/payment-info');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.promptPayNumber).toBe('0812345678');
      expect(response.body.data.acceptPromptPay).toBe(true);
      expect(response.body.data.acceptTransfer).toBe(true);
      expect(response.body.data.bankAccount.bankName).toBe('ธนาคารกสิกรไทย');
    });

    it('should return defaults when no payment settings exist', async () => {
      const response = await request(app).get('/api/settings/payment-info');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('promptPayNumber');
      expect(response.body.data).toHaveProperty('bankAccount');
    });
  });

  describe('Integration Tests', () => {
    it('should maintain data consistency across multiple updates', async () => {
      // Update venue
      await request(app)
        .patch('/api/settings/venue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Court A' });

      // Update operating
      await request(app)
        .patch('/api/settings/operating')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ openTime: '07:00' });

      // Get all settings
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.venue.name).toBe('Court A');
      expect(response.body.data.operating.openTime).toBe('07:00');
    });

    it('should handle rapid consecutive updates', async () => {
      const updates = [
        { advanceBookingDays: 5 },
        { advanceBookingDays: 10 },
        { advanceBookingDays: 15 },
      ];

      for (const update of updates) {
        await request(app)
          .patch('/api/settings/booking')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(update);
      }

      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.data.booking.advanceBookingDays).toBe(15);
    });
  });
});
