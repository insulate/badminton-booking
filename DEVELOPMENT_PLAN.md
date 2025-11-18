# 📋 แผนการพัฒนาระบบจองสนามแบดมินตัน

## 🎯 สถานะปัจจุบัน (Current Status)

### ✅ เสร็จแล้ว
- [x] MongoDB with Docker setup
- [x] Backend: User Authentication & CRUD API
- [x] Frontend: Login system with JWT
- [x] Frontend: Admin Layout with accordion menu
- [x] Frontend: Dashboard (mock data)
- [x] Frontend: User Management (complete CRUD)
- [x] Constants for routes and API endpoints
- [x] Protected routes
- [x] **Phase 1: Settings System (Backend + Frontend)**
- [x] **Phase 2: Court Management (Backend + Frontend)**
- [x] **Phase 3: Time Slot & Pricing (Backend + Frontend)**
- [x] **Phase 4: Booking System (Backend + Frontend)**

### 📊 สถิติ
- **Backend APIs**: 37/40+ endpoints (Settings: 8, Courts: 5, TimeSlots: 8, Bookings: 10, Users: 4, Auth: 2)
- **Frontend Pages**: 14/15+ pages (Settings: 6, Courts: 3, Bookings: 2, TimeSlots: 1, Users: 1, Dashboard: 1, Login: 1)
- **Frontend Components**: 11 components (Booking: 6, TimeSlots: 2, Common: 1, Layout: 1, ProtectedRoute: 1)
- **Database Models**: 6/8 models (User, Setting, Court, TimeSlot, Booking, Counter)
- **Progress**: ~75%

---

## 🚀 แผนการพัฒนา (Development Roadmap)
> **หลักการใหม่**: ทำ Backend + Frontend ของแต่ละฟีเจอร์ไปพร้อมกัน เพื่อให้ได้ฟีเจอร์ที่สมบูรณ์และทดสอบได้ทันที

---

## **PHASE 1: Settings System** ⚙️
> ระยะเวลา: 1 วัน | ความสำคัญ: สูงสุด | Status: ✅ COMPLETED

### 1.1 Backend - Settings API ✅
**ไฟล์**:
- `backend/models/setting.model.js`
- `backend/routes/settings.routes.js`
- `backend/seeders/settings.seeder.js`

**API Endpoints**: 8 endpoints
- `GET /api/settings` - ดูการตั้งค่าทั้งหมด ✅
- `PUT /api/settings` - อัพเดทการตั้งค่าทั้งหมด ✅
- `PATCH /api/settings/venue` - อัพเดทข้อมูลสนาม ✅
- `PATCH /api/settings/operating` - อัพเดทเวลาทำการ ✅
- `PATCH /api/settings/booking` - อัพเดทการตั้งค่าการจอง ✅
- `PATCH /api/settings/payment` - อัพเดทการชำระเงิน ✅
- `PATCH /api/settings/general` - อัพเดทการตั้งค่าทั่วไป ✅
- `POST /api/settings/reset` - รีเซ็ตเป็นค่าเริ่มต้น ✅

**Status**:
- [x] Model, Routes, Seeder สร้างเสร็จ
- [x] ทดสอบ API ทั้งหมดแล้ว

---

### 1.2 Frontend - Settings Pages ✅
**ไฟล์**:
- `frontend/src/pages/admin/settings/VenueSettingsPage.jsx`
- `frontend/src/pages/admin/settings/OperatingHoursPage.jsx`
- `frontend/src/pages/admin/settings/BookingSettingsPage.jsx`
- `frontend/src/pages/admin/settings/PaymentSettingsPage.jsx`
- `frontend/src/pages/admin/settings/GeneralSettingsPage.jsx`

**Features**:
- Form validation ด้วย useState
- Save confirmation with toast notifications
- Loading states
- Back navigation buttons

**Tasks**:
- [x] สร้างฟอร์มข้อมูลสนาม (Venue Settings)
- [x] สร้างฟอร์มเวลาทำการ (Operating Hours)
- [x] สร้างฟอร์มการตั้งค่าการจอง (Booking Settings)
- [x] สร้างฟอร์มวิธีการชำระเงิน (Payment Settings)
- [x] สร้างฟอร์มการตั้งค่าทั่วไป (General Settings)
- [x] Integrate ทุกฟอร์มกับ Settings API
- [x] เพิ่มใน Settings menu accordion
- [x] ทดสอบการบันทึกและแสดงผลครบทุก section

**🎯 Milestone**: Settings System ครบทั้ง Backend + Frontend พร้อมใช้งาน 100%

---

## **PHASE 2: Court Management** 🏸
> ระยะเวลา: 1 วัน | ความสำคัญ: สูงสุด | Status: ✅ COMPLETED

### 2.1 Backend - Courts API ✅
**ไฟล์**:
- `backend/models/court.model.js`
- `backend/routes/courts.routes.js`
- `backend/seeders/courts.seeder.js`

