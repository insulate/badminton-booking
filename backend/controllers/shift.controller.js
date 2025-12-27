const Shift = require('../models/shift.model');
const Sale = require('../models/sale.model');
const { generateShiftCode } = require('../utils/shiftCodeGenerator');

/**
 * Get all shifts (Admin only)
 * GET /api/shifts
 */
const getAll = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // Filter by date range
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Filter by user
    if (userId) {
      filter.user = userId;
    }

    // Filter by status
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [shifts, total] = await Promise.all([
      Shift.find(filter)
        .populate('user', 'name username')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Shift.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: shifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting shifts:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลกะ',
    });
  }
};

/**
 * Get current open shift for user
 * GET /api/shifts/current
 */
const getCurrent = async (req, res) => {
  try {
    const shift = await Shift.findOpenShift(req.user._id);

    if (!shift) {
      return res.json({
        success: true,
        data: null,
        hasOpenShift: false,
      });
    }

    // Get sales for this shift
    const sales = await Sale.find({ shift: shift._id })
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    // Calculate real-time summary
    const summary = calculateShiftSummary(sales, shift.expenses);

    res.json({
      success: true,
      data: {
        ...shift.toObject(),
        summary,
        salesCount: sales.length,
      },
      hasOpenShift: true,
    });
  } catch (error) {
    console.error('Error getting current shift:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลกะปัจจุบัน',
    });
  }
};

/**
 * Get shift by ID
 * GET /api/shifts/:id
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const shift = await Shift.findById(id).populate('user', 'name username');

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกะ',
      });
    }

    // Get sales for this shift
    const sales = await Sale.find({ shift: shift._id })
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...shift.toObject(),
        sales,
        salesCount: sales.length,
      },
    });
  } catch (error) {
    console.error('Error getting shift:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลกะ',
    });
  }
};

/**
 * Open new shift
 * POST /api/shifts/open
 */
const openShift = async (req, res) => {
  try {
    const { openingCash } = req.body;

    // Validate opening cash
    if (openingCash === undefined || openingCash < 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุจำนวนเงินเปิดกะ',
      });
    }

    // Check if user already has an open shift
    const existingShift = await Shift.findOpenShift(req.user._id);
    if (existingShift) {
      return res.status(400).json({
        success: false,
        message: 'คุณมีกะที่เปิดอยู่แล้ว กรุณาปิดกะก่อนเปิดกะใหม่',
        data: existingShift,
      });
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Generate shift code
    const shiftCode = await generateShiftCode(now);

    const shift = new Shift({
      shiftCode,
      user: req.user._id,
      date: today,
      startTime: now,
      openingCash,
      status: 'open',
    });

    await shift.save();

    const populated = await Shift.findById(shift._id).populate(
      'user',
      'name username'
    );

    res.status(201).json({
      success: true,
      message: 'เปิดกะสำเร็จ',
      data: populated,
    });
  } catch (error) {
    console.error('Error opening shift:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเปิดกะ',
    });
  }
};

/**
 * Add expense to shift
 * POST /api/shifts/:id/expense
 */
const addExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description, amount } = req.body;

    // Validate
    if (!category || !description || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลรายจ่ายให้ครบ',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'จำนวนเงินต้องมากกว่า 0',
      });
    }

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกะ',
      });
    }

    if (shift.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'กะนี้ปิดแล้ว ไม่สามารถเพิ่มรายจ่ายได้',
      });
    }

    // Check if user owns this shift or is admin
    if (
      shift.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขกะนี้',
      });
    }

    shift.expenses.push({
      category,
      description,
      amount,
      createdBy: req.user._id,
    });

    await shift.save();

    res.json({
      success: true,
      message: 'เพิ่มรายจ่ายสำเร็จ',
      data: shift,
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มรายจ่าย',
    });
  }
};

/**
 * Remove expense from shift
 * DELETE /api/shifts/:id/expense/:expenseId
 */
const removeExpense = async (req, res) => {
  try {
    const { id, expenseId } = req.params;

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกะ',
      });
    }

    if (shift.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'กะนี้ปิดแล้ว ไม่สามารถลบรายจ่ายได้',
      });
    }

    // Check if user owns this shift or is admin
    if (
      shift.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขกะนี้',
      });
    }

    const expenseIndex = shift.expenses.findIndex(
      (e) => e._id.toString() === expenseId
    );

    if (expenseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบรายจ่ายนี้',
      });
    }

    shift.expenses.splice(expenseIndex, 1);
    await shift.save();

    res.json({
      success: true,
      message: 'ลบรายจ่ายสำเร็จ',
      data: shift,
    });
  } catch (error) {
    console.error('Error removing expense:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบรายจ่าย',
    });
  }
};

/**
 * Close shift
 * POST /api/shifts/:id/close
 */
const closeShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualCash, actualNonCash, note } = req.body;

    // Validate
    if (actualCash === undefined || actualNonCash === undefined) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกยอดเงินสดและยอดโอน',
      });
    }

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกะ',
      });
    }

    if (shift.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'กะนี้ปิดแล้ว',
      });
    }

    // Check if user owns this shift or is admin
    if (
      shift.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์ปิดกะนี้',
      });
    }

    // Get all sales for this shift
    const sales = await Sale.find({ shift: shift._id });

    // Calculate summary
    const summary = calculateShiftSummary(sales, shift.expenses);

    // Update shift with summary
    shift.summary = summary;

    // Close the shift
    shift.closeShift(actualCash, actualNonCash, note);

    await shift.save();

    const populated = await Shift.findById(shift._id).populate(
      'user',
      'name username'
    );

    res.json({
      success: true,
      message: 'ปิดกะสำเร็จ',
      data: populated,
    });
  } catch (error) {
    console.error('Error closing shift:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการปิดกะ',
    });
  }
};

/**
 * Get shift summary (real-time calculation)
 * GET /api/shifts/:id/summary
 */
const getSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const shift = await Shift.findById(id).populate('user', 'name username');

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกะ',
      });
    }

    // Get all sales for this shift
    const sales = await Sale.find({ shift: shift._id });

    // Calculate summary
    const summary = calculateShiftSummary(sales, shift.expenses);

    // Calculate expected amounts
    const totalExpenses = shift.expenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );
    const expectedCash =
      shift.openingCash +
      summary.cashSales -
      summary.totalChangeGiven -
      totalExpenses;
    const expectedNonCash = summary.promptpaySales + summary.transferSales;

    res.json({
      success: true,
      data: {
        shift: {
          shiftCode: shift.shiftCode,
          startTime: shift.startTime,
          openingCash: shift.openingCash,
          status: shift.status,
        },
        summary,
        expected: {
          cash: expectedCash,
          nonCash: expectedNonCash,
        },
        salesCount: sales.length,
      },
    });
  } catch (error) {
    console.error('Error getting shift summary:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสรุปกะ',
    });
  }
};

/**
 * Admin update shift
 * PUT /api/shifts/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลกะ',
      });
    }

    // Allow updating specific fields
    const allowedUpdates = [
      'openingCash',
      'closingCash',
      'closingNonCash',
      'closingNote',
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        shift[field] = updates[field];
      }
    });

    await shift.save();

    const populated = await Shift.findById(shift._id).populate(
      'user',
      'name username'
    );

    res.json({
      success: true,
      message: 'แก้ไขข้อมูลกะสำเร็จ',
      data: populated,
    });
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลกะ',
    });
  }
};

/**
 * Get shift report (Admin only)
 * GET /api/shifts/report
 */
const getReport = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุช่วงวันที่',
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filter = {
      date: { $gte: start, $lte: end },
      status: 'closed',
    };

    if (userId) {
      filter.user = userId;
    }

    const shifts = await Shift.find(filter)
      .populate('user', 'name username')
      .sort({ date: -1 });

    // Calculate totals
    const totals = shifts.reduce(
      (acc, shift) => {
        acc.totalSales += shift.summary?.totalSales || 0;
        acc.cashSales += shift.summary?.cashSales || 0;
        acc.promptpaySales += shift.summary?.promptpaySales || 0;
        acc.transferSales += shift.summary?.transferSales || 0;
        acc.totalExpenses += shift.summary?.totalExpenses || 0;
        acc.cashDifference += shift.closingCash?.difference || 0;
        acc.nonCashDifference += shift.closingNonCash?.difference || 0;
        return acc;
      },
      {
        totalSales: 0,
        cashSales: 0,
        promptpaySales: 0,
        transferSales: 0,
        totalExpenses: 0,
        cashDifference: 0,
        nonCashDifference: 0,
      }
    );

    res.json({
      success: true,
      data: shifts,
      summary: {
        shiftCount: shifts.length,
        ...totals,
      },
    });
  } catch (error) {
    console.error('Error getting shift report:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างรายงาน',
    });
  }
};

/**
 * Helper function to calculate shift summary from sales
 */
function calculateShiftSummary(sales, expenses) {
  const summary = {
    totalSales: 0,
    cashSales: 0,
    promptpaySales: 0,
    transferSales: 0,
    totalExpenses: 0,
    totalChangeGiven: 0,
  };

  sales.forEach((sale) => {
    summary.totalSales += sale.total;

    switch (sale.paymentMethod) {
      case 'cash':
        summary.cashSales += sale.total;
        summary.totalChangeGiven += sale.changeAmount || 0;
        break;
      case 'promptpay':
        summary.promptpaySales += sale.total;
        break;
      case 'transfer':
        summary.transferSales += sale.total;
        break;
      // credit_card is also non-cash but we can add it if needed
    }
  });

  summary.totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return summary;
}

module.exports = {
  getAll,
  getCurrent,
  getById,
  openShift,
  addExpense,
  removeExpense,
  closeShift,
  getSummary,
  update,
  getReport,
};
