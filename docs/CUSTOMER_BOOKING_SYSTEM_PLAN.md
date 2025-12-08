# Customer Booking System - Implementation Plan

## Overview

ระบบจองสนามสำหรับลูกค้า (Customer/Player) ที่สามารถ:
- ดูจำนวนสนามว่างต่อ time slot (ไม่บอกชื่อสนาม)
- สมัครสมาชิก / เข้าสู่ระบบ
- จองสนามโดยเลือก วัน + เวลา + duration
- ดูประวัติการจอง
- Admin กำหนดสนามให้ภายหลัง

---

## สรุปความต้องการ

| หัวข้อ | รายละเอียด |
|--------|------------|
| **UI หน้า Booking** | แสดง TimeSlot + จำนวนสนามว่าง + ราคา (ไม่บอกชื่อสนาม) |
| **Authentication** | Player login ด้วยเบอร์โทร + รหัสผ่าน |
| **Registration** | Player สมัครเองได้ |
| **Duration** | เลือกได้ 1-8 ชั่วโมง (ปุ่มกด) |
| **ราคา** | `pricing.normal` / ถ้า member ใช้ `pricing.member` |
| **Player member** | เพิ่ม field `isMember` ใน Player model |
| **Booking** | สร้างโดยไม่ระบุสนาม (court = null) |
| **Admin assign สนาม** | Dropdown ในตาราง Bookings |
| **ประวัติการจอง** | มีหน้าดูประวัติสำหรับ Player |
| **ยกเลิก booking** | ลูกค้าโทรหาสนาม |
| **Login routes** | Admin: `/admin/login`, Customer: `/login` |
| **Token storage** | แยก key: `playerToken` / `token` |
| **เบอร์โทร format** | รับทั้ง `0812345678` และ `081-234-5678` แล้ว normalize |

---

## Files to Modify/Create

### Backend (7 ไฟล์)

| # | ไฟล์ | ประเภท | รายละเอียด |
|---|------|--------|------------|
| 1 | `backend/models/player.model.js` | แก้ไข | เพิ่ม field `isMember: Boolean` |
| 2 | `backend/models/booking.model.js` | แก้ไข | เปลี่ยน `court` เป็น optional, เพิ่ม `player`, `bookingSource` |
| 3 | `backend/middleware/auth.js` | แก้ไข | เพิ่ม `protectPlayer` middleware |
| 4 | `backend/controllers/auth.controller.js` | แก้ไข | เพิ่ม `playerLogin`, `playerRegister`, `getPlayerMe` |
| 5 | `backend/routes/auth.routes.js` | แก้ไข | เพิ่ม player auth routes |
| 6 | `backend/utils/availabilityChecker.js` | แก้ไข | เพิ่ม `getAvailabilityByTimeSlot()` |
| 7 | `backend/routes/bookings.routes.js` | แก้ไข | เพิ่ม public availability, customer booking, assign court routes |

### Frontend (14 ไฟล์)

| # | ไฟล์ | ประเภท | รายละเอียด |
|---|------|--------|------------|
| 1 | `frontend/src/constants/api.js` | แก้ไข | เพิ่ม player auth & customer booking endpoints |
| 2 | `frontend/src/constants/routes.js` | แก้ไข | เพิ่ม customer routes, ย้าย admin login |
| 3 | `frontend/src/lib/api.js` | แก้ไข | เพิ่ม `playerAuthAPI`, `customerBookingsAPI` |
| 4 | `frontend/src/store/playerAuthStore.js` | สร้างใหม่ | Zustand store สำหรับ Player |
| 5 | `frontend/src/pages/customer/CustomerLoginPage.jsx` | สร้างใหม่ | หน้า login สำหรับ Player |
| 6 | `frontend/src/pages/customer/CustomerRegisterPage.jsx` | สร้างใหม่ | หน้าสมัครสมาชิก |
| 7 | `frontend/src/pages/customer/MyBookingsPage.jsx` | สร้างใหม่ | หน้าดูประวัติการจอง |
| 8 | `frontend/src/pages/customer/CustomerBookingPage.jsx` | แก้ไข | UI ใหม่แสดงจำนวนสนามว่าง |
| 9 | `frontend/src/components/customer/CustomerProtectedRoute.jsx` | สร้างใหม่ | Protected route สำหรับ Player |
| 10 | `frontend/src/components/customer/BookingConfirmModal.jsx` | สร้างใหม่ | Modal ยืนยันการจอง |
| 11 | `frontend/src/components/customer/BookingSuccessModal.jsx` | สร้างใหม่ | Modal แสดงผลสำเร็จ + booking code |
| 12 | `frontend/src/components/customer/CustomerLayout.jsx` | แก้ไข | อัปเดต header แสดง login status |
| 13 | `frontend/src/components/booking/BookingsTable.jsx` | แก้ไข | เพิ่ม dropdown assign สนาม |
| 14 | `frontend/src/App.jsx` | แก้ไข | อัปเดต routes ทั้งหมด |

---

## Database Schema Changes

### 1. Player Model (`backend/models/player.model.js`)

เพิ่ม field ใหม่:

```javascript
isMember: {
  type: Boolean,
  default: false,
},
```

### 2. Booking Model (`backend/models/booking.model.js`)

#### แก้ไข court field (ลบ required):

```javascript
court: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Court',
  default: null,  // ลบ required ออก
},
```

#### เพิ่ม fields ใหม่:

```javascript
player: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Player',
  default: null,
},
bookingSource: {
  type: String,
  enum: {
    values: ['admin', 'customer'],
    message: '{VALUE} is not a valid booking source',
  },
  default: 'admin',
},
```

---

## API Endpoints

### 1. Player Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/player/register` | Public | สมัครสมาชิก Player |
| POST | `/api/auth/player/login` | Public | เข้าสู่ระบบ Player |
| GET | `/api/auth/player/me` | Protected (Player) | ดึงข้อมูล Player ที่ login |

