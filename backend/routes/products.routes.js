const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');
const { protect, admin } = require('../middleware/auth');
const { upload, deleteImage } = require('../middleware/upload');

/**
 * @route   GET /api/products/generate-sku
 * @desc    Generate next SKU for a category
 * @access  Private (Admin/Staff)
 */
router.get('/generate-sku', protect, async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
      });
    }

    // Category prefix mapping
    const prefixes = {
      shuttlecock: 'SHT',
      drink: 'DRK',
      snack: 'SNK',
      equipment: 'EQP',
      other: 'OTH',
    };

    const prefix = prefixes[category];
    if (!prefix) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    // Find the latest SKU with this prefix
    const latestProduct = await Product.findOne({
      sku: { $regex: `^${prefix}-` },
    }).sort({ sku: -1 });

    let nextNumber = 1;
    if (latestProduct) {
      // Extract number from SKU (e.g., "SHT-001" -> 1)
      const match = latestProduct.sku.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format: PREFIX-XXX (e.g., SHT-001)
    const sku = `${prefix}-${String(nextNumber).padStart(3, '0')}`;

    res.status(200).json({
      success: true,
      data: { sku },
    });
  } catch (error) {
    console.error('Error generating SKU:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate SKU',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Private (Admin/Staff)
 */
router.get('/', protect, async (req, res) => {
  try {
    const { category, status, search } = req.query;

    // Build filter
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Private (Admin/Staff)
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (Admin only)
 */
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { sku, name, category, price, stock, lowStockAlert, status } = req.body;

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists',
      });
    }

    // Get image path if uploaded
    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;

    const product = await Product.create({
      sku,
      name,
      category,
      price,
      stock,
      lowStockAlert,
      image: imagePath,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error creating product:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Admin only)
 */
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { sku, name, category, price, stock, lowStockAlert, status } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if SKU is being changed and if it already exists
    if (sku && sku.toUpperCase() !== product.sku) {
      const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists',
        });
      }
    }

    // Prepare update data
    const updateData = { sku, name, category, price, stock, lowStockAlert, status };

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (product.image) {
        await deleteImage(product.image);
      }
      updateData.image = `/uploads/products/${req.file.filename}`;
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error updating product:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock
 * @access  Private (Admin/Staff)
 */
router.patch('/:id/stock', protect, async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock === null) {
      return res.status(400).json({
        success: false,
        message: 'Stock value is required',
      });
    }

    if (stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock cannot be negative',
      });
    }

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Admin only)
 */
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Delete product image if exists
    if (product.image) {
      await deleteImage(product.image);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
});

module.exports = router;
