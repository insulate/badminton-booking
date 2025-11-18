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

### 📊 สถิติ
- **Backend APIs**: 19/40+ endpoints (Settings: 8, Courts: 5, Users: 4, Auth: 2)
- **Frontend Pages**: 11/12+ pages (Settings: 5, Courts: 3, Users: 1, Dashboard: 1, Login: 1)
- **Database Models**: 3/8 models (User, Setting, Court)
- **Progress**: ~40%

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
> ระยะเวลา: 1 วัน | ความสำคัญ: สูง | Full-Stack Feature

### 3.1 Backend - Time Slots API
**ไฟล์**:
- `backend/models/timeslot.model.js`
- `backend/routes/timeslots.routes.js`
- `backend/seeders/timeslots.seeder.js`

**Schema**:
```javascript
{
  startTime: String,       // "06:00"
  endTime: String,         // "07:00"
  dayType: String,         // "weekday", "weekend", "holiday"
  pricing: {
    normal: Number,        // ราคาสนามปกติ
    member: Number,        // ราคาสมาชิก
    walkIn: Number,        // ราคา Walk-in
  },
  peakHour: Boolean,       // ช่วงเวลา Peak
  status: String,          // "active", "inactive"
}
```

**API Endpoints**: 6 endpoints
- `GET /api/timeslots` - ดูช่วงเวลาทั้งหมด
- `GET /api/timeslots/active` - ดูช่วงเวลาที่เปิดใช้งาน
- `POST /api/timeslots` - เพิ่มช่วงเวลาใหม่
- `PUT /api/timeslots/:id` - แก้ไขช่วงเวลา
- `PATCH /api/timeslots/:id/pricing` - แก้ไขราคาเฉพาะ
- `DELETE /api/timeslots/:id` - ลบช่วงเวลา

**Tasks**:
- [ ] สร้าง TimeSlot Model
- [ ] สร้าง TimeSlots API routes
- [ ] สร้าง default timeslots seeder (06:00-22:00)
- [ ] เพิ่ม validation (เวลาไม่ซ้อนทับกัน)
- [ ] ทดสอบ API

---

### 3.2 Frontend - Time Slot Management
**ไฟล์**:
- `frontend/src/pages/admin/settings/TimeSlotsPage.jsx`
- `frontend/src/components/timeslots/TimeSlotTable.jsx`
- `frontend/src/components/timeslots/TimeSlotModal.jsx`

**Features**:
- Table แสดงช่วงเวลาและราคา
- แยกแสดงตาม weekday/weekend/holiday
- แสดง Peak hours (highlight)
- Quick edit pricing (inline edit)
- Bulk operations (เปิด/ปิดหลายช่วงเวลา)

**Tasks**:
- [ ] สร้าง TimeSlotsPage
- [ ] สร้าง TimeSlotTable grouped by dayType
- [ ] สร้าง TimeSlotModal (with pricing form)
- [ ] Quick edit inline สำหรับราคา
- [ ] Integrate กับ API
- [ ] เพิ่มใน Settings menu

**🎯 Milestone**: Time Slot & Pricing System พร้อมใช้งานครบ 100%

---

## **PHASE 4: Booking System** 📅
> ระยะเวลา: 2 วัน | ความสำคัญ: สูงสุด | Full-Stack Feature

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
- [ ] สร้าง Booking Model
- [ ] สร้าง Booking API routes
- [ ] สร้าง booking validation middleware
- [ ] สร้าง availability check logic
- [ ] สร้าง price calculation logic
- [ ] สร้าง booking code generator
- [ ] ทดสอบ API ทุก endpoint

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
- [ ] สร้าง BookingPage
- [ ] สร้าง BookingCalendar component
- [ ] สร้าง CourtScheduleGrid component
- [ ] สร้าง BookingForm component
- [ ] สร้าง Price Calculator
- [ ] Integrate กับ Bookings API
- [ ] เพิ่มใน main menu

---

### 4.3 Frontend - Booking Management
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
- Export รายงาน

**Tasks**:
- [ ] สร้าง BookingsPage
- [ ] สร้าง BookingsTable component
- [ ] สร้าง BookingFilters component
- [ ] สร้าง Search functionality
- [ ] สร้าง Quick Action buttons
- [ ] สร้าง BookingDetailModal
- [ ] Integrate กับ Bookings API
- [ ] เพิ่มใน main menu

**🎯 Milestone**: Booking System พร้อมใช้งานครบ 100%