**Schema**:
```javascript
{
  courtNumber: String,     // "C01", "C02" (unique, uppercase)
  name: String,            // "Court 1", "Court Premium"
  type: String,            // "normal", "premium", "tournament"
  status: String,          // "available", "maintenance", "inactive"
  description: String,
  hourlyRate: {
    weekday: Number,       // Default: 150
    weekend: Number,       // Default: 180
    holiday: Number        // Default: 200
  },
  deletedAt: Date          // Soft delete
}
```

**API Endpoints**: 5 endpoints
- `GET /api/courts` - ดูสนามทั้งหมด (with filters)
- `GET /api/courts/:id` - ดูรายละเอียดสนาม
- `POST /api/courts` - เพิ่มสนามใหม่
- `PUT /api/courts/:id` - แก้ไขสนาม
- `DELETE /api/courts/:id` - ลบสนาม (soft delete)

**Tasks**:
- [x] สร้าง Court Model with validation
- [x] สร้าง Courts API routes (5 endpoints)
- [x] สร้าง default courts seeder (6 สนาม)
- [x] ทดสอบ API

---

### 2.2 Frontend - Court Management ✅
**ไฟล์**:
- `frontend/src/pages/admin/settings/courts/CourtsPage.jsx`
- `frontend/src/pages/admin/settings/courts/CourtsAddPage.jsx`
- `frontend/src/pages/admin/settings/courts/CourtsEditPage.jsx`

**Features**:
- Table แสดงรายการสนาม (courtNumber, name, type, status, pricing)
- Separate pages สำหรับเพิ่ม/แก้ไขสนาม
- Search by courtNumber or name
- Filter by type (ธรรมดา/พรีเมี่ยม/แข่งขัน) and status
- Delete with confirmation
- Color-coded badges สำหรับ type และ status
- Form validation
- Toast notifications

**Tasks**:
- [x] สร้าง CourtsPage (List with search/filter)
- [x] สร้าง CourtsAddPage (Add form)
- [x] สร้าง CourtsEditPage (Edit form)
- [x] Integrate กับ Courts API
- [x] เพิ่มใน Settings menu และ App routes
- [x] ทดสอบ CRUD operations

**🎯 Milestone**: Court Management System พร้อมใช้งานครบ 100%

---

## **PHASE 3: Time Slot & Pricing** ⏰
> ระยะเวลา: 1 วัน | ความสำคัญ: สูง | Status: ✅ COMPLETED

### 3.1 Backend - Time Slots API
**ไฟล์**:
- `backend/models/timeslot.model.js`
- `backend/routes/timeslots.routes.js`
- `backend/seeders/timeslots.seeder.js`

**Schema**:
```javascript
{
  startTime: String,       // "09:00"
  endTime: String,         // "10:00"
  dayType: String,         // "weekday", "weekend" (removed "holiday")
  pricing: {
    normal: Number,        // ราคาสนามปกติ
    member: Number,        // ราคาสมาชิก
  },
  peakPricing: {
    normal: Number,        // ราคา Peak Hour ปกติ
    member: Number,        // ราคา Peak Hour สมาชิก
  },
  peakHour: Boolean,       // ช่วงเวลา Peak (toggle switch)
  status: String,          // "active", "inactive"
}
```

**API Endpoints**: 8 endpoints
- `GET /api/timeslots` - ดูช่วงเวลาทั้งหมด ✅
- `GET /api/timeslots/active` - ดูช่วงเวลาที่เปิดใช้งาน ✅
- `GET /api/timeslots/:id` - ดูรายละเอียดช่วงเวลา ✅
- `POST /api/timeslots` - เพิ่มช่วงเวลาใหม่ ✅
- `PUT /api/timeslots/:id` - แก้ไขช่วงเวลา ✅
- `PATCH /api/timeslots/:id/pricing` - แก้ไขราคาเฉพาะ ✅
- `PATCH /api/timeslots/bulk-update-pricing` - อัปเดตราคาหลายช่วงเวลาพร้อมกัน ✅
- `DELETE /api/timeslots/:id` - ลบช่วงเวลา ✅

**Tasks**:
- [x] สร้าง TimeSlot Model
- [x] สร้าง TimeSlots API routes (8 endpoints)
- [x] สร้าง dynamic timeslots seeder (อิงตาม Settings operating hours)
- [x] เพิ่ม validation (เวลาไม่ซ้อนทับกัน)
- [x] ลบ holiday day type (เหลือแค่ weekday/weekend)
- [x] เพิ่ม bulk update pricing endpoint
- [x] ทดสอบ API

**Status**: ✅ Backend API พร้อมใช้งาน 100%

---

### 3.2 Frontend - Time Slot Management ✅
**ไฟล์**:
- `frontend/src/pages/admin/settings/timeslots/TimeSlotsPage.jsx`
- `frontend/src/components/timeslots/TimeSlotModal.jsx`
- `frontend/src/components/timeslots/BulkUpdatePricingModal.jsx`

**Features**:
- Table แสดงช่วงเวลาและราคา grouped by weekday/weekend
- Toggle switch สำหรับ Peak Hour (in modal และ table)
- Optimistic UI updates (ไม่ reload table เมื่อกด toggle)
- Bulk update pricing modal (อัปเดตราคาหลายช่วงเวลาพร้อมกัน)
- Search และ filter ตาม dayType, status, peak hour
- Color-coded badges สำหรับ status และ peak hour
- Form validation และ overlap checking

