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
const jwt = require('jsonwebtoken');

// Generate JWT token for testing
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// Format date to YYYY-MM-DD using local timezone (avoid UTC conversion issues)
const formatDateToString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('Sales/POS API Tests', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;
  let testProduct1;
  let testProduct2;

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
    await Product.deleteMany({});
    await Sale.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      username: 'admin-sales',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin',
    });

    // Create regular user
    regularUser = await User.create({
      username: 'user-sales',
      password: 'User123!',
      name: 'Regular User',
      role: 'user',
    });

    // Generate tokens
    adminToken = generateToken(adminUser._id);
    userToken = generateToken(regularUser._id);
  });

  // Cleanup: Close DB connection after all tests
  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Sale.deleteMany({});
    await mongoose.connection.close();
  });

  // Clean up before each test
  beforeEach(async () => {
    await Product.deleteMany({});
    await Sale.deleteMany({});

    // Create test products
    testProduct1 = await Product.create({
      sku: 'SHT-001',
      name: 'Yonex AS-50',
      category: 'shuttlecock',
      price: 450,
      stock: 50,
      lowStockAlert: 10,
      status: 'active',
    });

    testProduct2 = await Product.create({
      sku: 'BEV-001',
      name: 'Water Bottle',
      category: 'beverage',
      price: 10,
      stock: 100,
      lowStockAlert: 20,
      status: 'active',
    });
  });

  describe('POST /api/sales', () => {
    it('should create a new sale successfully', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product: testProduct1._id.toString(),
              quantity: 2,
            },
            {
              product: testProduct2._id.toString(),
              quantity: 3,
            },
          ],
          customer: {
            type: 'walk-in',
            name: 'John Doe',
            phone: '0812345678',
          },
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('saleCode');
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.total).toBe(450 * 2 + 10 * 3); // 930

      // Verify stock was updated
      const updatedProduct1 = await Product.findById(testProduct1._id);
      const updatedProduct2 = await Product.findById(testProduct2._id);
      expect(updatedProduct1.stock).toBe(48); // 50 - 2
      expect(updatedProduct2.stock).toBe(97); // 100 - 3
    });

    it('should allow regular user to create sale', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              product: testProduct1._id.toString(),
              quantity: 1,
            },
          ],
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should fail with empty items array', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [],
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('At least one item is required');
    });

    it('should fail with non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product: fakeId.toString(),
              quantity: 1,
            },
          ],
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Product not found');
    });

    it('should fail with insufficient stock', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product: testProduct1._id.toString(),
              quantity: 100, // More than available stock (50)
            },
          ],
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should fail with inactive product', async () => {
      // Make product inactive
      testProduct1.status = 'inactive';
      await testProduct1.save();

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product: testProduct1._id.toString(),
              quantity: 1,
            },
          ],
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not active');
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .post('/api/sales')
        .send({
          items: [
            {
              product: testProduct1._id.toString(),
              quantity: 1,
            },
          ],
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(401);
    });

    it('should calculate total correctly with multiple items', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product: testProduct1._id.toString(),
              quantity: 3, // 450 * 3 = 1350
            },
            {
              product: testProduct2._id.toString(),
              quantity: 5, // 10 * 5 = 50
            },
          ],
          paymentMethod: 'promptpay',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.total).toBe(1400);
      expect(response.body.data.items[0].subtotal).toBe(1350);
      expect(response.body.data.items[1].subtotal).toBe(50);
    });

    // Change calculation tests
    it('should create sale with receivedAmount and calculate changeAmount for cash payment', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product: testProduct1._id.toString(),
              quantity: 2, // 450 * 2 = 900
            },
          ],
          paymentMethod: 'cash',
          receivedAmount: 1000,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.receivedAmount).toBe(1000);
      expect(response.body.data.changeAmount).toBe(100); // 1000 - 900
    });

    it('should allow cash payment without receivedAmount (backward compatibility)', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product: testProduct1._id.toString(),
              quantity: 1,
            },
          ],
          paymentMethod: 'cash',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.receivedAmount).toBeNull();
      expect(response.body.data.changeAmount).toBeNull();
    });

    it('should accept exact payment amount with zero change', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product: testProduct1._id.toString(),
              quantity: 2, // 450 * 2 = 900
            },
          ],
          paymentMethod: 'cash',
          receivedAmount: 900,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.receivedAmount).toBe(900);
      expect(response.body.data.changeAmount).toBe(0);
    });

    it('should reject cash payment with insufficient receivedAmount', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product: testProduct1._id.toString(),
              quantity: 2, // 450 * 2 = 900
            },
          ],
          paymentMethod: 'cash',
          receivedAmount: 500, // Less than 900
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Received amount must be greater than or equal to total');
    });

    it('should ignore receivedAmount for non-cash payment methods', async () => {
      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product: testProduct1._id.toString(),
              quantity: 1,
            },
          ],
          paymentMethod: 'promptpay',
          receivedAmount: 1000, // Should be ignored
        });

      expect(response.status).toBe(201);
      expect(response.body.data.receivedAmount).toBeNull();
      expect(response.body.data.changeAmount).toBeNull();
    });
  });

  describe('GET /api/sales', () => {
    beforeEach(async () => {
      // Create test sales with explicit times to avoid timezone issues
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone edge cases
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await Sale.create([
        {
          saleCode: 'SAL2025111900001',
          items: [
            {
              product: testProduct1._id,
              quantity: 2,
              price: 450,
              subtotal: 900,
            },
          ],
          total: 900,
          paymentMethod: 'cash',
          createdBy: adminUser._id,
          createdAt: today,
        },
        {
          saleCode: 'SAL2025111900002',
          items: [
            {
              product: testProduct2._id,
              quantity: 5,
              price: 10,
              subtotal: 50,
            },
          ],
          total: 50,
          paymentMethod: 'promptpay',
          createdBy: adminUser._id,
          createdAt: yesterday,
        },
      ]);
    });

    it('should get all sales', async () => {
      const response = await request(app)
        .get('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should filter sales by payment method', async () => {
      const response = await request(app)
        .get('/api/sales?paymentMethod=cash')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].paymentMethod).toBe('cash');
    });

    it('should filter sales by date range', async () => {
      const today = new Date();
      const todayStr = formatDateToString(today);

      const response = await request(app)
        .get(`/api/sales?startDate=${todayStr}&endDate=${todayStr}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });

    it('should deny access without token', async () => {
      const response = await request(app).get('/api/sales');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/sales/:id', () => {
    let sale;

    beforeEach(async () => {
      sale = await Sale.create({
        saleCode: 'SAL2025111900001',
        items: [
          {
            product: testProduct1._id,
            quantity: 2,
            price: 450,
            subtotal: 900,
          },
        ],
        total: 900,
        paymentMethod: 'cash',
        createdBy: adminUser._id,
      });
    });

    it('should get sale by id', async () => {
      const response = await request(app)
        .get(`/api/sales/${sale._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.saleCode).toBe('SAL2025111900001');
      expect(response.body.data.total).toBe(900);
    });

    it('should return 404 for non-existent sale', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/sales/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should deny access without token', async () => {
      const response = await request(app).get(`/api/sales/${sale._id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/sales/daily', () => {
    beforeEach(async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create sales for today
      await Sale.create([
        {
          saleCode: 'SAL2025111900001',
          items: [
            {
              product: testProduct1._id,
              quantity: 2,
              price: 450,
              subtotal: 900,
            },
          ],
          total: 900,
          paymentMethod: 'cash',
          createdBy: adminUser._id,
          createdAt: today,
        },
        {
          saleCode: 'SAL2025111900002',
          items: [
            {
              product: testProduct2._id,
              quantity: 5,
              price: 10,
              subtotal: 50,
            },
          ],
          total: 50,
          paymentMethod: 'promptpay',
          createdBy: adminUser._id,
          createdAt: today,
        },
      ]);
    });

    it('should get daily sales report', async () => {
      const today = new Date();
      const todayStr = formatDateToString(today);

      const response = await request(app)
        .get(`/api/sales/daily?date=${todayStr}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.summary.totalSales).toBe(2);
      expect(response.body.summary.totalRevenue).toBe(950);
      expect(response.body.summary.byPaymentMethod).toHaveProperty('cash');
      expect(response.body.summary.byPaymentMethod).toHaveProperty('promptpay');
    });

    it('should fail without date parameter', async () => {
      const response = await request(app)
        .get('/api/sales/daily')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Date parameter is required');
    });

    it('should deny access without token', async () => {
      const today = formatDateToString(new Date());
      const response = await request(app).get(`/api/sales/daily?date=${today}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete POS flow', async () => {
      // 1. Create a sale
      const saleResponse = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              product: testProduct1._id.toString(),
              quantity: 3,
            },
            {
              product: testProduct2._id.toString(),
              quantity: 2,
            },
          ],
          customer: {
            type: 'walk-in',
            name: 'Test Customer',
            phone: '0899999999',
          },
          paymentMethod: 'cash',
        });

      expect(saleResponse.status).toBe(201);
      const saleId = saleResponse.body.data._id;

      // 2. Verify stock was deducted
      const product1 = await Product.findById(testProduct1._id);
      const product2 = await Product.findById(testProduct2._id);
      expect(product1.stock).toBe(47); // 50 - 3
      expect(product2.stock).toBe(98); // 100 - 2

      // 3. Get sale details
      const getSaleResponse = await request(app)
        .get(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getSaleResponse.status).toBe(200);
      expect(getSaleResponse.body.data.total).toBe(450 * 3 + 10 * 2);

      // 4. Get all sales
      const listResponse = await request(app)
        .get('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data.length).toBeGreaterThan(0);

      // 5. Get daily report
      const today = formatDateToString(new Date());
      const reportResponse = await request(app)
        .get(`/api/sales/daily?date=${today}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(reportResponse.status).toBe(200);
      expect(reportResponse.body.summary.totalRevenue).toBeGreaterThan(0);
    });

    it('should prevent overselling with concurrent requests', async () => {
      // Update product to have low stock
      testProduct1.stock = 5;
      await testProduct1.save();

      // Try to sell 4 items twice (total 8 > 5)
      const sale1Promise = request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ product: testProduct1._id.toString(), quantity: 4 }],
          paymentMethod: 'cash',
        });

      const sale2Promise = request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ product: testProduct1._id.toString(), quantity: 4 }],
          paymentMethod: 'cash',
        });

      const [response1, response2] = await Promise.all([sale1Promise, sale2Promise]);

      // One should succeed, one should fail
      const responses = [response1, response2];
      const successCount = responses.filter((r) => r.status === 201).length;
      const failCount = responses.filter((r) => r.status === 400).length;

      expect(successCount).toBe(1);
      expect(failCount).toBe(1);

      // Verify final stock is correct
      const finalProduct = await Product.findById(testProduct1._id);
      expect(finalProduct.stock).toBe(1); // 5 - 4 = 1
    });
  });
});
