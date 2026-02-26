const express = require('express');
const router = express.Router();
const Booking = require('../models/booking.model');
const Sale = require('../models/sale.model');
const GroupPlay = require('../models/groupplay.model');
const Court = require('../models/court.model');
const Player = require('../models/player.model');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

/**
 * @route   GET /api/reports/revenue/daily
 * @desc    Get daily revenue report
 * @access  Private
 * @query   date (YYYY-MM-DD) - required
 */
router.get('/revenue/daily', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุวันที่ (date parameter)',
      });
    }

    // Parse date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get bookings revenue
    const bookingsRevenue = await Booking.aggregate([
      {
        $match: {
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          paymentStatus: { $in: ['paid', 'partial'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.deposit' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get sales revenue
    const salesRevenue = await Sale.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get group play revenue
    const groupPlayRevenue = await GroupPlay.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
      {
        $unwind: '$players',
      },
      {
        $match: {
          'players.paymentStatus': 'paid',
          'players.checkedOut': true,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$players.totalCost' },
          count: { $sum: 1 },
        },
      },
    ]);

    const bookings = bookingsRevenue[0] || { totalRevenue: 0, count: 0 };
    const sales = salesRevenue[0] || { totalRevenue: 0, count: 0 };
    const groupPlay = groupPlayRevenue[0] || { totalRevenue: 0, count: 0 };

    const totalRevenue = bookings.totalRevenue + sales.totalRevenue + groupPlay.totalRevenue;

    res.json({
      success: true,
      data: {
        date,
        totalRevenue,
        breakdown: {
          bookings: {
            revenue: bookings.totalRevenue,
            count: bookings.count,
          },
          sales: {
            revenue: sales.totalRevenue,
            count: sales.count,
          },
          groupPlay: {
            revenue: groupPlay.totalRevenue,
            count: groupPlay.count,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching daily revenue:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรายงานรายได้รายวัน',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reports/revenue/monthly
 * @desc    Get monthly revenue report
 * @access  Private
 * @query   month (YYYY-MM) - required
 */
router.get('/revenue/monthly', async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเดือน (month parameter YYYY-MM)',
      });
    }

    // Parse month
    const [year, monthNum] = month.split('-').map(Number);
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Get daily breakdown
    const bookingsByDay = await Booking.aggregate([
      {
        $match: {
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
          paymentStatus: { $in: ['paid', 'partial'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          revenue: { $sum: '$pricing.deposit' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const salesByDay = await Sale.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const groupPlayByDay = await GroupPlay.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $unwind: '$players',
      },
      {
        $match: {
          'players.paymentStatus': 'paid',
          'players.checkedOut': true,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$players.totalCost' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Merge all data by date
    const dateMap = new Map();

    bookingsByDay.forEach((item) => {
      if (!dateMap.has(item._id)) {
        dateMap.set(item._id, {
          date: item._id,
          bookings: 0,
          sales: 0,
          groupPlay: 0,
          total: 0,
        });
      }
      const data = dateMap.get(item._id);
      data.bookings = item.revenue;
      data.total += item.revenue;
    });

    salesByDay.forEach((item) => {
      if (!dateMap.has(item._id)) {
        dateMap.set(item._id, {
          date: item._id,
          bookings: 0,
          sales: 0,
          groupPlay: 0,
          total: 0,
        });
      }
      const data = dateMap.get(item._id);
      data.sales = item.revenue;
      data.total += item.revenue;
    });

    groupPlayByDay.forEach((item) => {
      if (!dateMap.has(item._id)) {
        dateMap.set(item._id, {
          date: item._id,
          bookings: 0,
          sales: 0,
          groupPlay: 0,
          total: 0,
        });
      }
      const data = dateMap.get(item._id);
      data.groupPlay = item.revenue;
      data.total += item.revenue;
    });

    const dailyData = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const totalRevenue = dailyData.reduce((sum, day) => sum + day.total, 0);

    res.json({
      success: true,
      data: {
        month,
        totalRevenue,
        dailyData,
      },
    });
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรายงานรายได้รายเดือน',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reports/revenue/yearly
 * @desc    Get yearly revenue report
 * @access  Private
 * @query   year (YYYY) - required
 */
router.get('/revenue/yearly', async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุปี (year parameter YYYY)',
      });
    }

    const startOfYear = new Date(parseInt(year), 0, 1);
    const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);

    // Get monthly breakdown
    const bookingsByMonth = await Booking.aggregate([
      {
        $match: {
          date: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
          paymentStatus: { $in: ['paid', 'partial'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          revenue: { $sum: '$pricing.deposit' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const salesByMonth = await Sale.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const groupPlayByMonth = await GroupPlay.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
        },
      },
      {
        $unwind: '$players',
      },
      {
        $match: {
          'players.paymentStatus': 'paid',
          'players.checkedOut': true,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$players.totalCost' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Merge all data by month
    const monthMap = new Map();

    bookingsByMonth.forEach((item) => {
      if (!monthMap.has(item._id)) {
        monthMap.set(item._id, {
          month: item._id,
          bookings: 0,
          sales: 0,
          groupPlay: 0,
          total: 0,
        });
      }
      const data = monthMap.get(item._id);
      data.bookings = item.revenue;
      data.total += item.revenue;
    });

    salesByMonth.forEach((item) => {
      if (!monthMap.has(item._id)) {
        monthMap.set(item._id, {
          month: item._id,
          bookings: 0,
          sales: 0,
          groupPlay: 0,
          total: 0,
        });
      }
      const data = monthMap.get(item._id);
      data.sales = item.revenue;
      data.total += item.revenue;
    });

    groupPlayByMonth.forEach((item) => {
      if (!monthMap.has(item._id)) {
        monthMap.set(item._id, {
          month: item._id,
          bookings: 0,
          sales: 0,
          groupPlay: 0,
          total: 0,
        });
      }
      const data = monthMap.get(item._id);
      data.groupPlay = item.revenue;
      data.total += item.revenue;
    });

    const monthlyData = Array.from(monthMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    const totalRevenue = monthlyData.reduce((sum, month) => sum + month.total, 0);

    res.json({
      success: true,
      data: {
        year,
        totalRevenue,
        monthlyData,
      },
    });
  } catch (error) {
    console.error('Error fetching yearly revenue:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรายงานรายได้รายปี',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reports/bookings/summary
 * @desc    Get bookings summary report
 * @access  Private
 * @query   startDate, endDate (optional)
 */
router.get('/bookings/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchCondition = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      matchCondition.date = {
        $gte: start,
        $lte: end,
      };
    }

    // Get bookings by status
    const byStatus = await Booking.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', ['paid', 'partial']] },
                '$pricing.deposit',
                0,
              ],
            },
          },
        },
      },
    ]);

    // Get bookings by court
    const byCourt = await Booking.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: 'courts',
          localField: 'court',
          foreignField: '_id',
          as: 'courtInfo',
        },
      },
      {
        $unwind: '$courtInfo',
      },
      {
        $group: {
          _id: '$court',
          courtName: { $first: '$courtInfo.name' },
          count: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', ['paid', 'partial']] },
                '$pricing.deposit',
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get bookings by payment status
    const byPaymentStatus = await Booking.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.total' },
          totalPaid: { $sum: '$pricing.deposit' },
        },
      },
    ]);

    // Get total statistics
    const totalStats = await Booking.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', ['paid', 'partial']] },
                '$pricing.deposit',
                0,
              ],
            },
          },
          averageBookingValue: { $avg: '$pricing.total' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        period: {
          startDate: startDate || 'all',
          endDate: endDate || 'all',
        },
        summary: totalStats[0] || {
          totalBookings: 0,
          totalRevenue: 0,
          averageBookingValue: 0,
        },
        byStatus,
        byCourt,
        byPaymentStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching bookings summary:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสรุปการจอง',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reports/products/sales
 * @desc    Get products sales report
 * @access  Private
 * @query   startDate, endDate, limit (optional)
 */
router.get('/products/sales', async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;

    const matchCondition = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      matchCondition.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    // Get product sales from POS
    const posSales = await Sale.aggregate([
      { $match: matchCondition },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $unwind: '$productInfo',
      },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$productInfo.name' },
          sku: { $first: '$productInfo.sku' },
          category: { $first: '$productInfo.category' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          averagePrice: { $avg: '$items.price' },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    // Get product sales from Group Play games
    const groupPlaySales = await GroupPlay.aggregate([
      {
        $match: matchCondition.createdAt
          ? { createdAt: matchCondition.createdAt }
          : {},
      },
      { $unwind: '$players' },
      { $unwind: '$players.games' },
      { $unwind: '$players.games.items' },
      {
        $lookup: {
          from: 'products',
          localField: 'players.games.items.product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $unwind: '$productInfo',
      },
      {
        $group: {
          _id: '$players.games.items.product',
          productName: { $first: '$productInfo.name' },
          sku: { $first: '$productInfo.sku' },
          category: { $first: '$productInfo.category' },
          totalQuantity: { $sum: '$players.games.items.quantity' },
          totalRevenue: {
            $sum: {
              $multiply: ['$players.games.items.quantity', '$players.games.items.price'],
            },
          },
          averagePrice: { $avg: '$players.games.items.price' },
        },
      },
    ]);

    // Get standalone items from Group Play
    const standaloneSales = await GroupPlay.aggregate([
      {
        $match: matchCondition.createdAt
          ? { createdAt: matchCondition.createdAt }
          : {},
      },
      { $unwind: '$players' },
      { $unwind: '$players.standaloneItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'players.standaloneItems.product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $unwind: '$productInfo',
      },
      {
        $group: {
          _id: '$players.standaloneItems.product',
          productName: { $first: '$productInfo.name' },
          sku: { $first: '$productInfo.sku' },
          category: { $first: '$productInfo.category' },
          totalQuantity: { $sum: '$players.standaloneItems.quantity' },
          totalRevenue: {
            $sum: {
              $multiply: [
                '$players.standaloneItems.quantity',
                '$players.standaloneItems.price',
              ],
            },
          },
          averagePrice: { $avg: '$players.standaloneItems.price' },
        },
      },
    ]);

    // Merge all product sales
    const productMap = new Map();

    [...posSales, ...groupPlaySales, ...standaloneSales].forEach((item) => {
      const key = item._id.toString();
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: item._id,
          productName: item.productName,
          sku: item.sku,
          category: item.category,
          totalQuantity: 0,
          totalRevenue: 0,
          averagePrice: 0,
        });
      }
      const product = productMap.get(key);
      product.totalQuantity += item.totalQuantity;
      product.totalRevenue += item.totalRevenue;
      product.averagePrice = product.totalRevenue / product.totalQuantity;
    });

    let productSales = Array.from(productMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    if (limit) {
      productSales = productSales.slice(0, parseInt(limit));
    }

    const totalRevenue = productSales.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalQuantity = productSales.reduce((sum, p) => sum + p.totalQuantity, 0);

    res.json({
      success: true,
      data: {
        period: {
          startDate: startDate || 'all',
          endDate: endDate || 'all',
        },
        summary: {
          totalProducts: productSales.length,
          totalQuantity,
          totalRevenue,
        },
        products: productSales,
      },
    });
  } catch (error) {
    console.error('Error fetching products sales:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรายงานยอดขายสินค้า',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reports/courts/usage
 * @desc    Get courts usage report
 * @access  Private
 * @query   startDate, endDate (optional)
 */
router.get('/courts/usage', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchCondition = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      matchCondition.date = {
        $gte: start,
        $lte: end,
      };
    }

    // Get court usage from bookings
    const courtUsage = await Booking.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: 'courts',
          localField: 'court',
          foreignField: '_id',
          as: 'courtInfo',
        },
      },
      {
        $unwind: '$courtInfo',
      },
      {
        $group: {
          _id: '$court',
          courtName: { $first: '$courtInfo.name' },
          totalBookings: { $sum: 1 },
          totalHours: { $sum: '$duration' },
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ['$paymentStatus', ['paid', 'partial']] },
                '$pricing.deposit',
                0,
              ],
            },
          },
          confirmedBookings: {
            $sum: {
              $cond: [{ $eq: ['$bookingStatus', 'confirmed'] }, 1, 0],
            },
          },
          completedBookings: {
            $sum: {
              $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0],
            },
          },
          cancelledBookings: {
            $sum: {
              $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          courtName: 1,
          totalBookings: 1,
          totalHours: 1,
          totalRevenue: 1,
          confirmedBookings: 1,
          completedBookings: 1,
          cancelledBookings: 1,
          utilizationRate: {
            $cond: [
              { $gt: ['$totalBookings', 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ['$confirmedBookings', '$completedBookings'] },
                      '$totalBookings',
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    // Get all courts to include ones with no bookings
    const allCourts = await Court.find({ status: 'active' }).select('name');

    // Merge with all courts
    const courtMap = new Map(
      allCourts.map((court) => [
        court._id.toString(),
        {
          courtId: court._id,
          courtName: court.name,
          totalBookings: 0,
          totalHours: 0,
          totalRevenue: 0,
          confirmedBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          utilizationRate: 0,
        },
      ])
    );

    courtUsage.forEach((usage) => {
      courtMap.set(usage._id.toString(), {
        courtId: usage._id,
        courtName: usage.courtName,
        totalBookings: usage.totalBookings,
        totalHours: usage.totalHours,
        totalRevenue: usage.totalRevenue,
        confirmedBookings: usage.confirmedBookings,
        completedBookings: usage.completedBookings,
        cancelledBookings: usage.cancelledBookings,
        utilizationRate: Math.round(usage.utilizationRate * 10) / 10, // Round to 1 decimal
      });
    });

    const courtsData = Array.from(courtMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    const totalBookings = courtsData.reduce((sum, c) => sum + c.totalBookings, 0);
    const totalHours = courtsData.reduce((sum, c) => sum + c.totalHours, 0);
    const totalRevenue = courtsData.reduce((sum, c) => sum + c.totalRevenue, 0);

    res.json({
      success: true,
      data: {
        period: {
          startDate: startDate || 'all',
          endDate: endDate || 'all',
        },
        summary: {
          totalCourts: courtsData.length,
          totalBookings,
          totalHours,
          totalRevenue,
        },
        courts: courtsData,
      },
    });
  } catch (error) {
    console.error('Error fetching courts usage:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรายงานการใช้งานสนาม',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/reports/dashboard
 * @desc    Get all dashboard summary data in one call
 * @access  Private
 */
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();

    // Today range
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Yesterday range (for trends)
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    // This month range
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Last month range (for trends)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Week range (last 7 days)
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    // --- Stats ---
    const totalPlayers = await Player.countDocuments({ isDeleted: false });

    const todayBookingsCount = await Booking.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
      deletedAt: null,
      bookingStatus: { $ne: 'cancelled' },
    });

    const yesterdayBookingsCount = await Booking.countDocuments({
      date: { $gte: yesterdayStart, $lte: yesterdayEnd },
      deletedAt: null,
      bookingStatus: { $ne: 'cancelled' },
    });

    // Helper: aggregate revenue for a date range
    const getRevenue = async (start, end) => {
      const [bookings] = await Booking.aggregate([
        { $match: { date: { $gte: start, $lte: end }, paymentStatus: { $in: ['paid', 'partial'] } } },
        { $group: { _id: null, total: { $sum: '$pricing.deposit' } } },
      ]);
      const [sales] = await Sale.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]);
      const [gp] = await GroupPlay.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$players' },
        { $match: { 'players.paymentStatus': 'paid', 'players.checkedOut': true } },
        { $group: { _id: null, total: { $sum: '$players.totalCost' } } },
      ]);
      return (bookings?.total || 0) + (sales?.total || 0) + (gp?.total || 0);
    };

    const todayRevenue = await getRevenue(todayStart, todayEnd);
    const yesterdayRevenue = await getRevenue(yesterdayStart, yesterdayEnd);
    const monthlyRevenue = await getRevenue(monthStart, monthEnd);
    const lastMonthRevenue = await getRevenue(lastMonthStart, lastMonthEnd);

    // Calculate trend %
    const calcTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    // --- Recent Activities (last 5 bookings + sales merged) ---
    const recentBookings = await Booking.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('court', 'name')
      .lean();

    const recentSales = await Sale.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const activities = [
      ...recentBookings.map(b => ({
        type: 'booking',
        name: b.customer?.nickname || b.customer?.name || 'ลูกค้า',
        action: `จองสนาม ${b.court?.name || '-'}`,
        status: b.bookingStatus,
        time: b.createdAt,
      })),
      ...recentSales.map(s => ({
        type: 'sale',
        name: s.customer?.name || 'ลูกค้า',
        action: `ซื้อสินค้า ฿${(s.total || 0).toLocaleString()}`,
        status: s.paymentStatus === 'paid' ? 'paid' : 'pending',
        time: s.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5);

    // --- Courts Usage (this week, top 4) ---
    const courtsUsageAgg = await Booking.aggregate([
      {
        $match: {
          date: { $gte: weekStart, $lte: todayEnd },
          deletedAt: null,
          bookingStatus: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: '$court',
          bookings: { $sum: 1 },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 4 },
      {
        $lookup: {
          from: 'courts',
          localField: '_id',
          foreignField: '_id',
          as: 'courtInfo',
        },
      },
      { $unwind: { path: '$courtInfo', preserveNullAndEmptyArrays: true } },
    ]);

    const maxBookings = courtsUsageAgg[0]?.bookings || 1;
    const courtsUsage = courtsUsageAgg.map(c => ({
      name: c.courtInfo?.name || 'ไม่ทราบ',
      bookings: c.bookings,
      percentage: Math.round((c.bookings / maxBookings) * 100),
    }));

    // --- Weekly Bookings (last 7 days) ---
    const dayLabels = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const weeklyBookings = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await Booking.countDocuments({
        date: { $gte: dayStart, $lte: dayEnd },
        deletedAt: null,
        bookingStatus: { $ne: 'cancelled' },
      });

      const revenue = await getRevenue(dayStart, dayEnd);

      weeklyBookings.push({
        date: dayStart.toISOString().split('T')[0],
        day: dayLabels[dayStart.getDay()],
        count,
        revenue,
      });
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalPlayers,
          todayBookings: todayBookingsCount,
          todayRevenue,
          monthlyRevenue,
        },
        trends: {
          bookings: calcTrend(todayBookingsCount, yesterdayBookingsCount),
          todayRevenue: calcTrend(todayRevenue, yesterdayRevenue),
          monthlyRevenue: calcTrend(monthlyRevenue, lastMonthRevenue),
        },
        recentActivities: activities,
        courtsUsage,
        weeklyBookings,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard',
      error: error.message,
    });
  }
});

module.exports = router;
