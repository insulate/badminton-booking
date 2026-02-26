// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://admin:admin123@localhost:27017/badminton_test?authSource=admin';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'badminton_secret_key_for_development_only_change_in_production';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Sale = require('../models/sale.model');
const Shift = require('../models/shift.model');
const Booking = require('../models/booking.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

describe('Sales Tab (Pending/Settlement) API Tests', () => {
  let adminUser, adminToken;
  let testProduct1, testProduct2;
  let testBooking;
  let testCourt, testTimeSlot;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }

    // Clear all test data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Sale.deleteMany({});
    await Shift.deleteMany({});
    await Booking.deleteMany({});
    await Court.deleteMany({});
    await TimeSlot.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      username: 'admin-tab-test',
      password: 'Admin123!',
      name: 'Admin Tab Test',
      role: 'admin',
    });
    adminToken = generateToken(adminUser._id);

    // Create open shift
    const now = new Date();
    await Shift.create({
      shiftCode: 'SFT-TAB-TEST-001',
      user: adminUser._id,
      date: now,
      startTime: now,
      openingCash: 1000,
      status: 'open',
    });

    // Create products
    testProduct1 = await Product.create({
      sku: 'TAB-DRINK-001',
      name: 'น้ำดื่มทดสอบ',
      category: 'beverage',
      price: 20,
      stock: 50,
      trackStock: true,
      status: 'active',
    });

    testProduct2 = await Product.create({
      sku: 'TAB-SNACK-001',
      name: 'ขนมทดสอบ',
      category: 'snack',
      price: 35,
      stock: 30,
      trackStock: true,
      status: 'active',
    });

    // Create court and timeslot
    testCourt = await Court.create({
      courtNumber: 'TAB01',
      name: 'Tab Test Court',
      type: 'normal',
      status: 'available',
    });

    testTimeSlot = await TimeSlot.create({
      startTime: '10:00',
      endTime: '11:00',
      dayType: 'weekday',
      pricing: { normal: 200, member: 150 },
    });

    // Create a test booking (checked-in)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    testBooking = await Booking.create({
      bookingCode: 'TAB-TEST-001',
      customer: { name: 'ลูกค้าทดสอบ', phone: '0899999999', nickname: 'ทดสอบ' },
      court: testCourt._id,
      date: tomorrow,
      timeSlot: testTimeSlot._id,
      duration: 1,
      bookingStatus: 'checked-in',
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      pricing: { subtotal: 200, discount: 0, deposit: 0, total: 200 },
      createdBy: adminUser._id,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Sale.deleteMany({});
    await Shift.deleteMany({});
    await Booking.deleteMany({});
    await Court.deleteMany({});
    await TimeSlot.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Sale.deleteMany({});
    // Reset product stock
    await Product.findByIdAndUpdate(testProduct1._id, { stock: 50 });
    await Product.findByIdAndUpdate(testProduct2._id, { stock: 30 });
    // Reset booking status and payment
    await Booking.findByIdAndUpdate(testBooking._id, {
      bookingStatus: 'checked-in',
      paymentStatus: 'pending',
      'pricing.deposit': 0,
    });
  });

  // =============================================
  // CREATE PENDING SALE (Tab)
  // =============================================
  describe('POST /api/sales - Create Pending Sale (Tab)', () => {
    it('should create a pending sale linked to a booking', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            { product: testProduct1._id, quantity: 2, price: 20, subtotal: 40 },
          ],
          relatedBooking: testBooking._id,
          paymentStatus: 'pending',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentStatus).toBe('pending');
      expect(response.body.data.paymentMethod).toBeNull();
      expect(response.body.data.relatedBooking).toBe(testBooking._id.toString());
    });

    it('should deduct stock immediately for pending sale', async () => {
      await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            { product: testProduct1._id, quantity: 3, price: 20, subtotal: 60 },
          ],
          relatedBooking: testBooking._id,
          paymentStatus: 'pending',
        });

      const product = await Product.findById(testProduct1._id);
      expect(product.stock).toBe(47); // 50 - 3
    });

    it('should fail if pending sale has no relatedBooking', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            { product: testProduct1._id, quantity: 1, price: 20, subtotal: 20 },
          ],
          paymentStatus: 'pending',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('เชื่อมโยงกับการจอง');
    });

    it('should still create normal paid sales correctly', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            { product: testProduct1._id, quantity: 1, price: 20, subtotal: 20 },
          ],
          paymentMethod: 'cash',
          receivedAmount: 20,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.paymentStatus).toBe('paid');
      expect(response.body.data.paymentMethod).toBe('cash');
    });
  });

  // =============================================
  // GET SALES BY BOOKING
  // =============================================
  describe('GET /api/sales/booking/:bookingId', () => {
    it('should return all sales linked to a booking with summary', async () => {
      // Create 2 pending sales
      await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ product: testProduct1._id, quantity: 2, price: 20, subtotal: 40 }],
          relatedBooking: testBooking._id,
          paymentStatus: 'pending',
        });

      await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ product: testProduct2._id, quantity: 1, price: 35, subtotal: 35 }],
          relatedBooking: testBooking._id,
          paymentStatus: 'pending',
        });

      const response = await request(app)
        .get(`/api/sales/booking/${testBooking._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.summary.pendingCount).toBe(2);
      expect(response.body.summary.totalPending).toBe(75); // 40 + 35
      expect(response.body.summary.paidCount).toBe(0);
    });
  });

  // =============================================
  // VOID PENDING SALE
  // =============================================
  describe('PATCH /api/sales/:id/void', () => {
    it('should void a pending sale and restore stock', async () => {
      // Create pending sale
      const createRes = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ product: testProduct1._id, quantity: 5, price: 20, subtotal: 100 }],
          relatedBooking: testBooking._id,
          paymentStatus: 'pending',
        });

      const saleId = createRes.body.data._id;

      // Verify stock was deducted
      let product = await Product.findById(testProduct1._id);
      expect(product.stock).toBe(45); // 50 - 5

      // Void the sale
      const voidRes = await request(app)
        .patch(`/api/sales/${saleId}/void`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(voidRes.status).toBe(200);
      expect(voidRes.body.success).toBe(true);

      // Verify stock was restored
      product = await Product.findById(testProduct1._id);
      expect(product.stock).toBe(50);

      // Verify sale was deleted
      const sale = await Sale.findById(saleId);
      expect(sale).toBeNull();
    });

    it('should not void a paid sale', async () => {
      // Create paid sale
      const createRes = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ product: testProduct1._id, quantity: 1, price: 20, subtotal: 20 }],
          paymentMethod: 'cash',
          receivedAmount: 20,
        });

      const saleId = createRes.body.data._id;

      const voidRes = await request(app)
        .patch(`/api/sales/${saleId}/void`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(voidRes.status).toBe(400);
      expect(voidRes.body.message).toContain('ยังไม่ชำระเงิน');
    });
  });

  // =============================================
  // SETTLE PENDING SALES
  // =============================================
  describe('POST /api/sales/settle', () => {
    let pendingSale1Id, pendingSale2Id;

    beforeEach(async () => {
      // Create 2 pending sales
      const res1 = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ product: testProduct1._id, quantity: 2, price: 20, subtotal: 40 }],
          relatedBooking: testBooking._id,
          paymentStatus: 'pending',
        });
      pendingSale1Id = res1.body.data._id;

      const res2 = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ product: testProduct2._id, quantity: 1, price: 35, subtotal: 35 }],
          relatedBooking: testBooking._id,
          paymentStatus: 'pending',
        });
      pendingSale2Id = res2.body.data._id;
    });

    it('should settle individual sales', async () => {
      const response = await request(app)
        .post('/api/sales/settle')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mode: 'individual',
          saleIds: [pendingSale1Id],
          paymentMethod: 'cash',
          receivedAmount: 50,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.settledSales).toBe(1);
      expect(response.body.data.salesTotalAmount).toBe(40);
      expect(response.body.data.changeAmount).toBe(10);

      // Verify sale was updated
      const sale = await Sale.findById(pendingSale1Id);
      expect(sale.paymentStatus).toBe('paid');
      expect(sale.paymentMethod).toBe('cash');

      // Other sale should remain pending
      const otherSale = await Sale.findById(pendingSale2Id);
      expect(otherSale.paymentStatus).toBe('pending');
    });

    it('should settle combined (booking + all pending sales)', async () => {
      const response = await request(app)
        .post('/api/sales/settle')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mode: 'combined',
          bookingId: testBooking._id,
          paymentMethod: 'cash',
          receivedAmount: 300, // 200 (booking) + 40 + 35 = 275
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.settledSales).toBe(2);
      expect(response.body.data.grandTotal).toBe(275); // 200 + 75
      expect(response.body.data.bookingSettled).toBe(true);
      expect(response.body.data.changeAmount).toBe(25); // 300 - 275

      // Verify all sales are paid
      const sale1 = await Sale.findById(pendingSale1Id);
      const sale2 = await Sale.findById(pendingSale2Id);
      expect(sale1.paymentStatus).toBe('paid');
      expect(sale2.paymentStatus).toBe('paid');

      // Verify booking payment was updated
      const booking = await Booking.findById(testBooking._id);
      expect(booking.paymentStatus).toBe('paid');
      expect(booking.pricing.deposit).toBe(200);
    });

    it('should fail with insufficient cash', async () => {
      const response = await request(app)
        .post('/api/sales/settle')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mode: 'individual',
          saleIds: [pendingSale1Id, pendingSale2Id],
          paymentMethod: 'cash',
          receivedAmount: 10, // insufficient
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('ไม่เพียงพอ');
    });

    it('should settle with non-cash payment without receivedAmount', async () => {
      const response = await request(app)
        .post('/api/sales/settle')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mode: 'individual',
          saleIds: [pendingSale1Id],
          paymentMethod: 'transfer',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const sale = await Sale.findById(pendingSale1Id);
      expect(sale.paymentStatus).toBe('paid');
      expect(sale.paymentMethod).toBe('transfer');
    });
  });

  // =============================================
  // BOOKING CANCEL GUARD
  // =============================================
  describe('Booking Cancel Guard', () => {
    it('should prevent cancelling booking with pending sales', async () => {
      // Create a pending sale
      await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ product: testProduct1._id, quantity: 1, price: 20, subtotal: 20 }],
          relatedBooking: testBooking._id,
          paymentStatus: 'pending',
        });

      // Try to cancel booking - need to set status to something cancellable first
      await Booking.findByIdAndUpdate(testBooking._id, { bookingStatus: 'confirmed' });

      const response = await request(app)
        .patch(`/api/bookings/${testBooking._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('ค้างชำระ');
    });
  });
});
