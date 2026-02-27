const express = require('express');
const router = express.Router();
const Sale = require('../models/sale.model');
const Product = require('../models/product.model');
const Booking = require('../models/booking.model');
const Shift = require('../models/shift.model');
const { generateSaleCode } = require('../utils/saleCodeGenerator');
const { protect, admin } = require('../middleware/auth');

/**
 * @route   GET /api/sales/pending-count
 * @desc    Get count of pending (unpaid) sales
 * @access  Private (Admin/Staff)
 */
router.get('/pending-count', protect, async (req, res) => {
  try {
    const count = await Sale.countDocuments({ paymentStatus: 'pending' });
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Get pending sales count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get pending sales count' });
  }
});

/**
 * @route   GET /api/sales
 * @desc    Get all sales with filters
 * @access  Private (Admin/Staff)
 */
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, paymentStatus, page = 1, limit = 50 } = req.query;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59.999');
        filter.createdAt.$lte = end;
      }
    }
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    // Pagination
    const skip = (page - 1) * limit;

    const sales = await Sale.find(filter)
      .populate('items.product', 'name sku category image')
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

    const targetDate = new Date(date + 'T00:00:00');
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('items.product', 'name sku category image')
      .sort({ createdAt: -1 });

    // Separate paid and pending sales
    const paidSales = sales.filter((s) => s.paymentStatus !== 'pending');
    const pendingSales = sales.filter((s) => s.paymentStatus === 'pending');

    // Calculate summary (only from paid sales)
    const summary = {
      totalSales: paidSales.length,
      totalRevenue: paidSales.reduce((sum, sale) => sum + sale.total, 0),
      pendingCount: pendingSales.length,
      pendingTotal: pendingSales.reduce((sum, sale) => sum + sale.total, 0),
      byPaymentMethod: {},
      byCategory: {},
    };

    // Group by payment method (paid only)
    paidSales.forEach((sale) => {
      const method = sale.paymentMethod;
      if (!summary.byPaymentMethod[method]) {
        summary.byPaymentMethod[method] = { count: 0, total: 0 };
      }
      summary.byPaymentMethod[method].count++;
      summary.byPaymentMethod[method].total += sale.total;
    });

    // Group by product category (all sales)
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
 * @route   GET /api/sales/booking/:bookingId
 * @desc    Get all sales linked to a booking
 * @access  Private (Admin/Staff)
 */