**Tasks**:
- [x] สร้าง TimeSlotsPage with grouped display
- [x] สร้าง TimeSlotModal (with toggle switch for Peak Hour)
- [x] สร้าง BulkUpdatePricingModal (อัปเดตราคาหลายช่วงเวลา)
- [x] Quick toggle Peak Hour ใน table (with optimistic updates)
- [x] ลบ holiday day type options
- [x] Integrate กับ TimeSlots API
- [x] เพิ่มใน Settings menu (จัดการช่วงเวลาและราคา)
- [x] ทดสอบ CRUD operations

**Status**: ✅ Frontend พร้อมใช้งาน 100%

---

**🎯 Milestone**: Time Slot & Pricing System พร้อมใช้งานครบ 100% ✅

---

## **PHASE 4: Booking System** 📅
> ระยะเวลา: 2 วัน | ความสำคัญ: สูงสุด | Status: ✅ COMPLETED

### 4.1 Backend - Bookings API
**ไฟล์**:
- `backend/models/booking.model.js`
- `backend/routes/bookings.routes.js`
- `backend/middleware/bookingValidation.js`

**Schema**:
```javascript
{
  bookingCode: String,     // Auto-generated "BK202501180001"
  customer: {
    name: String,
    phone: String,
    email: String,
  },
  court: ObjectId (ref: Court),
  date: Date,
  timeSlot: ObjectId (ref: TimeSlot),
  duration: Number,        // hours (1, 2, 3)
  pricing: {
    subtotal: Number,
    discount: Number,
    deposit: Number,
    total: Number,
  },
  paymentStatus: String,   // "pending", "partial", "paid"
  bookingStatus: String,   // "confirmed", "checked-in", "completed", "cancelled"
  paymentMethod: String,
  notes: String,
}
```

**API Endpoints**: 10+ endpoints
- `GET /api/bookings` - ดูการจองทั้งหมด (with filters)
- `GET /api/bookings/schedule/daily?date=2025-01-18` - ตารางรายวัน
- `GET /api/bookings/:id` - ดูรายละเอียดการจอง
- `POST /api/bookings` - สร้างการจองใหม่
- `POST /api/bookings/check-availability` - ตรวจสอบสนามว่าง
- `PATCH /api/bookings/:id` - แก้ไขการจอง
- `PATCH /api/bookings/:id/cancel` - ยกเลิกการจอง
- `PATCH /api/bookings/:id/checkin` - Check-in
- `PATCH /api/bookings/:id/checkout` - Check-out
- `PATCH /api/bookings/:id/payment` - อัพเดทการชำระเงิน

**Business Logic**:
- ตรวจสอบสนามว่าง (ไม่ให้จองซ้อน)
- คำนวณราคาตามช่วงเวลา (TimeSlot pricing)
- สร้าง booking code อัตโนมัติ
- Validation ตามกฎการจอง (advanceBookingDays, maxBookingHours)

**Tasks**:
- [x] สร้าง Booking Model
- [x] สร้าง Booking API routes (10 endpoints)
- [x] สร้าง booking validation middleware
- [x] สร้าง availability check logic
- [x] สร้าง price calculation logic
- [x] สร้าง booking code generator
- [x] ทดสอบ API ทุก endpoint

**Status**: ✅ Backend API พร้อมใช้งาน 100%

---

### 4.2 Frontend - Booking Calendar
**ไฟล์**:
- `frontend/src/pages/admin/BookingPage.jsx`
- `frontend/src/components/booking/BookingCalendar.jsx`
- `frontend/src/components/booking/CourtScheduleGrid.jsx`
- `frontend/src/components/booking/BookingForm.jsx`
- `frontend/src/components/booking/BookingModal.jsx`

**Features**:
- เลือกวันจาก Calendar
- แสดง Court availability grid (สนาม x ช่วงเวลา)
- คลิกช่วงเวลาที่ว่างเพื่อจอง
- ฟอร์มกรอกข้อมูลลูกค้า
- แสดงการคำนวณราคาแบบ real-time
- เลือก Payment method

**Tasks**:
- [x] สร้าง BookingPage
- [x] สร้าง BookingCalendar component
- [x] สร้าง CourtScheduleGrid component
- [x] สร้าง BookingModal component
- [x] สร้าง Price Calculator (รวมใน BookingModal)
- [x] Integrate กับ Bookings API
- [x] เพิ่มใน main menu

**Status**: ✅ Frontend Booking Calendar พร้อมใช้งาน 100%

---

### 4.3 Frontend - Booking Management ✅
**ไฟล์**:
- `frontend/src/pages/admin/BookingsPage.jsx`
- `frontend/src/components/booking/BookingsTable.jsx`
- `frontend/src/components/booking/BookingDetailModal.jsx`
- `frontend/src/components/booking/BookingFilters.jsx`

**Features**:
- Table แสดงรายการจองทั้งหมด
- Filter (วันที่, สถานะ, สนาม, ลูกค้า)
- Search (รหัสจอง, ชื่อ, เบอร์โทร)
- Quick actions (Check-in, Cancel, Update Payment)
- Color-coded status badges
- Pagination support