---

## **PHASE 5: Group Play System** 👥
> ระยะเวลา: 2 วัน | ความสำคัญ: ปานกลาง | Full-Stack Feature

### 5.1 Backend - Group Play API
**ไฟล์**:
- `backend/models/groupplay.model.js`
- `backend/routes/groupplay.routes.js`

**Schema**:
```javascript
{
  sessionName: String,
  court: ObjectId (ref: Court),
  date: Date,
  startTime: String,
  endTime: String,
  maxPlayers: Number,
  currentPlayers: [{
    name: String,
    phone: String,
    level: String,        // "beginner", "intermediate", "advanced"
    checkedIn: Boolean,
    gamesPlayed: Number,
  }],
  queue: [PlayerId],
  currentGames: [{
    court: Number,
    players: [PlayerId],
    startTime: Date,
  }],
  matchingMode: String,   // "fifo", "skill-based", "random"
  rotationMode: String,   // "winner-stays", "all-rotate"
  status: String,         // "scheduled", "active", "completed"
}
```

**API Endpoints**: 10+ endpoints
- `GET /api/groupplay` - ดู Session ทั้งหมด
- `POST /api/groupplay` - สร้าง Session ใหม่
- `POST /api/groupplay/:id/register` - ลงทะเบียนผู้เล่น
- `PATCH /api/groupplay/:id/checkin/:playerId` - Check-in ผู้เล่น
- `PATCH /api/groupplay/:id/start` - เริ่ม Session
- `GET /api/groupplay/:id/queue` - ดูคิว
- `POST /api/groupplay/:id/match` - จับคู่ผู้เล่นอัตโนมัติ
- `PATCH /api/groupplay/:id/finish-game` - จบเกม (update queue)
- `PATCH /api/groupplay/:id/end` - จบ Session
- `DELETE /api/groupplay/:id` - ลบ Session

**Logic**:
- จัดการคิว (FIFO / Skill-based)
- จับคู่ผู้เล่น (singles/doubles)
- หมุนเวียน (winner stays / all rotate)
- นับเกมที่เล่นของแต่ละคน

**Tasks**:
- [ ] สร้าง GroupPlay Model
- [ ] สร้าง API routes
- [ ] สร้าง queue management logic
- [ ] สร้าง matching algorithm
- [ ] ทดสอบ API

---

### 5.2 Frontend - Group Play
**ไฟล์**:
- `frontend/src/pages/admin/GroupPlayPage.jsx`
- `frontend/src/components/groupplay/SessionCard.jsx`
- `frontend/src/components/groupplay/PlayerRegistrationForm.jsx`
- `frontend/src/components/groupplay/QueueDisplay.jsx`
- `frontend/src/components/groupplay/CurrentGamesGrid.jsx`
- `frontend/src/components/groupplay/PlayerList.jsx`

**Features**:
- สร้าง/เลือก Session
- เพิ่มผู้เล่นเข้าคิว (ชื่อ, เบอร์, ระดับ)
- Check-in ผู้เล่น
- จับคู่อัตโนมัติ (คลิกปุ่มเดียว)
- บันทึกผลแพ้ชนะ (จบเกม)
- แสดงสถิติผู้เล่น (เล่นไปกี่เกม)

**Tasks**:
- [ ] สร้าง GroupPlayPage
- [ ] สร้าง SessionCard component
- [ ] สร้าง PlayerRegistrationForm component
- [ ] สร้าง QueueDisplay component (real-time)
- [ ] สร้าง CurrentGamesGrid component
- [ ] สร้าง PlayerList component
- [ ] สร้าง Matching Button (จับคู่)
- [ ] Integrate กับ API
- [ ] เพิ่มใน main menu

**🎯 Milestone**: Group Play System พร้อมใช้งานครบ 100%

---

## **PHASE 6: POS & Products** 🛒
> ระยะเวลา: 1-2 วัน | ความสำคัญ: ปานกลาง | Full-Stack Feature

### 6.1 Backend - Products & Sales API
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
  price: {
    normal: Number,
    member: Number,
  },
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

### 6.2 Frontend - Product Management
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

### 6.3 Frontend - POS Page
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

- **Milestone 1** (Day 3): Settings, Courts, TimeSlots พร้อมใช้งาน 100%
- **Milestone 2** (Day 7): Booking System ใช้งานได้เต็มรูปแบบ
- **Milestone 3** (Week 2 Day 2): Group Play พร้อมใช้งาน
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