### 2. Public Availability

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/bookings/public/availability?date=YYYY-MM-DD` | Public | ดูจำนวนสนามว่างต่อ time slot |

### 3. Customer Booking

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/bookings/customer` | Protected (Player) | สร้าง booking (ไม่ระบุสนาม) |
| GET | `/api/bookings/customer/my-bookings` | Protected (Player) | ดูประวัติการจองของตัวเอง |

### 4. Admin Assign Court

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| PATCH | `/api/bookings/:id/assign-court` | Protected (Admin) | กำหนดสนามให้ booking |

---

## Implementation Details

### Phase 1: Backend - Player Model

#### File: `backend/models/player.model.js`

เพิ่ม field `isMember` หลัง `status`:

```javascript
isMember: {
  type: Boolean,
  default: false,
},
```

---

### Phase 2: Backend - Booking Model

#### File: `backend/models/booking.model.js`

**แก้ไข court field:**

```javascript
court: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Court',
  default: null,
  // ลบ required ออก
},
```

**เพิ่ม fields ใหม่ (หลัง court):**

```javascript
player: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Player',
  default: null,
},
bookingSource: {
  type: String,
  enum: {
    values: ['admin', 'customer'],
    message: '{VALUE} is not a valid booking source',
  },
  default: 'admin',
},
```

---

### Phase 3: Backend - Player Auth Middleware

#### File: `backend/middleware/auth.js`

เพิ่ม `protectPlayer` middleware:

```javascript
const Player = require('../models/player.model');

// Protect routes for Players - verify JWT token
const protectPlayer = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get player from token (exclude password)
      req.player = await Player.findById(decoded.id).select('-password');

      if (!req.player) {
        return res.status(401).json({
          success: false,
          message: 'Player not found'
        });
      }

      if (req.player.isDeleted) {
        return res.status(401).json({
          success: false,
          message: 'Player account has been deleted'
        });
      }

      if (req.player.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Player account is inactive'
        });
      }

      next();
    } catch (error) {
      console.error('Player auth middleware error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

module.exports = { protect, admin, protectPlayer };
```

---

### Phase 4: Backend - Player Auth Controller

#### File: `backend/controllers/auth.controller.js`

เพิ่ม functions:

```javascript
const Player = require('../models/player.model');

// Helper: Normalize phone number (remove dashes)
const normalizePhone = (phone) => {
  return phone.replace(/-/g, '');
};

// @desc    Register player
// @route   POST /api/auth/player/register
// @access  Public
const playerRegister = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Validate input
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อ เบอร์โทร และรหัสผ่าน'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // Check if player already exists
    const existingPlayer = await Player.findOne({ phone: normalizedPhone });
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        message: 'เบอร์โทรนี้ถูกใช้งานแล้ว'
      });
    }

    // Create player
    const player = await Player.create({
      name,
      phone: normalizedPhone,
      password
    });

    // Generate token
    const token = generateToken(player._id);

    res.status(201).json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      data: {
        _id: player._id,
        name: player.name,
        phone: player.phone,
        isMember: player.isMember,
        token
      }
    });
  } catch (error) {
    console.error('Player register error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
    });
  }
};

// @desc    Login player
// @route   POST /api/auth/player/login
// @access  Public
const playerLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกเบอร์โทรและรหัสผ่าน'
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // Check for player (include password for comparison)
    const player = await Player.findOne({ 
      phone: normalizedPhone,
      isDeleted: false 
    }).select('+password');

    if (!player) {
      return res.status(401).json({
        success: false,
        message: 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    if (player.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'บัญชีถูกระงับการใช้งาน'
      });
    }

    if (!player.password) {
      return res.status(401).json({
        success: false,
        message: 'บัญชีนี้ยังไม่ได้ตั้งรหัสผ่าน กรุณาติดต่อเจ้าหน้าที่'
      });
    }

    // Check password
    const isPasswordMatch = await player.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: player._id,
        name: player.name,
        phone: player.phone,
        isMember: player.isMember,
        token: generateToken(player._id)
      }
    });
  } catch (error) {
    console.error('Player login error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    });
  }
};

// @desc    Get current logged in player
// @route   GET /api/auth/player/me
// @access  Private (Player)
const getPlayerMe = async (req, res) => {
  try {
    const player = await Player.findById(req.player._id);

    res.status(200).json({
      success: true,
      data: player
    });
  } catch (error) {
    console.error('Get player me error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    });
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
  changePassword,
  playerRegister,
  playerLogin,
  getPlayerMe
};
```

---

### Phase 5: Backend - Player Auth Routes

#### File: `backend/routes/auth.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  updateProfile,
  changePassword,
  playerRegister,
  playerLogin,
  getPlayerMe
} = require('../controllers/auth.controller');
const { protect, protectPlayer } = require('../middleware/auth');
const { authLimiter, strictLimiter } = require('../middleware/rateLimiter');

// Admin/Staff routes
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, strictLimiter, changePassword);

// Player routes
router.post('/player/register', playerRegister);
router.post('/player/login', authLimiter, playerLogin);
router.get('/player/me', protectPlayer, getPlayerMe);

module.exports = router;
```

---

### Phase 6: Backend - Availability Checker

#### File: `backend/utils/availabilityChecker.js`

เพิ่ม function `getAvailabilityByTimeSlot`:

```javascript
/**
 * Get availability count by time slot for a specific date
 * Used for customer booking page (shows count, not court names)
 *
 * @param {Date} date - Date to check
 * @returns {Promise<Array>} Array of time slots with availability count and pricing
 */
