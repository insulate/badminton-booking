const Attendance = require('../models/attendance.model');

/**
 * Get all attendance records (Admin only)
 * GET /api/attendance
 */
const getAll = async (req, res) => {
  try {
    const { startDate, endDate, userId, page = 1, limit = 20 } = req.query;

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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [attendances, total] = await Promise.all([
      Attendance.find(filter)
        .populate('user', 'name username')
        .populate('clockIn.editedBy', 'name')
        .populate('clockOut.editedBy', 'name')
        .sort({ date: -1, 'clockIn.time': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: attendances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการลงเวลา',
    });
  }
};

/**
 * Get my attendance history
 * GET /api/attendance/my
 */
const getMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = { user: req.user._id };

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

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [attendances, total] = await Promise.all([
      Attendance.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: attendances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting my attendance:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการลงเวลา',
    });
  }
};

/**
 * Get today's attendance status
 * GET /api/attendance/today
 */
const getToday = async (req, res) => {
  try {
    const today = Attendance.getToday();
    const attendance = await Attendance.findByUserAndDate(req.user._id, today);

    res.json({
      success: true,
      data: attendance,
      status: attendance
        ? attendance.clockOut?.time
          ? 'clocked_out'
          : 'clocked_in'
        : 'not_clocked_in',
    });
  } catch (error) {
    console.error('Error getting today attendance:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการลงเวลาวันนี้',
    });
  }
};

/**
 * Clock in
 * POST /api/attendance/clock-in
 */
const clockIn = async (req, res) => {
  try {
    const { note } = req.body;
    const today = Attendance.getToday();

    // Check if already clocked in today
    const existing = await Attendance.findByUserAndDate(req.user._id, today);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้ลงเวลาเข้างานวันนี้แล้ว',
      });
    }

    const attendance = new Attendance({
      user: req.user._id,
      date: today,
      clockIn: {
        time: new Date(),
        method: 'system',
        note: note || '',
      },
    });

    await attendance.save();

    const populated = await Attendance.findById(attendance._id).populate(
      'user',
      'name username'
    );

    res.status(201).json({
      success: true,
      message: 'ลงเวลาเข้างานสำเร็จ',
      data: populated,
    });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลงเวลาเข้างาน',
    });
  }
};

/**
 * Clock out
 * POST /api/attendance/clock-out
 */
const clockOut = async (req, res) => {
  try {
    const { note } = req.body;
    const today = Attendance.getToday();

    // Check if clocked in today
    const attendance = await Attendance.findByUserAndDate(req.user._id, today);
    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'คุณยังไม่ได้ลงเวลาเข้างานวันนี้',
      });
    }

    // Check if already clocked out
    if (attendance.clockOut?.time) {
      return res.status(400).json({
        success: false,
        message: 'คุณได้ลงเวลาออกงานวันนี้แล้ว',
      });
    }

    attendance.clockOut = {
      time: new Date(),
      method: 'system',
      note: note || '',
    };

    await attendance.save();

    const populated = await Attendance.findById(attendance._id).populate(
      'user',
      'name username'
    );

    res.json({
      success: true,
      message: 'ลงเวลาออกงานสำเร็จ',
      data: populated,
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลงเวลาออกงาน',
    });
  }
};

/**
 * Admin update attendance
 * PUT /api/attendance/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { clockInTime, clockInNote, clockOutTime, clockOutNote } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการลงเวลา',
      });
    }

    // Update clock in
    if (clockInTime !== undefined) {
      attendance.clockIn = {
        time: clockInTime ? new Date(clockInTime) : null,
        method: 'manual',
        note: clockInNote || attendance.clockIn?.note || '',
        editedBy: req.user._id,
        editedAt: new Date(),
      };
    }

    // Update clock out
    if (clockOutTime !== undefined) {
      attendance.clockOut = {
        time: clockOutTime ? new Date(clockOutTime) : null,
        method: 'manual',
        note: clockOutNote || attendance.clockOut?.note || '',
        editedBy: req.user._id,
        editedAt: new Date(),
      };
    }

    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate('user', 'name username')
      .populate('clockIn.editedBy', 'name')
      .populate('clockOut.editedBy', 'name');

    res.json({
      success: true,
      message: 'แก้ไขข้อมูลการลงเวลาสำเร็จ',
      data: populated,
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลการลงเวลา',
    });
  }
};

/**
 * Get attendance report (Admin only)
 * GET /api/attendance/report
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
    };

    if (userId) {
      filter.user = userId;
    }

    const attendances = await Attendance.find(filter)
      .populate('user', 'name username')
      .sort({ date: -1 });

    // Calculate summary
    const summary = {
      totalDays: attendances.length,
      totalHours: attendances.reduce((sum, a) => sum + (a.totalHours || 0), 0),
      averageHours:
        attendances.length > 0
          ? attendances.reduce((sum, a) => sum + (a.totalHours || 0), 0) /
            attendances.length
          : 0,
    };

    res.json({
      success: true,
      data: attendances,
      summary,
    });
  } catch (error) {
    console.error('Error getting attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างรายงาน',
    });
  }
};

module.exports = {
  getAll,
  getMyAttendance,
  getToday,
  clockIn,
  clockOut,
  update,
  getReport,
};