**Tasks**:
- [x] สร้าง BookingsPage
- [x] สร้าง BookingsTable component
- [x] สร้าง BookingFilters component
- [x] สร้าง Search functionality
- [x] สร้าง Quick Action buttons (Check-in, Cancel, Mark as Paid)
- [x] สร้าง BookingDetailModal
- [x] Integrate กับ Bookings API
- [x] เพิ่มใน main menu

**Status**: ✅ Frontend Booking Management พร้อมใช้งาน 100%

---

**🎯 Milestone**: Booking System พร้อมใช้งานครบ 100% ✅

---

## **PHASE 5: POS & Products** 🛒
> ระยะเวลา: 1-2 วัน | ความสำคัญ: สูง | Full-Stack Feature

### 5.1 Backend - Products & Sales API
**ไฟล์**:
- `backend/models/product.model.js`
- `backend/models/sale.model.js`
- `backend/routes/products.routes.js`
- `backend/routes/sales.routes.js`

**Products Schema**:
```javascript
{
  sku: String,
  name: String,
  category: String,
  price: Number,
  stock: Number,
  lowStockAlert: Number,
  status: String,        // "active", "inactive"
}
```

**Sales Schema**:
```javascript
{
  saleCode: String,      // "SL202501180001"
  items: [{
    product: ObjectId,
    quantity: Number,
    price: Number,
    subtotal: Number,
  }],
  customer: {
    type: String,        // "member", "walk-in"
    name: String,
    phone: String,
  },
  total: Number,
  paymentMethod: String,
  relatedBooking: ObjectId,  // (optional) ถ้ารวมบิลกับค่าสนาม
}
```

**API Endpoints**:
**Products**:
- `GET /api/products` - ดูสินค้าทั้งหมด
- `POST /api/products` - เพิ่มสินค้า
- `PUT /api/products/:id` - แก้ไขสินค้า
- `PATCH /api/products/:id/stock` - อัพเดทสต็อก
- `DELETE /api/products/:id` - ลบสินค้า

**Sales**:
- `POST /api/sales` - บันทึกการขาย
- `GET /api/sales` - ดูประวัติการขาย
- `GET /api/sales/daily?date=2025-01-18` - รายงานรายวัน
- `GET /api/sales/:id` - ดูรายละเอียดบิล

**Tasks**:
- [ ] สร้าง Product & Sale Models
- [ ] สร้าง Products API routes
- [ ] สร้าง Sales API routes
- [ ] สร้าง products seeder
- [ ] ทดสอบ API

---

### 5.2 Frontend - Product Management
**ไฟล์**:
- `frontend/src/pages/admin/settings/ProductsPage.jsx`
- `frontend/src/components/products/ProductTable.jsx`
- `frontend/src/components/products/ProductModal.jsx`

**Features**:
- Table แสดงรายการสินค้า
- CRUD operations
- จัดหมวดหมู่สินค้า
- จัดการสต็อก
- Low stock alert

**Tasks**:
- [ ] สร้าง ProductsPage
- [ ] สร้าง ProductTable component
- [ ] สร้าง ProductModal component
- [ ] Stock Management UI
- [ ] Integrate กับ API
- [ ] เพิ่มใน Settings menu

---

### 5.3 Frontend - POS Page
**ไฟล์**:
- `frontend/src/pages/admin/POSPage.jsx`
- `frontend/src/components/pos/ProductGrid.jsx`
- `frontend/src/components/pos/Cart.jsx`
- `frontend/src/components/pos/PaymentModal.jsx`
- `frontend/src/components/pos/ReceiptPreview.jsx`

**Features**:
- เลือกสินค้าจาก grid (คลิกเพิ่มเข้าตะกร้า)
- แสดง Cart พร้อมคำนวณราคารวม
- เลือกประเภทลูกค้า (สมาชิก/ทั่วไป) → ราคาเปลี่ยน
- รวมบิลกับค่าสนาม (optional link to booking)
- เลือก Payment method
- พิมพ์ใบเสร็จ

**Tasks**:
- [ ] สร้างหน้า POS
- [ ] สร้าง Product Grid
- [ ] สร้าง Shopping Cart
- [ ] สร้าง Payment Modal
- [ ] สร้าง Receipt Preview
- [ ] Integrate กับ API
- [ ] เพิ่มใน main menu

**🎯 Milestone**: POS & Products พร้อมใช้งานครบ 100%

---

---

## **PHASE 6: Group Play System** 👥
> ระยะเวลา: 2-3 วัน | ความสำคัญ: สูง | Full-Stack Feature | **ต้องทำหลัง POS (Phase 5)**

⚠️ **หมายเหตุ**: Phase นี้ต้องทำหลังจาก Phase 5 (POS) เสร็จแล้ว เพราะต้องใช้ข้อมูลสินค้าในการคำนวณค่าใช้จ่าย

### 6.1 Backend - Players & Group Play API
**ไฟล์**:
- `backend/models/player.model.js`
- `backend/models/groupplay.model.js`
- `backend/routes/players.routes.js`
- `backend/routes/groupplay.routes.js`
- `backend/constants/playerLevels.js`