const getAvailabilityByTimeSlot = async (date) => {
  try {
    // Normalize date to start of day
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Determine day type
    const dayOfWeek = bookingDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayType = isWeekend ? 'weekend' : 'weekday';
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];

    // Get all active courts
    const courts = await Court.find({
      deletedAt: null,
      status: 'available',
    });

    const totalCourts = courts.length;

    // Get all active timeslots for the day type
    const timeSlots = await TimeSlot.find({
      deletedAt: null,
      status: 'active',
      dayType: dayType,
    }).sort({ startTime: 1 });

    // Get all bookings for this date
    const bookings = await Booking.find({
      date: { $gte: bookingDate, $lte: endOfDay },
      deletedAt: null,
      bookingStatus: { $ne: 'cancelled' },
    });

    // Build availability for each time slot
    const availability = await Promise.all(
      timeSlots.map(async (timeSlot) => {
        let bookedCount = 0;
        let blockedByGroupPlayCount = 0;

        // Count bookings for this time slot
        // Need to consider duration - a booking can span multiple time slots
        const allTimeSlots = timeSlots;
        const timeSlotIndex = allTimeSlots.findIndex(ts => ts._id.equals(timeSlot._id));

        for (const court of courts) {
          // Check if booked
          const isBooked = bookings.some(booking => {
            if (!booking.court || !booking.court.equals(court._id)) return false;
            
            const bookingSlotIndex = allTimeSlots.findIndex(ts => 
              booking.timeSlot && ts._id.equals(booking.timeSlot)
            );
            
            if (bookingSlotIndex === -1) return false;
            
            // Check if current timeSlot falls within booking duration
            return timeSlotIndex >= bookingSlotIndex && 
                   timeSlotIndex < bookingSlotIndex + (booking.duration || 1);
          });

          if (isBooked) {
            bookedCount++;
            continue;
          }

          // Check if blocked by Group Play
          const isBlocked = await GroupPlay.isTimeSlotBlocked(
            court._id,
            dayName,
            timeSlot.startTime
          );

          if (isBlocked) {
            blockedByGroupPlayCount++;
          }
        }

        const availableCount = totalCourts - bookedCount - blockedByGroupPlayCount;

        // Determine pricing based on peak hour
        const pricing = timeSlot.peakHour
          ? timeSlot.peakPricing
          : timeSlot.pricing;

        return {
          timeSlotId: timeSlot._id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          peakHour: timeSlot.peakHour,
          availableCount: Math.max(0, availableCount),
          totalCourts,
          pricing: {
            normal: pricing.normal,
            member: pricing.member,
          },
        };
      })
    );

    return {
      date: bookingDate,
      dayType,
      availability,
    };
  } catch (error) {
    console.error('Error getting availability by time slot:', error);
    throw error;
  }
};

module.exports = {
  checkAvailability,
  getAvailableCourts,
  getCourtSchedule,
  getAvailabilityByTimeSlot,
};
```

---

### Phase 7: Backend - Booking Routes

#### File: `backend/routes/bookings.routes.js`

เพิ่ม routes ใหม่:

```javascript
const { protectPlayer } = require('../middleware/auth');
const { getAvailabilityByTimeSlot } = require('../utils/availabilityChecker');

/**
 * @route   GET /api/bookings/public/availability
 * @desc    Get availability count by time slot (public)
 * @access  Public
 */
router.get('/public/availability', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required',
      });
    }

    const availability = await getAvailabilityByTimeSlot(new Date(date));

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Get public availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get availability',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/bookings/customer
 * @desc    Create booking from customer (no court assigned)
 * @access  Private (Player)
 */
router.post('/customer', protectPlayer, async (req, res) => {
  try {
    const { date, timeSlot, duration } = req.body;
    const player = req.player;

    // Validate input
    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุวันที่และเวลา',
      });
    }

    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // Get time slot details
    const timeSlotDoc = await TimeSlot.findById(timeSlot);
    if (!timeSlotDoc) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบช่วงเวลาที่เลือก',
      });
    }

    // Check availability
    const availability = await getAvailabilityByTimeSlot(bookingDate);
    const slotAvailability = availability.availability.find(
      a => a.timeSlotId.equals(timeSlot)
    );

    if (!slotAvailability || slotAvailability.availableCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'ช่วงเวลานี้ไม่มีสนามว่าง',
      });
    }

    // Calculate price
    const bookingDuration = duration || 1;
    const pricePerHour = player.isMember 
      ? slotAvailability.pricing.member 
      : slotAvailability.pricing.normal;
    const subtotal = pricePerHour * bookingDuration;

    // Generate booking code
    const bookingCode = await generateBookingCode(bookingDate);

    // Create booking without court
    const booking = await Booking.create({
      bookingCode,
      customer: {
        name: player.name,
        phone: player.phone,
      },
      player: player._id,
      court: null, // Admin will assign later
      date: bookingDate,
      timeSlot,
      duration: bookingDuration,
      pricing: {
        subtotal,
        discount: 0,
        deposit: 0,
        total: subtotal,
      },
      bookingStatus: 'confirmed',
      paymentStatus: 'pending',
      bookingSource: 'customer',
    });

    // Populate before sending response
    await booking.populate('timeSlot', 'startTime endTime peakHour');

    res.status(201).json({
      success: true,
      message: 'จองสนามสำเร็จ',
      data: booking,
    });
  } catch (error) {
    console.error('Create customer booking error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการจองสนาม',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/bookings/customer/my-bookings
 * @desc    Get player's booking history
 * @access  Private (Player)
 */
router.get('/customer/my-bookings', protectPlayer, async (req, res) => {
  try {
    const player = req.player;
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      player: player._id,
      deletedAt: null,
    };

    if (status && status !== 'all') {
      query.bookingStatus = status;
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .populate('court', 'courtNumber name')
      .populate('timeSlot', 'startTime endTime peakHour')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถโหลดประวัติการจองได้',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/bookings/:id/assign-court
 * @desc    Assign court to booking (Admin only)
 * @access  Private (Admin)
 */
router.patch('/:id/assign-court', protect, validateObjectId(), async (req, res) => {
  try {
    const { courtId } = req.body;

    if (!courtId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุสนาม',
      });
    }

    // Validate court exists
    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบสนามที่ระบุ',
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking || booking.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบการจอง',
      });
    }

    // Check if court is available for this booking's date/time
    const availability = await checkAvailability({
      courtId,
      date: booking.date,
      timeSlotId: booking.timeSlot,
      duration: booking.duration,
      excludeBookingId: booking._id,
    });

    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: 'สนามนี้ไม่ว่างในช่วงเวลาดังกล่าว',
      });
    }

    // Assign court
    booking.court = courtId;
    await booking.save();

    await booking.populate('court', 'courtNumber name');
    await booking.populate('timeSlot', 'startTime endTime peakHour');

    res.status(200).json({
      success: true,
      message: 'กำหนดสนามสำเร็จ',
      data: booking,
    });
  } catch (error) {
    console.error('Assign court error:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถกำหนดสนามได้',
      error: error.message,
    });
  }
});
```

---

## Frontend Implementation

### Phase 8: Constants - API Endpoints

#### File: `frontend/src/constants/api.js`

เพิ่ม endpoints:

```javascript
// Authentication
AUTH: {
  LOGIN: '/auth/login',
  ME: '/auth/me',
  UPDATE_PROFILE: '/auth/profile',
  CHANGE_PASSWORD: '/auth/password',
  // Player Auth
  PLAYER_REGISTER: '/auth/player/register',
  PLAYER_LOGIN: '/auth/player/login',
  PLAYER_ME: '/auth/player/me',
},