router.get('/booking/:bookingId', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentStatus } = req.query;

    const filter = { relatedBooking: bookingId };
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const sales = await Sale.find(filter)
      .populate('items.product', 'name sku category image price')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const pendingSales = sales.filter((s) => s.paymentStatus === 'pending');
    const paidSales = sales.filter((s) => s.paymentStatus === 'paid');

    res.status(200).json({
      success: true,
      data: sales,
      summary: {
        totalSales: sales.length,
        pendingCount: pendingSales.length,
        paidCount: paidSales.length,
        totalPending: pendingSales.reduce((sum, s) => sum + s.total, 0),
        totalPaid: paidSales.reduce((sum, s) => sum + s.total, 0),
        grandTotal: sales.reduce((sum, s) => sum + s.total, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching booking sales:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking sales',
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
      .populate('items.product', 'name sku category image')
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
    const { items, customer, paymentMethod, relatedBooking, receivedAmount, paymentStatus: reqPaymentStatus } = req.body;
    const paymentStatus = reqPaymentStatus || 'paid';

    // Check if user has an open shift (required for creating sales)
    const openShift = await Shift.findOpenShift(req.user._id);
    if (!openShift) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเปิดกะก่อนขายสินค้า',
        requireShift: true,
      });
    }

    // Validate pending sale: must have relatedBooking OR customer name (walk-in)
    if (paymentStatus === 'pending') {
      if (!relatedBooking && !customer?.name) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุชื่อลูกค้า หรือเลือกการจอง',
        });
      }
      if (relatedBooking) {
        const booking = await Booking.findById(relatedBooking);
        if (!booking || booking.deletedAt || booking.bookingStatus === 'cancelled') {
          return res.status(400).json({
            success: false,
            message: 'ไม่พบการจอง หรือการจองถูกยกเลิกแล้ว',
          });
        }
      }
    }

    // Validate payment method for paid sales
    if (paymentStatus === 'paid' && !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกวิธีชำระเงิน',
      });
    }

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

      if (product.trackStock !== false && product.stock < item.quantity) {
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

    // Calculate total
    const total = processedItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Calculate change for cash payment (only for paid sales)
    let finalReceivedAmount = null;
    let finalChangeAmount = null;

    if (paymentStatus === 'paid' && paymentMethod === 'cash' && receivedAmount !== undefined && receivedAmount !== null) {
      if (receivedAmount < total) {
        return res.status(400).json({
          success: false,
          message: 'Received amount must be greater than or equal to total',
        });
      }
      finalReceivedAmount = receivedAmount;
      finalChangeAmount = receivedAmount - total;
    }

    // Create sale with shift reference
    const sale = await Sale.create({
      saleCode,
      items: processedItems,
      customer,
      paymentStatus,
      paymentMethod: paymentStatus === 'paid' ? paymentMethod : null,
      relatedBooking,
      createdBy: req.user._id,
      shift: openShift._id,
      total,
      receivedAmount: finalReceivedAmount,
      changeAmount: finalChangeAmount,
    });

    saleId = sale._id;

    // Update product stock atomically with stock check
    // This prevents race condition by using atomic operation
    for (const item of processedItems) {
      const productDoc = await Product.findById(item.product);

      // Skip stock deduction for products that don't track stock
      if (productDoc && productDoc.trackStock === false) {
        continue;
      }

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
      .populate('items.product', 'name sku category image')
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

/**
 * @route   POST /api/sales/settle
 * @desc    Settle pending sales (individual or combined with booking)
 * @access  Private (Admin/Staff)
 */
router.post('/settle', protect, async (req, res) => {
  try {
    const { mode, saleIds, bookingId, paymentMethod, receivedAmount } = req.body;

    // Check open shift
    const openShift = await Shift.findOpenShift(req.user._id);
    if (!openShift) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเปิดกะก่อน',
        requireShift: true,
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกวิธีชำระเงิน',
      });
    }

    let salesToSettle = [];
    let bookingToSettle = null;

    if (mode === 'individual') {
      if (!saleIds || saleIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกรายการที่ต้องการชำระ',
        });
      }
      salesToSettle = await Sale.find({
        _id: { $in: saleIds },
        paymentStatus: 'pending',
      });
    } else if (mode === 'combined') {
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุการจอง',
        });
      }
      salesToSettle = await Sale.find({
        relatedBooking: bookingId,
        paymentStatus: 'pending',
      });
      bookingToSettle = await Booking.findById(bookingId);
      if (!bookingToSettle) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบการจอง',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ mode (individual หรือ combined)',
      });
    }

    // Calculate totals
    const salesTotalAmount = salesToSettle.reduce((sum, s) => sum + s.total, 0);
    const bookingRemainingAmount =
      mode === 'combined' && bookingToSettle
        ? bookingToSettle.pricing.total - (bookingToSettle.pricing.deposit || 0)
        : 0;
    const grandTotal = salesTotalAmount + bookingRemainingAmount;

    // Cash validation
    let finalReceivedAmount = null;
    let finalChangeAmount = null;
    if (paymentMethod === 'cash') {
      if (!receivedAmount || receivedAmount < grandTotal) {
        return res.status(400).json({
          success: false,
          message: `จำนวนเงินที่รับไม่เพียงพอ (ต้องการ ฿${grandTotal.toFixed(2)})`,
        });
      }
      finalReceivedAmount = receivedAmount;
      finalChangeAmount = receivedAmount - grandTotal;
    }

    // Update all pending sales to paid
    const settledSaleIds = salesToSettle.map((s) => s._id);
    if (settledSaleIds.length > 0) {
      await Sale.updateMany(
        { _id: { $in: settledSaleIds } },
        {
          $set: {
            paymentStatus: 'paid',
            paymentMethod,
            receivedAmount: finalReceivedAmount,
            changeAmount: finalChangeAmount,
            shift: openShift._id,
          },
        }
      );
    }

    // Update booking payment if combined mode
    let bookingSettled = false;
    if (mode === 'combined' && bookingToSettle && bookingRemainingAmount > 0) {
      bookingToSettle.pricing.deposit = bookingToSettle.pricing.total;
      bookingToSettle.paymentStatus = 'paid';
      bookingToSettle.paymentMethod = paymentMethod;
      await bookingToSettle.save();
      bookingSettled = true;
    }

    res.status(200).json({
      success: true,
      message: 'ชำระเงินสำเร็จ',
      data: {
        settledSales: settledSaleIds.length,
        salesTotalAmount,
        bookingRemainingAmount,
        grandTotal,
        paymentMethod,
        receivedAmount: finalReceivedAmount,
        changeAmount: finalChangeAmount,
        bookingSettled,
      },
    });
  } catch (error) {
    console.error('Error settling sales:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to settle sales',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/sales/:id/add-items
 * @desc    Add items to an existing pending sale
 * @access  Private (Admin/Staff)
 */
router.patch('/:id/add-items', protect, async (req, res) => {
  try {
    const { items } = req.body;
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการขาย' });
    }

    if (sale.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'สามารถเพิ่มสินค้าได้เฉพาะรายการที่ยังไม่ชำระเงิน',
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ',
      });
    }

    // Validate products and check stock
    const processedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `ไม่พบสินค้า: ${item.product}`,
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `สินค้า ${product.name} ไม่พร้อมขาย`,
        });
      }

      if (product.trackStock !== false && product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `สต็อกไม่เพียงพอสำหรับ ${product.name} (คงเหลือ ${product.stock})`,
        });
      }

      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        subtotal: product.price * item.quantity,
      });
    }

    // Deduct stock atomically
    const deductedProducts = [];
    for (const item of processedItems) {
      const productDoc = await Product.findById(item.product);
      if (productDoc && productDoc.trackStock === false) {
        deductedProducts.push(item);
        continue;
      }

      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updated) {
        // Rollback already deducted stock
        for (const deducted of deductedProducts) {
          const p = await Product.findById(deducted.product);
          if (p && p.trackStock !== false) {
            await Product.findByIdAndUpdate(deducted.product, {
              $inc: { stock: deducted.quantity },
            });
          }
        }
        const product = await Product.findById(item.product);
        return res.status(400).json({
          success: false,
          message: `สต็อกไม่เพียงพอสำหรับ ${product?.name || 'สินค้า'} กรุณาลองใหม่`,
        });
      }
      deductedProducts.push(item);
    }

    // Merge items into sale: if same product exists, increase quantity
    for (const newItem of processedItems) {
      const existingIndex = sale.items.findIndex(
        (i) => i.product.toString() === newItem.product.toString()
      );

      if (existingIndex >= 0) {
        sale.items[existingIndex].quantity += newItem.quantity;
        sale.items[existingIndex].subtotal += newItem.subtotal;
      } else {
        sale.items.push(newItem);
      }
    }

    // Pre-save hook will recalculate total
    await sale.save();

    const populatedSale = await Sale.findById(sale._id)
      .populate('items.product', 'name sku category image')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      message: 'เพิ่มสินค้าเข้าบิลสำเร็จ',
      data: populatedSale,
    });
  } catch (error) {
    console.error('Error adding items to sale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add items to sale',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/sales/:id/void
 * @desc    Void a pending sale (restore stock)
 * @access  Private (Admin/Staff)
 */
router.patch('/:id/void', protect, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการขาย' });
    }
    if (sale.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'สามารถยกเลิกได้เฉพาะรายการที่ยังไม่ชำระเงิน',
      });
    }

    // Restore stock
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product && product.trackStock !== false) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    // Delete the voided sale
    await Sale.findByIdAndDelete(sale._id);

    res.status(200).json({
      success: true,
      message: 'ยกเลิกรายการสำเร็จ คืนสต็อกเรียบร้อย',
    });
  } catch (error) {
    console.error('Error voiding sale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to void sale',
      error: error.message,
    });
  }
});

module.exports = router;
