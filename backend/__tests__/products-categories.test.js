// Set test environment before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://admin:admin123@localhost:27017/badminton_test?authSource=admin';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'badminton_secret_key_for_development_only_change_in_production';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const jwt = require('jsonwebtoken');

// Generate JWT token for testing
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

describe('Products and Categories API Tests', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;
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
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      username: 'admin-product',
      password: 'Admin123!',
      name: 'Admin User',
      role: 'admin',
    });

    // Create regular user
    regularUser = await User.create({
      username: 'user-product',
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
    await Category.deleteMany({});
    await mongoose.connection.close();
  });

  // Clean up before each test
  beforeEach(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  describe('Categories API', () => {
    describe('POST /api/categories', () => {
      it('should create a new category as admin', async () => {
        const response = await request(app)
          .post('/api/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'shuttlecock',
            label: 'ลูกขนไก่',
            icon: 'Feather',
            color: 'blue',
            order: 1,
            isActive: true,
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('shuttlecock');
        expect(response.body.data.label).toBe('ลูกขนไก่');

        testCategory = response.body.data;
      });

      it('should deny category creation for regular user', async () => {
        const response = await request(app)
          .post('/api/categories')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: 'beverage',
            label: 'เครื่องดื่ม',
          });

        expect(response.status).toBe(403);
      });

      it('should fail with duplicate category name', async () => {
        // Create first category
        await Category.create({
          name: 'shuttlecock',
          label: 'ลูกขนไก่',
        });

        // Try to create duplicate
        const response = await request(app)
          .post('/api/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'shuttlecock',
            label: 'ลูกขนไก่ 2',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should deny access without token', async () => {
        const response = await request(app)
          .post('/api/categories')
          .send({
            name: 'test',
            label: 'Test',
          });

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/categories', () => {
      beforeEach(async () => {
        // Create test categories
        await Category.create([
          { name: 'shuttlecock', label: 'ลูกขนไก่', order: 1, isActive: true },
          { name: 'beverage', label: 'เครื่องดื่ม', order: 2, isActive: true },
          { name: 'snack', label: 'ขนม', order: 3, isActive: false },
        ]);
      });

      it('should get all categories (public)', async () => {
        const response = await request(app).get('/api/categories');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(3);
      });

      it('should filter active categories', async () => {
        const response = await request(app).get('/api/categories?isActive=true');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.data.every(cat => cat.isActive)).toBe(true);
      });

      it('should filter inactive categories', async () => {
        const response = await request(app).get('/api/categories?isActive=false');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].isActive).toBe(false);
      });
    });

    describe('GET /api/categories/:id', () => {
      let category;

      beforeEach(async () => {
        category = await Category.create({
          name: 'shuttlecock',
          label: 'ลูกขนไก่',
        });
      });

      it('should get category by id (public)', async () => {
        const response = await request(app).get(`/api/categories/${category._id}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('shuttlecock');
      });

      it('should return 404 for non-existent category', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app).get(`/api/categories/${fakeId}`);

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /api/categories/:id', () => {
      let category;

      beforeEach(async () => {
        category = await Category.create({
          name: 'shuttlecock',
          label: 'ลูกขนไก่',
          order: 1,
        });
      });

      it('should update category as admin', async () => {
        const response = await request(app)
          .put(`/api/categories/${category._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            label: 'ลูกแบดมินตัน',
            order: 5,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.label).toBe('ลูกแบดมินตัน');
        expect(response.body.data.order).toBe(5);
      });

      it('should deny update for regular user', async () => {
        const response = await request(app)
          .put(`/api/categories/${category._id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            label: 'Updated',
          });

        expect(response.status).toBe(403);
      });

      it('should fail with duplicate name', async () => {
        // Create another category
        await Category.create({
          name: 'beverage',
          label: 'เครื่องดื่ม',
        });

        // Try to rename to existing name
        const response = await request(app)
          .put(`/api/categories/${category._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'beverage',
          });

        expect(response.status).toBe(400);
      });
    });

    describe('DELETE /api/categories/:id', () => {
      let category;

      beforeEach(async () => {
        category = await Category.create({
          name: 'shuttlecock',
          label: 'ลูกขนไก่',
        });
      });

      it('should delete category as admin', async () => {
        const response = await request(app)
          .delete(`/api/categories/${category._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify deletion
        const deleted = await Category.findById(category._id);
        expect(deleted).toBeNull();
      });

      it('should deny deletion for regular user', async () => {
        const response = await request(app)
          .delete(`/api/categories/${category._id}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(403);
      });

      it('should fail if category has products', async () => {
        // Create product with this category
        await Product.create({
          sku: 'SHT-001',
          name: 'Test Shuttlecock',
          category: 'shuttlecock',
          price: 100,
          stock: 10,
        });

        const response = await request(app)
          .delete(`/api/categories/${category._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('มีสินค้า');
      });
    });
  });

  describe('Products API', () => {
    describe('POST /api/products', () => {
      it('should create a new product as admin', async () => {
        const response = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            sku: 'SHT-001',
            name: 'Yonex AS-50',
            category: 'shuttlecock',
            price: 450,
            stock: 50,
            lowStockAlert: 10,
            status: 'active',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.sku).toBe('SHT-001');
        expect(response.body.data.name).toBe('Yonex AS-50');

        testProduct = response.body.data;
      });

      it('should deny product creation for regular user', async () => {
        const response = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            sku: 'SHT-002',
            name: 'Test Product',
            category: 'shuttlecock',
            price: 100,
            stock: 10,
          });

        expect(response.status).toBe(403);
      });

      it('should fail with duplicate SKU', async () => {
        // Create first product
        await Product.create({
          sku: 'SHT-001',
          name: 'Product 1',
          category: 'shuttlecock',
          price: 100,
          stock: 10,
        });

        // Try to create duplicate
        const response = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            sku: 'SHT-001',
            name: 'Product 2',
            category: 'shuttlecock',
            price: 100,
            stock: 10,
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('SKU already exists');
      });
    });

    describe('GET /api/products', () => {
      beforeEach(async () => {
        // Create test products
        await Product.create([
          {
            sku: 'SHT-001',
            name: 'Yonex AS-50',
            category: 'shuttlecock',
            price: 450,
            stock: 50,
            status: 'active',
          },
          {
            sku: 'BEV-001',
            name: 'Water',
            category: 'beverage',
            price: 10,
            stock: 100,
            status: 'active',
          },
          {
            sku: 'SNK-001',
            name: 'Snack',
            category: 'snack',
            price: 15,
            stock: 0,
            status: 'inactive',
          },
        ]);
      });

      it('should get all products', async () => {
        const response = await request(app)
          .get('/api/products')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(3);
      });

      it('should filter products by category', async () => {
        const response = await request(app)
          .get('/api/products?category=shuttlecock')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].category).toBe('shuttlecock');
      });

      it('should filter products by status', async () => {
        const response = await request(app)
          .get('/api/products?status=active')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
      });

      it('should search products by name', async () => {
        const response = await request(app)
          .get('/api/products?search=Yonex')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].name).toContain('Yonex');
      });

      it('should deny access without token', async () => {
        const response = await request(app).get('/api/products');

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/products/:id', () => {
      let product;

      beforeEach(async () => {
        product = await Product.create({
          sku: 'SHT-001',
          name: 'Test Product',
          category: 'shuttlecock',
          price: 100,
          stock: 10,
        });
      });

      it('should get product by id', async () => {
        const response = await request(app)
          .get(`/api/products/${product._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.sku).toBe('SHT-001');
      });

      it('should return 404 for non-existent product', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/products/${fakeId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /api/products/:id', () => {
      let product;

      beforeEach(async () => {
        product = await Product.create({
          sku: 'SHT-001',
          name: 'Original Name',
          category: 'shuttlecock',
          price: 100,
          stock: 10,
        });
      });

      it('should update product as admin', async () => {
        const response = await request(app)
          .put(`/api/products/${product._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Updated Name',
            price: 150,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated Name');
        expect(response.body.data.price).toBe(150);
      });

      it('should deny update for regular user', async () => {
        const response = await request(app)
          .put(`/api/products/${product._id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            name: 'Updated',
          });

        expect(response.status).toBe(403);
      });
    });

    describe('PATCH /api/products/:id/stock', () => {
      let product;

      beforeEach(async () => {
        product = await Product.create({
          sku: 'SHT-001',
          name: 'Test Product',
          category: 'shuttlecock',
          price: 100,
          stock: 10,
        });
      });

      it('should update stock as admin', async () => {
        const response = await request(app)
          .patch(`/api/products/${product._id}/stock`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            stock: 25,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.stock).toBe(25);
      });

      it('should fail with negative stock', async () => {
        const response = await request(app)
          .patch(`/api/products/${product._id}/stock`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            stock: -5,
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('cannot be negative');
      });

      it('should deny stock update for regular user', async () => {
        const response = await request(app)
          .patch(`/api/products/${product._id}/stock`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            stock: 20,
          });

        expect(response.status).toBe(403);
      });
    });

    describe('DELETE /api/products/:id', () => {
      let product;

      beforeEach(async () => {
        product = await Product.create({
          sku: 'SHT-001',
          name: 'Test Product',
          category: 'shuttlecock',
          price: 100,
          stock: 10,
        });
      });

      it('should delete product as admin', async () => {
        const response = await request(app)
          .delete(`/api/products/${product._id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify deletion
        const deleted = await Product.findById(product._id);
        expect(deleted).toBeNull();
      });

      it('should deny deletion for regular user', async () => {
        const response = await request(app)
          .delete(`/api/products/${product._id}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/products/generate-sku', () => {
      it('should generate SKU for shuttlecock category', async () => {
        const response = await request(app)
          .get('/api/products/generate-sku?category=shuttlecock')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.sku).toMatch(/^SHT-\d{3}$/);
      });

      it('should generate incremented SKU', async () => {
        // Create product with SHT-001
        await Product.create({
          sku: 'SHT-001',
          name: 'Test',
          category: 'shuttlecock',
          price: 100,
          stock: 10,
        });

        const response = await request(app)
          .get('/api/products/generate-sku?category=shuttlecock')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.sku).toBe('SHT-002');
      });

      it('should fail without category', async () => {
        const response = await request(app)
          .get('/api/products/generate-sku')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
      });
    });
  });

  // --- Beverage category (renamed from 'drink' to match Category collection) ---
  describe('Beverage Category', () => {
    it('should create product with category "beverage" successfully', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: 'DRK-001',
          name: 'น้ำดื่ม',
          category: 'beverage',
          price: 10,
          stock: 100,
          status: 'active',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('beverage');
    });

    it('should generate SKU with DRK prefix for beverage category', async () => {
      const response = await request(app)
        .get('/api/products/generate-sku?category=beverage')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sku).toMatch(/^DRK-\d{3}$/);
    });

    it('should reject product with invalid category "drink"', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: 'DRK-002',
          name: 'เครื่องดื่ม',
          category: 'drink',
          price: 15,
          stock: 50,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Integration Tests', () => {
    it('should handle full product management flow', async () => {
      // 1. Create category
      const categoryResponse = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'shuttlecock',
          label: 'ลูกขนไก่',
          icon: 'Feather',
          color: 'blue',
          order: 1,
          isActive: true,
        });

      expect(categoryResponse.status).toBe(201);

      // 2. Generate SKU
      const skuResponse = await request(app)
        .get('/api/products/generate-sku?category=shuttlecock')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(skuResponse.status).toBe(200);
      const sku = skuResponse.body.data.sku;

      // 3. Create product
      const productResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku,
          name: 'Yonex AS-50',
          category: 'shuttlecock',
          price: 450,
          stock: 50,
          lowStockAlert: 10,
          status: 'active',
        });

      expect(productResponse.status).toBe(201);
      const productId = productResponse.body.data._id;

      // 4. Update stock
      const stockResponse = await request(app)
        .patch(`/api/products/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stock: 30 });

      expect(stockResponse.status).toBe(200);
      expect(stockResponse.body.data.stock).toBe(30);

      // 5. Update product
      const updateResponse = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 480 });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.price).toBe(480);
    });
  });
});