// Bookings Management
BOOKINGS: {
  // ... existing endpoints
  PUBLIC_AVAILABILITY: '/bookings/public/availability',
  CUSTOMER_CREATE: '/bookings/customer',
  CUSTOMER_MY_BOOKINGS: '/bookings/customer/my-bookings',
  ASSIGN_COURT: (id) => `/bookings/${id}/assign-court`,
},
```

---

### Phase 9: Constants - Routes

#### File: `frontend/src/constants/routes.js`

```javascript
export const ROUTES = {
  // Customer Routes (Public)
  CUSTOMER: {
    HOME: '/',
    RULES: '/rules',
    BOOKING: '/booking',
    LOGIN: '/login',
    REGISTER: '/register',
    MY_BOOKINGS: '/my-bookings',
  },

  // Admin Authentication (ย้ายจาก /login)
  LOGIN: '/admin/login',

  // Admin Routes (Protected)
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    // ... existing routes
  },

  ROOT: '/',
};
```

---

### Phase 10: API Library

#### File: `frontend/src/lib/api.js`

เพิ่ม API functions:

```javascript
// Player Authentication API
export const playerAuthAPI = {
  register: async (data) => {
    const response = await api.post(API_ENDPOINTS.AUTH.PLAYER_REGISTER, data);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.AUTH.PLAYER_LOGIN, credentials);
    return response.data;
  },

  getMe: async () => {
    const token = localStorage.getItem('playerToken');
    const response = await api.get(API_ENDPOINTS.AUTH.PLAYER_ME, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};

// Customer Bookings API
export const customerBookingsAPI = {
  getAvailability: async (date) => {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.PUBLIC_AVAILABILITY, {
      params: { date }
    });
    return response.data;
  },

  create: async (data) => {
    const token = localStorage.getItem('playerToken');
    const response = await api.post(API_ENDPOINTS.BOOKINGS.CUSTOMER_CREATE, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getMyBookings: async (params) => {
    const token = localStorage.getItem('playerToken');
    const response = await api.get(API_ENDPOINTS.BOOKINGS.CUSTOMER_MY_BOOKINGS, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};

// Add to bookingsAPI
export const bookingsAPI = {
  // ... existing methods
  
  assignCourt: async (id, courtId) => {
    const response = await api.patch(API_ENDPOINTS.BOOKINGS.ASSIGN_COURT(id), { courtId });
    return response.data;
  },
};
```

---

### Phase 11: Player Auth Store

#### File: `frontend/src/store/playerAuthStore.js` (สร้างใหม่)

```javascript
import { create } from 'zustand';

const usePlayerAuthStore = create((set) => ({
  player: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize auth from localStorage
  initAuth: () => {
    const token = localStorage.getItem('playerToken');
    const playerStr = localStorage.getItem('player');

    if (token && playerStr) {
      try {
        const player = JSON.parse(playerStr);
        set({
          player,
          token,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to parse player data:', error);
        localStorage.removeItem('playerToken');
        localStorage.removeItem('player');
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  // Login
  login: (playerData, token) => {
    localStorage.setItem('playerToken', token);
    localStorage.setItem('player', JSON.stringify(playerData));
    set({
      player: playerData,
      token,
      isAuthenticated: true
    });
  },

  // Logout
  logout: () => {
    localStorage.removeItem('playerToken');
    localStorage.removeItem('player');
    set({
      player: null,
      token: null,
      isAuthenticated: false
    });
  },

  // Update player
  updatePlayer: (playerData) => {
    localStorage.setItem('player', JSON.stringify(playerData));
    set({ player: playerData });
  },
}));

export default usePlayerAuthStore;
```

---

### Phase 12: Customer Login Page

#### File: `frontend/src/pages/customer/CustomerLoginPage.jsx` (สร้างใหม่)

```jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Phone, Lock, LogIn } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { playerAuthAPI } from '../../lib/api';
import usePlayerAuthStore from '../../store/playerAuthStore';
import { ROUTES } from '../../constants';

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = usePlayerAuthStore();
  
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  // Get redirect path from query params
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || ROUTES.CUSTOMER.BOOKING;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await playerAuthAPI.login({
        phone: formData.phone,
        password: formData.password,
      });

      if (response.success) {
        const { token, ...playerData } = response.data;
        login(playerData, token);
        toast.success('เข้าสู่ระบบสำเร็จ');
        navigate(redirectTo);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-blue-900" />
            </div>
            <h1 className="text-2xl font-bold text-white">เข้าสู่ระบบ</h1>
            <p className="text-blue-200 mt-2">เข้าสู่ระบบเพื่อจองสนาม</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                เบอร์โทรศัพท์
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0812345678"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-blue-200">
              ยังไม่มีบัญชี?{' '}
              <Link
                to={`${ROUTES.CUSTOMER.REGISTER}${location.search}`}
                className="text-yellow-400 hover:text-yellow-300 font-medium"
              >
                สมัครสมาชิก
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 13: Customer Register Page

#### File: `frontend/src/pages/customer/CustomerRegisterPage.jsx` (สร้างใหม่)

```jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Phone, Lock, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { playerAuthAPI } from '../../lib/api';
import usePlayerAuthStore from '../../store/playerAuthStore';
import { ROUTES } from '../../constants';

export default function CustomerRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = usePlayerAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  // Get redirect path from query params
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || ROUTES.CUSTOMER.BOOKING;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      const response = await playerAuthAPI.register({
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
      });

      if (response.success) {
        const { token, ...playerData } = response.data;
        login(playerData, token);
        toast.success('สมัครสมาชิกสำเร็จ');
        navigate(redirectTo);
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-blue-900" />
            </div>
            <h1 className="text-2xl font-bold text-white">สมัครสมาชิก</h1>
            <p className="text-blue-200 mt-2">สร้างบัญชีเพื่อจองสนาม</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                ชื่อ-นามสกุล
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ชื่อ นามสกุล"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                เบอร์โทรศัพท์
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0812345678"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="ยืนยันรหัสผ่าน"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-blue-200">
              มีบัญชีอยู่แล้ว?{' '}
              <Link
                to={`${ROUTES.CUSTOMER.LOGIN}${location.search}`}
                className="text-yellow-400 hover:text-yellow-300 font-medium"
              >
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 14: My Bookings Page

#### File: `frontend/src/pages/customer/MyBookingsPage.jsx` (สร้างใหม่)

```jsx
import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Receipt } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customerBookingsAPI } from '../../lib/api';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await customerBookingsAPI.getMyBookings({
        status: filter !== 'all' ? filter : undefined,
      });
      if (response.success) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error('Load bookings error:', error);
      toast.error('ไม่สามารถโหลดประวัติการจองได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH').format(price);
  };

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: { bg: 'bg-blue-500', label: 'ยืนยันแล้ว' },
      'checked-in': { bg: 'bg-purple-500', label: 'เช็คอินแล้ว' },
      completed: { bg: 'bg-green-500', label: 'เสร็จสิ้น' },
      cancelled: { bg: 'bg-red-500', label: 'ยกเลิก' },
    };
    return badges[status] || { bg: 'bg-gray-500', label: status };
  };

  const filters = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'confirmed', label: 'รอใช้บริการ' },
    { value: 'completed', label: 'เสร็จสิ้น' },
    { value: 'cancelled', label: 'ยกเลิก' },
  ];

  return (
    <div className="min-h-full p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">ประวัติการจอง</h1>
        <p className="text-blue-200 text-sm">ดูรายการจองของคุณ</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-yellow-400 text-blue-900'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-blue-300 mx-auto mb-4" />
          <p className="text-blue-200">ไม่พบรายการจอง</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const statusBadge = getStatusBadge(booking.bookingStatus);
            return (
              <div
                key={booking._id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-yellow-400 font-bold">
                    {booking.bookingCode}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusBadge.bg}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-blue-200">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(booking.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200">
                    <Clock className="w-4 h-4" />
                    <span>
                      {booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}
                      {booking.duration > 1 && ` (${booking.duration} ชม.)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {booking.court
                        ? `${booking.court.name || `Court ${booking.court.courtNumber}`}`
                        : 'รอกำหนดสนาม'}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-blue-200 text-sm">ยอดรวม</span>
                  <span className="text-white font-bold">
                    ฿{formatPrice(booking.pricing?.total || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

### Phase 15: Customer Protected Route

#### File: `frontend/src/components/customer/CustomerProtectedRoute.jsx` (สร้างใหม่)

```jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import usePlayerAuthStore from '../../store/playerAuthStore';
import { ROUTES } from '../../constants';

export default function CustomerProtectedRoute() {
  const { isAuthenticated, isLoading } = usePlayerAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login with return path
    return (
      <Navigate
        to={`${ROUTES.CUSTOMER.LOGIN}?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
```

---

### Phase 16: Booking Confirm Modal

#### File: `frontend/src/components/customer/BookingConfirmModal.jsx` (สร้างใหม่)

```jsx
import { X, Calendar, Clock, User, Phone } from 'lucide-react';

export default function BookingConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  bookingData,
  player,
}) {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH').format(price);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-blue-900 rounded-2xl w-full max-w-md p-6 border border-white/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-blue-300 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-white mb-6 text-center">
          ยืนยันการจอง
        </h2>

        {/* Booking Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 text-blue-200">
            <Calendar className="w-5 h-5 text-yellow-400" />
            <span>{formatDate(bookingData.date)}</span>
          </div>
          <div className="flex items-center gap-3 text-blue-200">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span>
              {bookingData.startTime} - {bookingData.endTime} ({bookingData.duration} ชั่วโมง)
            </span>
          </div>
        </div>

        {/* Player Info */}
        <div className="bg-white/10 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-yellow-400 mb-3">ข้อมูลผู้จอง</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white">
              <User className="w-4 h-4 text-blue-300" />
              <span>{player.name}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Phone className="w-4 h-4 text-blue-300" />
              <span>{player.phone}</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="bg-yellow-400/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-200">ราคารวม</span>
            <span className="text-2xl font-bold text-yellow-400">
              ฿{formatPrice(bookingData.totalPrice)}
            </span>
          </div>
          {player.isMember && (
            <p className="text-xs text-green-400 mt-1">* ราคาสมาชิก</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'กำลังจอง...' : 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 17: Booking Success Modal

#### File: `frontend/src/components/customer/BookingSuccessModal.jsx` (สร้างใหม่)

```jsx
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Receipt } from 'lucide-react';
import { ROUTES } from '../../constants';

export default function BookingSuccessModal({ isOpen, booking, onClose }) {
  const navigate = useNavigate();

  if (!isOpen || !booking) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH').format(price);
  };

  const handleViewBookings = () => {
    navigate(ROUTES.CUSTOMER.MY_BOOKINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-blue-900 rounded-2xl w-full max-w-md p-6 border border-white/20 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-2">จองสำเร็จ!</h2>
        <p className="text-blue-200 mb-6">การจองของคุณได้รับการยืนยันแล้ว</p>

        {/* Booking Code */}
        <div className="bg-yellow-400/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-200 mb-1">รหัสการจอง</p>
          <p className="text-3xl font-bold text-yellow-400">{booking.bookingCode}</p>
        </div>

        {/* Details */}
        <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-blue-200">
              <Calendar className="w-5 h-5 text-yellow-400" />
              <span>{formatDate(booking.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-blue-200">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span>
                {booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}
                {booking.duration > 1 && ` (${booking.duration} ชม.)`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-blue-200">
              <Receipt className="w-5 h-5 text-yellow-400" />
              <span>฿{formatPrice(booking.pricing?.total || 0)}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="text-sm text-blue-300 mb-6">
          กรุณาแสดงรหัสการจองเมื่อมาถึงสนาม
        </p>

        {/* Action */}
        <button
          onClick={handleViewBookings}
          className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-lg transition-colors"
        >
          ดูประวัติการจอง
        </button>
      </div>
    </div>
  );
}
```

---

### Phase 18: Customer Booking Page (แก้ไขใหม่)

#### File: `frontend/src/pages/customer/CustomerBookingPage.jsx`

```jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customerBookingsAPI } from '../../lib/api';
import usePlayerAuthStore from '../../store/playerAuthStore';
import BookingConfirmModal from '../../components/customer/BookingConfirmModal';
import BookingSuccessModal from '../../components/customer/BookingSuccessModal';
import { ROUTES } from '../../constants';

export default function CustomerBookingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, player } = usePlayerAuthStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Load availability when date changes
  useEffect(() => {
    loadAvailability();
  }, [selectedDate]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await customerBookingsAPI.getAvailability(dateStr);
      if (response.success) {
        setAvailability(response.data);
      }
    } catch (error) {
      console.error('Load availability error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลสนามว่างได้');
    } finally {
      setLoading(false);
    }
  };

  // Navigate dates
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate >= today) {
      setSelectedDate(newDate);
      setSelectedSlot(null);
    }
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);
    if (newDate <= maxDate) {
      setSelectedDate(newDate);
      setSelectedSlot(null);
    }
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Calculate price
  const calculatePrice = useMemo(() => {
    if (!selectedSlot) return 0;
    const pricePerHour = player?.isMember
      ? selectedSlot.pricing.member
      : selectedSlot.pricing.normal;
    return pricePerHour * selectedDuration;
  }, [selectedSlot, selectedDuration, player]);

  // Calculate end time
  const getEndTime = useMemo(() => {
    if (!selectedSlot || !availability) return '';
    const slotIndex = availability.availability.findIndex(
      (s) => s.timeSlotId === selectedSlot.timeSlotId
    );
    const endIndex = slotIndex + selectedDuration;
    if (endIndex > availability.availability.length) {
      return availability.availability[availability.availability.length - 1]?.endTime || '';
    }
    return availability.availability[endIndex - 1]?.endTime || '';
  }, [selectedSlot, selectedDuration, availability]);

  // Handle slot selection
  const handleSelectSlot = (slot) => {
    if (slot.availableCount < 1) return;
    setSelectedSlot(slot);
    setSelectedDuration(1);
  };

  // Handle booking
  const handleBooking = () => {
    if (!isAuthenticated) {
      navigate(`${ROUTES.CUSTOMER.LOGIN}?redirect=${ROUTES.CUSTOMER.BOOKING}`);
      return;
    }
    setShowConfirmModal(true);
  };

  // Confirm booking
  const handleConfirmBooking = async () => {
    try {
      setBookingLoading(true);
      const response = await customerBookingsAPI.create({
        date: selectedDate.toISOString().split('T')[0],
        timeSlot: selectedSlot.timeSlotId,
        duration: selectedDuration,
      });

      if (response.success) {
        setCreatedBooking(response.data);
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        setSelectedSlot(null);
        loadAvailability(); // Refresh availability
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการจอง');
    } finally {
      setBookingLoading(false);
    }
  };

  // Duration options (max based on available consecutive slots)
  const durationOptions = useMemo(() => {
    if (!selectedSlot || !availability) return [1];
    const slotIndex = availability.availability.findIndex(
      (s) => s.timeSlotId === selectedSlot.timeSlotId
    );
    let maxDuration = 1;
    for (let i = slotIndex; i < availability.availability.length && i < slotIndex + 8; i++) {
      if (availability.availability[i].availableCount < 1) break;
      maxDuration = i - slotIndex + 1;
    }
    return Array.from({ length: maxDuration }, (_, i) => i + 1);
  }, [selectedSlot, availability]);

  return (
    <div className="min-h-full p-4 pb-32">
      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-white mb-1">จองสนาม</h1>
        <p className="text-blue-200 text-sm">เลือกวันและเวลาที่ต้องการ</p>
      </div>

      {/* Date Picker */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-lg bg-blue-800/50 text-white hover:bg-blue-700/50 transition-colors disabled:opacity-50"
            disabled={selectedDate <= new Date().setHours(0, 0, 0, 0)}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="text-center">
            <p className="text-yellow-400 font-bold text-lg">
              {formatDateShort(selectedDate)}
            </p>
            <p className="text-blue-200 text-xs">{formatDate(selectedDate)}</p>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-lg bg-blue-800/50 text-white hover:bg-blue-700/50 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Time Slots */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
      ) : (
        <div className="space-y-2 max-w-xl mx-auto">
          {availability?.availability?.map((slot) => {
            const isSelected = selectedSlot?.timeSlotId === slot.timeSlotId;
            const isAvailable = slot.availableCount > 0;
            const price = player?.isMember
              ? slot.pricing.member
              : slot.pricing.normal;

            return (
              <button
                key={slot.timeSlotId}
                onClick={() => handleSelectSlot(slot)}
                disabled={!isAvailable}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-yellow-400 text-blue-900'
                    : isAvailable
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-white/5 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${isSelected ? 'text-blue-900' : 'text-yellow-400'}`} />
                    <div>
                      <p className="font-semibold">
                        {slot.startTime} - {slot.endTime}
                      </p>
                      <p className={`text-sm ${isSelected ? 'text-blue-800' : 'text-blue-200'}`}>
                        {isAvailable ? `ว่าง ${slot.availableCount} สนาม` : 'เต็ม'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isSelected ? 'text-blue-900' : 'text-yellow-400'}`}>
                      ฿{price}
                    </p>
                    <p className={`text-xs ${isSelected ? 'text-blue-800' : 'text-blue-300'}`}>
                      /ชม.
                    </p>
                  </div>
                </div>
                {slot.peakHour && (
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                    isSelected ? 'bg-blue-900/20 text-blue-900' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    Peak Hour
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Booking Summary (Fixed Bottom) */}
      {selectedSlot && (
        <div className="fixed bottom-16 left-0 right-0 bg-blue-950 border-t border-white/10 p-4">
          <div className="max-w-xl mx-auto">
            {/* Duration Selector */}
            <div className="mb-4">
              <p className="text-sm text-blue-200 mb-2">จำนวนชั่วโมง</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {durationOptions.map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setSelectedDuration(duration)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedDuration === duration
                        ? 'bg-yellow-400 text-blue-900'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {duration} ชม.
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-200 text-sm">
                  {selectedSlot.startTime} - {getEndTime}
                </p>
                <p className="text-white font-bold text-xl">
                  ฿{calculatePrice.toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleBooking}
                className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold rounded-lg transition-colors"
              >
                {isAuthenticated ? 'จองเลย' : 'เข้าสู่ระบบเพื่อจอง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <BookingConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmBooking}
        loading={bookingLoading}
        bookingData={{
          date: selectedDate,
          startTime: selectedSlot?.startTime,
          endTime: getEndTime,
          duration: selectedDuration,
          totalPrice: calculatePrice,
        }}
        player={player}
      />

      {/* Success Modal */}
      <BookingSuccessModal
        isOpen={showSuccessModal}
        booking={createdBooking}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
```

---

### Phase 19: Customer Layout (แก้ไข)

#### File: `frontend/src/components/customer/CustomerLayout.jsx`

เพิ่มใน header:

```jsx
import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { MapPin, FileText, Calendar, User, LogOut, LogIn, UserPlus } from 'lucide-react';
import usePlayerAuthStore from '../../store/playerAuthStore';
import { ROUTES } from '../../constants';

export default function CustomerLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, player, initAuth, logout } = usePlayerAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.CUSTOMER.HOME);
  };

  const navItems = [
    { path: ROUTES.CUSTOMER.HOME, label: 'หน้าแรก', icon: MapPin },
    { path: ROUTES.CUSTOMER.BOOKING, label: 'จองสนาม', icon: Calendar },
    { path: ROUTES.CUSTOMER.RULES, label: 'กฎระเบียบ', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800">
      {/* Header */}
      <header className="bg-blue-950/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏸</span>
            <span className="font-bold text-white hidden sm:block">Lucky Badminton</span>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <NavLink
                  to={ROUTES.CUSTOMER.MY_BOOKINGS}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-200 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{player?.name}</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-200 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">ออก</span>
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to={ROUTES.CUSTOMER.LOGIN}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-200 hover:text-white transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ</span>
                </NavLink>
                <NavLink
                  to={ROUTES.CUSTOMER.REGISTER}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-400 hover:bg-yellow-500 text-blue-900 rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">สมัคร</span>
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-16">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-blue-950 border-t border-white/10 z-40">
        <div className="max-w-md mx-auto flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 transition-colors ${
                  isActive ? 'text-yellow-400' : 'text-blue-300 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
```

---

### Phase 20: Admin Bookings Table (แก้ไข)

#### File: `frontend/src/components/booking/BookingsTable.jsx`

เพิ่มใน Court column:

```jsx
// เพิ่ม state และ imports ที่ต้องการ
import { useState, useEffect } from 'react';
import { courtsAPI, bookingsAPI } from '../../lib/api';

// ใน component เพิ่ม:
const [courts, setCourts] = useState([]);
const [assigningCourt, setAssigningCourt] = useState(null);

useEffect(() => {
  loadCourts();
}, []);

const loadCourts = async () => {
  try {
    const response = await courtsAPI.getAll({ status: 'available' });
    if (response.success) {
      setCourts(response.data);
    }
  } catch (error) {
    console.error('Load courts error:', error);
  }
};

const handleAssignCourt = async (bookingId, courtId) => {
  try {
    setAssigningCourt(bookingId);
    const response = await bookingsAPI.assignCourt(bookingId, courtId);
    if (response.success) {
      toast.success('กำหนดสนามสำเร็จ');
      // Trigger reload
      if (onReload) onReload();
    }
  } catch (error) {
    console.error('Assign court error:', error);
    toast.error(error.response?.data?.message || 'ไม่สามารถกำหนดสนามได้');
  } finally {
    setAssigningCourt(null);
  }
};

// ใน Court column:
<td className="px-4 py-4 whitespace-nowrap">
  {booking.court ? (
    <>
      <div className="text-sm font-medium text-gray-900">
        {booking.court.courtNumber || '-'}
      </div>
      <div className="text-xs text-gray-500">{booking.court.name || ''}</div>
    </>
  ) : (
    <select
      value=""
      onChange={(e) => handleAssignCourt(booking._id, e.target.value)}
      disabled={assigningCourt === booking._id}
      className="text-sm border border-orange-300 bg-orange-50 text-orange-800 rounded-lg px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
    >
      <option value="" disabled>เลือกสนาม</option>
      {courts.map((court) => (
        <option key={court._id} value={court._id}>
          {court.name || `Court ${court.courtNumber}`}
        </option>
      ))}
    </select>
  )}
</td>
```

---

### Phase 21: App.jsx (แก้ไข routes)

#### File: `frontend/src/App.jsx`

```jsx
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Auth Stores
import useAuthStore from './store/authStore';
import usePlayerAuthStore from './store/playerAuthStore';

// Admin Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
// ... other admin imports

// Customer Pages
import CustomerLayout from './components/customer/CustomerLayout';
import HomePage from './pages/customer/HomePage';
import RulesPage from './pages/customer/RulesPage';
import CustomerBookingPage from './pages/customer/CustomerBookingPage';
import CustomerLoginPage from './pages/customer/CustomerLoginPage';
import CustomerRegisterPage from './pages/customer/CustomerRegisterPage';
import MyBookingsPage from './pages/customer/MyBookingsPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import CustomerProtectedRoute from './components/customer/CustomerProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';

import { ROUTES } from './constants';

function App() {
  const { initAuth } = useAuthStore();
  const { initAuth: initPlayerAuth } = usePlayerAuthStore();

  useEffect(() => {
    initAuth();
    initPlayerAuth();
  }, [initAuth, initPlayerAuth]);

  return (
    <Router>
      <Toaster position="top-right" />

      <Routes>
        {/* Customer Public Routes */}
        <Route element={<CustomerLayout />}>
          <Route path={ROUTES.CUSTOMER.HOME} element={<HomePage />} />
          <Route path={ROUTES.CUSTOMER.RULES} element={<RulesPage />} />
          <Route path={ROUTES.CUSTOMER.BOOKING} element={<CustomerBookingPage />} />
          <Route path={ROUTES.CUSTOMER.LOGIN} element={<CustomerLoginPage />} />
          <Route path={ROUTES.CUSTOMER.REGISTER} element={<CustomerRegisterPage />} />

          {/* Customer Protected Routes */}
          <Route element={<CustomerProtectedRoute />}>
            <Route path={ROUTES.CUSTOMER.MY_BOOKINGS} element={<MyBookingsPage />} />
          </Route>
        </Route>

        {/* Admin Login (moved to /admin/login) */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route
          path={ROUTES.ADMIN.ROOT}
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          {/* ... other admin routes */}
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to={ROUTES.CUSTOMER.HOME} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## Testing Checklist

### Backend Tests

- [ ] Player register - สมัครด้วยเบอร์ใหม่
- [ ] Player register - เบอร์ซ้ำ (ต้อง error)
- [ ] Player login - เบอร์ + รหัสผ่านถูกต้อง
- [ ] Player login - รหัสผ่านผิด (ต้อง error)
- [ ] Get public availability - ได้ข้อมูลจำนวนสนามว่าง
- [ ] Customer create booking - สร้าง booking สำเร็จ (court = null)
- [ ] Customer my bookings - ดูรายการ booking ของตัวเอง
- [ ] Admin assign court - กำหนดสนามให้ booking สำเร็จ

### Frontend Tests

- [ ] หน้า Login - login สำเร็จ redirect กลับ
- [ ] หน้า Register - สมัครสำเร็จ auto login
- [ ] หน้า Booking - แสดงจำนวนสนามว่าง
- [ ] หน้า Booking - เลือก time slot + duration
- [ ] หน้า Booking - คำนวณราคาถูกต้อง (normal/member)
- [ ] หน้า Booking - กดจองโดยไม่ login → redirect ไป login
- [ ] หน้า Booking - จองสำเร็จแสดง booking code
- [ ] หน้า My Bookings - แสดงรายการจอง
- [ ] หน้า Admin Bookings - แสดง dropdown เลือกสนาม สำหรับ booking ที่ยังไม่มีสนาม
- [ ] Admin login ที่ /admin/login ยังใช้งานได้

---

## Execution Order

| Step | Phase | Description |
|------|-------|-------------|
| 1 | Backend | แก้ไข `player.model.js` - เพิ่ม `isMember` |
| 2 | Backend | แก้ไข `booking.model.js` - court optional, เพิ่ม player, bookingSource |
| 3 | Backend | แก้ไข `middleware/auth.js` - เพิ่ม `protectPlayer` |
| 4 | Backend | แก้ไข `controllers/auth.controller.js` - เพิ่ม player auth functions |
| 5 | Backend | แก้ไข `routes/auth.routes.js` - เพิ่ม player routes |
| 6 | Backend | แก้ไข `utils/availabilityChecker.js` - เพิ่ม `getAvailabilityByTimeSlot` |
| 7 | Backend | แก้ไข `routes/bookings.routes.js` - เพิ่ม public, customer, assign routes |
| 8 | Frontend | แก้ไข `constants/api.js` - เพิ่ม endpoints |
| 9 | Frontend | แก้ไข `constants/routes.js` - เพิ่ม customer routes |
| 10 | Frontend | แก้ไข `lib/api.js` - เพิ่ม API functions |
| 11 | Frontend | สร้าง `store/playerAuthStore.js` |
| 12 | Frontend | สร้าง `pages/customer/CustomerLoginPage.jsx` |
| 13 | Frontend | สร้าง `pages/customer/CustomerRegisterPage.jsx` |
| 14 | Frontend | สร้าง `pages/customer/MyBookingsPage.jsx` |
| 15 | Frontend | สร้าง `components/customer/CustomerProtectedRoute.jsx` |
| 16 | Frontend | สร้าง `components/customer/BookingConfirmModal.jsx` |
| 17 | Frontend | สร้าง `components/customer/BookingSuccessModal.jsx` |
| 18 | Frontend | แก้ไข `pages/customer/CustomerBookingPage.jsx` |
| 19 | Frontend | แก้ไข `components/customer/CustomerLayout.jsx` |
| 20 | Frontend | แก้ไข `components/booking/BookingsTable.jsx` |
| 21 | Frontend | แก้ไข `App.jsx` |

---

## Notes

- Token สำหรับ Player เก็บใน `localStorage.playerToken` และ `localStorage.player`
- Token สำหรับ Admin เก็บใน `localStorage.token` และ `localStorage.user`
- Admin login ย้ายจาก `/login` → `/admin/login`
- Customer login อยู่ที่ `/login`
- เบอร์โทร normalize เป็นไม่มีขีด (0812345678) ก่อนบันทึก
