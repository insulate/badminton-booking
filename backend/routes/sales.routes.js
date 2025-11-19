const express = require('express');
const router = express.Router();
const Sale = require('../models/sale.model');
const Product = require('../models/product.model');
const { generateSaleCode } = require('../utils/saleCodeGenerator');
const { protect, admin } = require('../middleware/auth');

/**
 * @route   GET /api/sales
 * @desc    Get all sales with filters
 * @access  Private (Admin/Staff)
 */
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, page = 1, limit = 50 } = req.query;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    // Pagination
    const skip = (page - 1) * limit;

    const sales = await Sale.find(filter)
      .populate('items.product', 'name sku category')
      .populate('relatedBooking', 'bookingCode')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: sales.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: sales,
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/sales/daily
 * @desc    Get daily sales report
 * @access  Private (Admin/Staff)
 */
router.get('/daily', protect, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required',
      });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('items.product', 'name sku category')
      .sort({ createdAt: -1 });

    // Calculate summary
    const summary = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      byPaymentMethod: {},
      byCategory: {},
    };

    // Group by payment method
    sales.forEach((sale) => {
      const method = sale.paymentMethod;
      if (!summary.byPaymentMethod[method]) {
        summary.byPaymentMethod[method] = { count: 0, total: 0 };
      }
      summary.byPaymentMethod[method].count++;
      summary.byPaymentMethod[method].total += sale.total;
    });

    // Group by product category
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const category = item.product?.category || 'other';
        if (!summary.byCategory[category]) {
          summary.byCategory[category] = { quantity: 0, revenue: 0 };
        }
        summary.byCategory[category].quantity += item.quantity;
        summary.byCategory[category].revenue += item.subtotal;
      });
    });

    res.status(200).json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      summary,
      sales,
    });
  } catch (error) {
    console.error('Error fetching daily report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily report',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/sales/:id
 * @desc    Get single sale by ID
 * @access  Private (Admin/Staff)
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('items.product', 'name sku category')
      .populate('relatedBooking', 'bookingCode customer')
      .populate('createdBy', 'name');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }

    res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sale',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/sales
 * @desc    Create new sale
 * @access  Private (Admin/Staff)
 */
router.post('/', protect, async (req, res) => {
  let saleId = null;

  try {
    const { items, customer, paymentMethod, relatedBooking } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required',
      });
    }

    // Check product availability and calculate subtotals
    const processedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not active`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        subtotal: product.price * item.quantity,
      });
    }

    // Generate sale code
    const saleCode = await generateSaleCode();

    // Create sale
    const sale = await Sale.create({
      saleCode,
      items: processedItems,
      customer,
      paymentMethod,
      relatedBooking,
      createdBy: req.user._id,
    });

    saleId = sale._id;

    // Update product stock atomically with stock check
    // This prevents race condition by using atomic operation
    for (const item of processedItems) {
      const updated = await Product.findOneAndUpdate(
        {
          _id: item.product,
          stock: { $gte: item.quantity }, // Only update if stock is sufficient
        },
        {
          $inc: { stock: -item.quantity },
        },
        { new: true }
      );

      // If update failed, it means stock is insufficient (race condition occurred)
      if (!updated) {
        // Rollback: Delete the sale
        await Sale.findByIdAndDelete(saleId);

        const product = await Product.findById(item.product);
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product?.name || 'product'}. Someone else purchased it. Please try again.`,
        });
      }
    }

    // Populate sale before sending response
    const populatedSale = await Sale.findById(sale._id)
      .populate('items.product', 'name sku category')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: populatedSale,
    });
  } catch (error) {
    console.error('Error creating sale:', error);

    // Rollback sale if it was created
    if (saleId) {
      try {
        await Sale.findByIdAndDelete(saleId);
      } catch (rollbackError) {
        console.error('Error rolling back sale:', rollbackError);
      }
    }

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
      message: 'Failed to create sale',
      error: error.message,
    });
  }
});

module.exports = router;