**Player Schema**:
```javascript
{
  name: String,                   // ชื่อผู้เล่น
  phone: String,                  // เบอร์โทร (unique)
  password: String,               // Password สำหรับอนาคต
  level: String,                  // "0"-"10" (optional)
  levelName: String,              // "เปะ-แปะ", "หน้าบ้าน", "S-", ..., "A" (auto-generated)
  stats: {
    totalGames: Number,           // จำนวนเกมรวม (auto-update)
    totalSpent: Number,           // ค่าใช้จ่ายรวม (auto-update)
    lastPlayed: Date              // เล่นครั้งล่าสุด (auto-update)
  },
  notes: String,                  // หมายเหตุ
  status: String,                 // "active", "inactive"
  createdAt: Date,
  updatedAt: Date
}
```

**GroupPlay Schema**:
```javascript
{
  sessionName: String,              // เช่น "ก๊วนจันทร์-ศุกร์"
  court: ObjectId (ref: Court),
  date: Date,                       // วันที่เริ่ม (สำหรับ session แบบวันเดียว)
  daysOfWeek: [String],             // ["monday", "tuesday", ...] สำหรับ recurring
  startTime: String,                // เช่น "18:00"
  endTime: String,                  // เช่น "24:00"
  entryFee: Number,                 // Default 30 บาท (configurable)
  players: [{
    player: ObjectId,               // ref: Player (optional, null ถ้าเป็น walk-in)
    name: String,                   // ชื่อ (copy จาก Player หรือกรอกใหม่)
    phone: String,                  // เบอร์ (copy จาก Player หรือกรอกใหม่)
    level: String,                  // ระดับมือ: "0"-"10" (optional, copy จาก Player)
    levelName: String,              // ชื่อระดับ (optional, copy จาก Player)
    checkedIn: Boolean,
    checkInTime: Date,
    entryFeePaid: Boolean,          // จ่ายค่าเข้าร่วมแล้วหรือยัง
    games: [{
      gameNumber: Number,
      teammates: [PlayerId],        // คนที่เล่นด้วยกัน
      opponents: [PlayerId],        // คนฝั่งตรงข้าม
      status: String,               // "playing", "finished"
      startTime: Date,
      endTime: Date,
      items: [{                     // สินค้าที่ใช้ในเกมนี้ (ลูกแบด, น้ำ, ขนม)
        product: ObjectId (ref: Product),
        quantity: Number,
        price: Number
      }],
      totalItemsCost: Number,       // รวมค่าสินค้าในเกมนี้
      costPerPlayer: Number         // totalItemsCost / จำนวนผู้เล่นในเกม
    }],
    totalCost: Number,              // entryFee + sum(costPerPlayer ของทุกเกม)
    paymentStatus: String,          // "unpaid", "paid"
    checkedOut: Boolean,
    checkOutTime: Date
  }],
  status: String,                   // "scheduled", "active", "completed"
  recurring: Boolean,               // true ถ้าเป็น session ประจำ
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

**API Endpoints**:

**Players API** (6 endpoints):
- `GET /api/players` - ดูผู้เล่นทั้งหมด (filter by level, search by name/phone)
- `POST /api/players` - เพิ่มผู้เล่นใหม่ (ชื่อ, เบอร์, ระดับมือ)
- `GET /api/players/:id` - ดูรายละเอียดผู้เล่น
- `PUT /api/players/:id` - แก้ไขข้อมูลผู้เล่น (ชื่อ, เบอร์, ระดับมือ, หมายเหตุ)
- `DELETE /api/players/:id` - ลบผู้เล่น
- `GET /api/players/stats/:id` - ดูสถิติการเล่น (จำนวนเกม, ค่าใช้จ่ายรวม)

**Group Play API** (8 endpoints):
- `GET /api/groupplay` - ดู Session ทั้งหมด (filter by date, court, status)
- `POST /api/groupplay` - สร้าง Session ใหม่ (แบบวันเดียว หรือ recurring)
  - ตรวจสอบว่าสนามว่างหรือไม่
  - สร้าง booking ใน Calendar (แสดงเป็น "ก๊วนสนาม")
- `GET /api/groupplay/:id` - ดูรายละเอียด Session
- `POST /api/groupplay/:id/checkin` - Check-in ผู้เล่น + เก็บค่าเข้าร่วม
  - เลือกจาก Player database หรือสร้างใหม่ (walk-in)
  - Copy ข้อมูล (ชื่อ, เบอร์, ระดับมือ) จาก Player
  - เก็บค่าเข้าร่วม (ครั้งเดียวต่อวัน)
  - Set entryFeePaid = true
- `POST /api/groupplay/:id/game/start` - เริ่มเกมใหม่
  - เลือกผู้เล่น 2-4 คน จากรายชื่อที่ check-in แล้ว
  - แนะนำการจับคู่ตามระดับมือ (แต่พนักงานตัดสินใจเอง)
  - สร้าง game object ใหม่ใน player.games[] ของผู้เล่นทุกคน
  - Set status = "playing"
- `PATCH /api/groupplay/:id/game/:gameId/finish` - จบเกม + บันทึกสินค้าที่ใช้
  - เลือกสินค้าจาก POS (ลูกแบด, น้ำ, ขนม)
  - คำนวณ totalItemsCost
  - คำนวณ costPerPlayer = totalItemsCost / จำนวนผู้เล่น
  - Update totalCost ของผู้เล่นแต่ละคน
  - Set status = "finished", endTime = now
- `POST /api/groupplay/:id/checkout` - Check-out ผู้เล่น
  - แสดงสรุปยอดเงิน (entryFee + รวมค่าสินค้าทุกเกม)
  - อัพเดท paymentStatus = "paid"
  - Set checkedOut = true, checkOutTime = now
- `DELETE /api/groupplay/:id` - ลบ Session
  - ลบ booking ใน Calendar ด้วย

**Logic**:
- **Player Management**: CRUD players, auto-generate levelName จาก level
- **Player Stats**: Auto-update totalGames, totalSpent, lastPlayed หลัง checkout
- **Level System**: 11 ระดับ (Level 0-10) ตามมาตรฐาน MK Badminton 2025
- **Check-in**: เลือกจาก Player database หรือสร้างใหม่ (walk-in), copy ข้อมูลระดับมือ
- **Match Recommendation**: แนะนำการจับคู่ตามระดับมือ (แต่พนักงานตัดสินใจเอง)
- **Cost Calculation**: คำนวณค่าใช้จ่ายต่อคนในแต่ละเกม (ค่าสินค้า ÷ จำนวนผู้เล่น)
- **Payment Tracking**: ตรวจสอบว่าผู้เล่นจ่ายค่าเข้าร่วมแล้วหรือยัง (ครั้งเดียวต่อวัน)
- **Integration**: Booking Calendar (block court) + POS (product selection)

**Tasks**:
- [ ] สร้าง playerLevels.js constants (11 ระดับ + helper functions)
- [ ] สร้าง Player Model (schema + validation)
- [ ] สร้าง Players API routes (6 endpoints)
- [ ] สร้าง GroupPlay Model (schema ใหม่ตามด้านบน + ref Player)
- [ ] สร้าง Group Play API routes (8 endpoints)
- [ ] สร้าง level-based match recommendation logic
- [ ] สร้าง cost calculation logic
- [ ] สร้าง player stats auto-update logic
- [ ] Integrate กับ Booking Calendar API
- [ ] Integrate กับ POS/Product API
- [ ] ทดสอบ API (Postman/curl)
- [ ] ทดสอบ calculation scenarios ต่างๆ

---

### 6.2 Frontend - Player Management
**ไฟล์**:
- `frontend/src/pages/admin/settings/PlayersPage.jsx`
- `frontend/src/components/players/PlayerTable.jsx`
- `frontend/src/components/players/PlayerModal.jsx`
- `frontend/src/components/players/PlayerLevelBadge.jsx`
- `frontend/src/constants/playerLevels.js`

**Features**:
- **Player List**: Table แสดงผู้เล่นทั้งหมด (ชื่อ, เบอร์, ระดับมือ, สถิติ)
- **Filter by Level**: กรอง/ค้นหาตามระดับมือ (dropdown: Level 0-10)
- **Search**: ค้นหาด้วยชื่อหรือเบอร์โทร
- **Add Player**: เพิ่มผู้เล่นใหม่ (ชื่อ, เบอร์, ระดับมือ optional, หมายเหตุ)
- **Edit Player**: แก้ไขข้อมูล (ชื่อ, เบอร์, ระดับมือ, หมายเหตุ)
- **Delete Player**: ลบผู้เล่น
- **View Stats**: ดูสถิติ (จำนวนเกม, ค่าใช้จ่ายรวม, เล่นครั้งล่าสุด)
- **Level Badge**: แสดง badge สีของระดับมือ (Level 0-10)

**Tasks**:
- [ ] สร้าง playerLevels.js constants (11 ระดับ + colors)
- [ ] สร้าง PlayersPage (main page)
- [ ] สร้าง PlayerTable component (with filter & search)
- [ ] สร้าง PlayerModal component (add/edit form)
- [ ] สร้าง PlayerLevelBadge component
- [ ] Integrate กับ Players API
- [ ] เพิ่มใน Settings menu

---

### 6.3 Frontend - Group Play
**ไฟล์**:
- `frontend/src/pages/admin/GroupPlayPage.jsx`
- `frontend/src/components/groupplay/SessionManager.jsx`
- `frontend/src/components/groupplay/CreateSessionModal.jsx`
- `frontend/src/components/groupplay/PlayerCheckInModal.jsx`
- `frontend/src/components/groupplay/PlayerList.jsx`
- `frontend/src/components/groupplay/StartGameModal.jsx`
- `frontend/src/components/groupplay/FinishGameModal.jsx`
- `frontend/src/components/groupplay/CheckOutModal.jsx`
- `frontend/src/components/groupplay/GamesList.jsx`
- `frontend/src/components/groupplay/MatchRecommendation.jsx`

**Features**:
1. **สร้าง Session**
   - เลือกสนาม
   - เลือกวันที่ (แบบวันเดียว หรือ recurring Mon-Fri)
   - กำหนดเวลา (เช่น 18:00-24:00)
   - ตั้งค่าค่าเข้าร่วม (default 30 บาท)
   - ตรวจสอบว่าสนามว่างหรือไม่ (alert ถ้าซ้อน)

2. **Check-in ผู้เล่น**
   - **เลือกจาก Database**: ค้นหาผู้เล่นด้วยเบอร์หรือชื่อ → auto-fill ข้อมูล (ชื่อ, ระดับมือ)
   - **สร้างใหม่ (Walk-in)**: กรอกชื่อ + เบอร์ + ระดับมือ (optional)
   - คิดค่าเข้าร่วม 30 บาท (ครั้งเดียวต่อวัน)
   - แสดงปุ่ม "จ่ายเงินแล้ว"
   - เพิ่มผู้เล่นเข้ารายชื่อพร้อมแสดงระดับมือ

3. **เริ่มเกม (Start Game)**
   - เลือกผู้เล่น 2-4 คน จากรายชื่อที่ check-in แล้ว
   - **แสดงระดับมือ**: แสดง badge ระดับมือของผู้เล่นแต่ละคน
   - **แนะนำการจับคู่**: แสดงคำแนะนำตามระดับมือ (เช่น "ควรจับคู่ระดับใกล้เคียง")
     - เช่น: Level 5 + Level 6 vs Level 5 + Level 6 (balanced)
     - เช่น: Level 3 + Level 8 vs Level 5 + Level 6 (mixed - may be unbalanced)
   - บันทึกว่าใครเล่นกับใคร (teammates vs opponents)
   - แสดงสถานะ "กำลังเล่น"

4. **จบเกม (Finish Game)**
   - เลือกสินค้าที่ใช้จาก POS (ลูกแบด, น้ำ, ขนม)
   - แสดงยอดรวมค่าสินค้า
   - แสดงค่าใช้จ่ายต่อคน (รวมค่าสินค้า ÷ จำนวนผู้เล่น)
   - บันทึกเวลาจบเกม

5. **Check-out ผู้เล่น**
   - แสดงสรุปยอดเงิน:
     - ค่าเข้าร่วม: 30 บาท (ครั้งเดียว)
     - เกมที่ 1: +15 บาท (ลูกแบด 60÷4)
     - เกมที่ 2: +20 บาท (ลูกแบด 60÷4 + น้ำ 20÷4)
     - รวม: 65 บาท
   - ปุ่ม "จ่ายเงินแล้ว"
   - บันทึกเวลา check-out

6. **แสดงรายการเกม**
   - แสดงเกมที่กำลังเล่น
   - แสดงเกมที่เล่นเสร็จแล้ว (พร้อมค่าใช้จ่าย)
   - แสดงสถิติของผู้เล่นแต่ละคน (เล่นไปกี่เกม, ค่าใช้จ่ายรวม)

**Tasks**:
- [ ] สร้าง GroupPlayPage (main page)
- [ ] สร้าง SessionManager component (เลือก/สร้าง session)
- [ ] สร้าง CreateSessionModal (form สร้าง session + recurring days)
- [ ] สร้าง PlayerCheckInModal
  - Player search (ค้นหาจาก database)
  - Auto-fill ข้อมูล (ชื่อ, ระดับมือ)
  - Walk-in form (กรอกใหม่)
- [ ] สร้าง PlayerList component
  - แสดงรายชื่อผู้เล่นที่ check-in
  - แสดง level badge ของผู้เล่นแต่ละคน
- [ ] สร้าง StartGameModal
  - เลือกผู้เล่น 2-4 คน
  - แสดง level badge
  - MatchRecommendation component (คำนวณความสมดุล)
- [ ] สร้าง MatchRecommendation component (แนะนำการจับคู่)
- [ ] สร้าง FinishGameModal (เลือกสินค้า + คำนวณค่าใช้จ่าย)
- [ ] สร้าง CheckOutModal (สรุปยอดเงิน + ปุ่มจ่ายเงิน + อัพเดท player stats)
- [ ] สร้าง GamesList component (แสดงเกมทั้งหมด + สถิติ)
- [ ] Integrate ทุก component กับ API
- [ ] เพิ่ม "Group Play" ใน Admin menu
- [ ] ทดสอบ flow ทั้งหมด (check-in → start game → finish → checkout)

**🎯 Milestone**: Group Play System พร้อมใช้งานครบ 100% (รองรับ player database, level system, recurring sessions, POS integration, cost calculation)

---

## **PHASE 7: Reports & Analytics** 📊
> ระยะเวลา: 1 วัน | ความสำคัญ: ปานกลาง | Full-Stack Feature

### 7.1 Backend - Reports API
**ไฟล์**: `backend/routes/reports.routes.js`

**API Endpoints**: 6+ endpoints
- `GET /api/reports/revenue/daily?date=2025-01-18` - รายได้รายวัน
- `GET /api/reports/revenue/monthly?month=2025-01` - รายได้รายเดือน
- `GET /api/reports/revenue/yearly?year=2025` - รายได้รายปี
- `GET /api/reports/bookings/summary` - สรุปการจอง
- `GET /api/reports/products/sales` - ยอดขายสินค้า
- `GET /api/reports/courts/usage` - การใช้งานสนาม

**Tasks**:
- [ ] สร้าง Reports routes
- [ ] สร้าง MongoDB aggregation queries
- [ ] ทดสอบ API

---

### 7.2 Frontend - Reports Page
**ไฟล์**: `frontend/src/pages/admin/ReportsPage.jsx`

**Features**:
- กราฟรายได้ (Line/Bar chart)
- สรุปการจอง (Pie chart)
- ยอดขายสินค้า Top 10
- สถิติการใช้สนามแต่ละสนาม
- Date range picker
- Export รายงาน (CSV/PDF)

**Tasks**:
- [ ] สร้างหน้า Reports
- [ ] สร้าง Revenue Charts (recharts)
- [ ] สร้าง Booking Summary Chart
- [ ] สร้าง Product Sales Table
- [ ] สร้าง Court Usage Stats
- [ ] สร้าง Export function
- [ ] เพิ่มใน main menu

**🎯 Milestone**: Reports & Analytics พร้อมใช้งานครบ 100%

---

## **PHASE 8: Enhancement & Polish** ✨
> ระยะเวลา: 1 วัน | ความสำคัญ: ต่ำ

### Tasks
- [ ] เพิ่ม Loading states ทุกหน้า
- [ ] เพิ่ม Error handling และ Error boundaries
- [ ] เพิ่ม Toast notifications (success/error)
- [ ] ปรับปรุง Mobile responsiveness
- [ ] เพิ่ม Keyboard shortcuts
- [ ] เพิ่ม Print styles สำหรับ Receipt/Report
- [ ] Optimize performance (lazy loading, code splitting)
- [ ] เขียน API documentation (Swagger/Postman)
- [ ] เพิ่ม Help tooltips/ออนไลน์ช่วยเหลือ
- [ ] Security audit
- [ ] Final testing

**🎯 Milestone**: ระบบพร้อมใช้งานจริง Production-ready!

---

## 📦 ลำดับการพัฒนาที่แนะนำ (Revised)

### สัปดาห์ที่ 1: Foundation + Core Bookings
**Day 1**: Phase 1 - Settings System (Backend ✅ + Frontend)
**Day 2**: Phase 2 - Court Management (Full-stack)
**Day 3**: Phase 3 - Time Slot & Pricing (Full-stack)
**Day 4-5**: Phase 4.1-4.2 - Booking API + Calendar (Backend + บางส่วน Frontend)
**Day 6**: Phase 4.3 - Booking Management (Frontend)
**Day 7**: Testing Phase 1-4

### สัปดาห์ที่ 2: Advanced Features
**Day 1-2**: Phase 5 - Group Play System (Full-stack)
**Day 3-4**: Phase 6 - POS & Products (Full-stack)
**Day 5**: Phase 7 - Reports & Analytics (Full-stack)
**Day 6**: Phase 8 - Enhancement & Polish
**Day 7**: Final Testing + Bug Fixes

---

## 🎯 Milestones

- **Milestone 1** (Day 3): Settings, Courts, TimeSlots พร้อมใช้งาน 100% ✅ **COMPLETED**
- **Milestone 2** (Day 7): Booking System ใช้งานได้เต็มรูปแบบ ✅ **COMPLETED**
- **Milestone 3** (Week 2 Day 2): Group Play พร้อมใช้งาน ⏳ **NEXT**
- **Milestone 4** (Week 2 Day 5): ระบบครบทุกฟีเจอร์
- **Milestone 5** (Week 2 Day 7): Production Ready!

---

## 📝 หมายเหตุ

### Priority
- 🔴 สูงสุด: Settings, Courts, TimeSlots, Bookings
- 🟡 สูง: Group Play
- 🟢 ปานกลาง: POS, Products
- 🔵 ต่ำ: Reports, Enhancement

### ข้อควรระวัง
1. **Time Zone**: ใช้ date-fns หรือ dayjs สำหรับจัดการเวลา
2. **Validation**: Validate ทั้ง frontend และ backend
3. **Real-time**: พิจารณาใช้ Socket.io สำหรับ Group Play (optional)
4. **Mobile**: ออกแบบให้ responsive ตั้งแต่เริ่ม
5. **Testing**: ทดสอบ integration ทันทีที่ทำ full-stack feature เสร็จ

### เทคโนโลยีเพิ่มเติมที่แนะนำ
- **Forms**: react-hook-form + zod validation
- **State**: Zustand หรือ Context API
- **Charts**: recharts
- **Calendar**: react-calendar
- **Date**: date-fns
- **Table**: TanStack Table
- **Notifications**: react-hot-toast
- **Print**: react-to-print
- **Export**: xlsx, jspdf

---

**หมายเหตุ**: แผนใหม่นี้เน้นการทำ Full-Stack Feature ทีละฟีเจอร์ เพื่อให้สามารถทดสอบและใช้งานได้ทันที ไม่ต้องรอทำ Backend ทั้งหมดก่อน
