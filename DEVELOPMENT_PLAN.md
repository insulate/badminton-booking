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

### 📊 สถิติ
- **Backend APIs**: 6/30+ endpoints
- **Frontend Pages**: 3/10+ pages
- **Database Models**: 1/8 models
- **Progress**: ~15%

---

## 🚀 แผนการพัฒนา (Development Roadmap)

## **PHASE 1: Core Settings & Court Management** 🏗️
> ระยะเวลา: 2-3 วัน | ความสำคัญ: สูงสุด

### 1.1 Backend - Settings System
**ไฟล์**: `backend/models/setting.model.js`
```javascript
Schema: {
  venue: { name, address, phone, email },
  operating: { openTime, closeTime, daysOpen[] },
  booking: { advanceBookingDays, minBookingHours, etc. },
  payment: { acceptCash, acceptTransfer, etc. }
}
```

**API Routes**: `backend/routes/settings.routes.js`
- `GET /api/settings` - ดูการตั้งค่าทั้งหมด
- `PUT /api/settings` - อัพเดทการตั้งค่าทั้งหมด
- `PATCH /api/settings/:section` - อัพเดทเฉพาะส่วน

**Seeder**: `backend/seeders/settings.seeder.js`

**Tasks**:
- [x] สร้าง Setting Model
- [x] สร้าง Settings API routes
- [x] สร้าง default settings seeder
- [x] ทดสอบ API ด้วย Postman/Thunder Client

---

### 1.2 Backend - Court Management
**ไฟล์**: `backend/models/court.model.js`
```javascript
Schema: {
  courtNumber: String,    // "C01", "C02"
  name: String,           // "Court 1"
  type: String,           // normal/premium/tournament
  status: String,         // available/maintenance/inactive
  description: String
}
```

**API Routes**: `backend/routes/courts.routes.js`
- `GET /api/courts` - ดูสนามทั้งหมด
- `POST /api/courts` - เพิ่มสนามใหม่
- `PUT /api/courts/:id` - แก้ไขสนาม
- `DELETE /api/courts/:id` - ลบสนาม

**Seeder**: `backend/seeders/courts.seeder.js`

**Tasks**:
- [ ] สร้าง Court Model
- [ ] สร้าง Courts API routes
- [ ] เพิ่ม validation (unique courtNumber)
- [ ] ทดสอบ API

---

### 1.3 Backend - Time Slot Management
**ไฟล์**: `backend/models/timeslot.model.js`
```javascript
Schema: {
  startTime: String,      // "06:00"
  endTime: String,        // "07:00"
  dayType: String,        // weekday/weekend/holiday
  pricing: {
    normal: Number,
    member: Number,
    walkIn: Number
  },
  peakHour: Boolean,
  status: String          // active/inactive
}
```

**API Routes**: `backend/routes/timeslots.routes.js`
- `GET /api/timeslots` - ดูช่วงเวลาทั้งหมด
- `POST /api/timeslots` - เพิ่มช่วงเวลาใหม่
- `PUT /api/timeslots/:id` - แก้ไขช่วงเวลา
- `DELETE /api/timeslots/:id` - ลบช่วงเวลา
- `GET /api/timeslots/active` - ดูช่วงเวลาที่เปิดใช้งาน

**Seeder**: `backend/seeders/timeslots.seeder.js`

**Tasks**:
- [ ] สร้าง TimeSlot Model
- [ ] สร้าง TimeSlots API routes
- [ ] เพิ่ม validation (เวลาไม่ซ้อนทับกัน)
- [ ] ทดสอบ API

---

### 1.4 Frontend - Settings Page
**ไฟล์**:
- `frontend/src/pages/admin/settings/SettingsOverview.jsx`
- `frontend/src/pages/admin/settings/VenueSettings.jsx`
- `frontend/src/pages/admin/settings/OperatingHours.jsx`
- `frontend/src/pages/admin/settings/PaymentSettings.jsx`

**Features**:
- Tab-based settings interface
- Form validation
- Real-time preview
- Save confirmation

**Tasks**:
- [ ] สร้าง Settings Overview (landing page with cards)
- [ ] สร้างฟอร์มข้อมูลสนาม (Venue Settings)
- [ ] สร้างฟอร์มเวลาทำการ (Operating Hours)
- [ ] สร้างฟอร์มวิธีการชำระเงิน (Payment Settings)
- [ ] Integrate กับ API
- [ ] เพิ่มใน Settings menu accordion

---

### 1.5 Frontend - Court Management
**ไฟล์**: `frontend/src/pages/admin/settings/CourtManagement.jsx`

**Features**:
- Table แสดงรายการสนาม
- Modal สำหรับเพิ่ม/แก้ไขสนาม
- Status toggle (available/maintenance/inactive)
- Search & Filter
- Delete with confirmation

**Components**:
- `CourtTable` - แสดงรายการ
- `CourtModal` - Form เพิ่ม/แก้ไข
- `CourtCard` - Card view (optional)

**Tasks**:
- [ ] สร้างหน้า Court Management
- [ ] สร้าง Court Table with CRUD
- [ ] สร้าง Court Modal
- [ ] Integrate กับ API
- [ ] เพิ่มใน Settings menu

---

### 1.6 Frontend - Time Slot & Pricing
**ไฟล์**: `frontend/src/pages/admin/settings/TimeSlotManagement.jsx`

**Features**:
- Table แสดงช่วงเวลาและราคา
- แยกตาม weekday/weekend/holiday
- แสดง Peak hours
- Quick edit pricing
- Bulk operations

**Tasks**:
- [ ] สร้างหน้า Time Slot Management
- [ ] สร้าง TimeSlot Table
- [ ] สร้าง Pricing Form
- [ ] Integrate กับ API
- [ ] เพิ่มใน Settings menu

---

## **PHASE 2: Booking System** 📅
> ระยะเวลา: 3-4 วัน | ความสำคัญ: สูง

### 2.1 Backend - Booking System
**ไฟล์**: `backend/models/booking.model.js`

**API Routes**: `backend/routes/bookings.routes.js`
- `GET /api/bookings` - ดูการจองทั้งหมด
- `GET /api/bookings/schedule/daily` - ตารางรายวัน
- `POST /api/bookings` - สร้างการจองใหม่
- `PATCH /api/bookings/:id/cancel` - ยกเลิกการจอง
- `PATCH /api/bookings/:id/checkin` - Check-in
- `PATCH /api/bookings/:id/payment` - อัพเดทการชำระเงิน

**Business Logic**:
- ตรวจสอบสนามว่าง
- คำนวณราคาตามช่วงเวลา
- สร้าง booking code อัตโนมัติ
- Validation ไม่ให้จองซ้อน

**Seeder**: `backend/seeders/bookings.seeder.js`

**Tasks**:
- [ ] สร้าง Booking Model
- [ ] สร้าง Booking API routes
- [ ] สร้าง booking validation middleware
- [ ] สร้าง price calculation logic
- [ ] ทดสอบ API

---

### 2.2 Frontend - Booking Calendar
**ไฟล์**: `frontend/src/pages/admin/BookingPage.jsx`

**Components**:
- `BookingCalendar` - ปฏิทินเลือกวัน
- `CourtSchedule` - ตารางสนาม + เวลา
- `BookingForm` - ฟอร์มจอง
- `BookingModal` - รายละเอียดการจอง

**Features**:
- Calendar date picker
- Court availability grid
- Time slot selection
- Customer form
- Price calculation preview
- Payment method selection

**Tasks**:
- [ ] สร้างหน้า Booking
- [ ] สร้าง Calendar component
- [ ] สร้าง Court Schedule grid
- [ ] สร้าง Booking Form
- [ ] Integrate กับ API
- [ ] เพิ่มใน main menu

---

### 2.3 Frontend - Booking Management
**ไฟล์**: `frontend/src/pages/admin/BookingManagement.jsx`

**Features**:
- รายการจองทั้งหมด
- Filter (วันที่, สถานะ, สนาม)
- Search (รหัสจอง, ชื่อ, เบอร์)
- Quick actions (Check-in, Cancel, Payment)
- Export รายงาน

**Tasks**:
- [ ] สร้างหน้า Booking Management
- [ ] สร้าง Booking List Table
- [ ] สร้าง Filter & Search
- [ ] สร้าง Quick Actions
- [ ] เพิ่มใน main menu

---

## **PHASE 3: Group Play System** 👥
> ระยะเวลา: 3-4 วัน | ความสำคัญ: ปานกลาง

### 3.1 Backend - Group Play
**ไฟล์**: `backend/models/groupplay.model.js`

**API Routes**: `backend/routes/groupplay.routes.js`
- `GET /api/groupplay` - ดู Session ทั้งหมด
- `POST /api/groupplay` - สร้าง Session ใหม่
- `POST /api/groupplay/:id/register` - ลงทะเบียนผู้เล่น
- `PATCH /api/groupplay/:id/checkin/:phone` - Check-in ผู้เล่น
- `PATCH /api/groupplay/:id/start` - เริ่ม Session
- `GET /api/groupplay/:id/queue` - ดูคิว
- `PATCH /api/groupplay/:id/match` - จับคู่ผู้เล่น
- `PATCH /api/groupplay/:id/finish-game` - จบเกม

**Logic**:
- จัดการคิว (FIFO / ตามระดับ)
- จับคู่ผู้เล่น (singles/doubles)
- หมุนเวียน (winner stays / all rotate)
- นับเกมที่เล่น

**Tasks**:
- [ ] สร้าง GroupPlay Model
- [ ] สร้าง GroupPlay API routes
- [ ] สร้าง queue management logic
- [ ] สร้าง matching algorithm
- [ ] ทดสอบ API

---

### 3.2 Frontend - Group Play
**ไฟล์**: `frontend/src/pages/admin/GroupPlayPage.jsx`

**Components**:
- `SessionCard` - แสดง session ที่กำลังเล่น
- `PlayerRegistration` - ลงทะเบียนผู้เล่น
- `QueueDisplay` - แสดงคิวรอเล่น
- `CurrentGames` - เกมที่กำลังเล่น
- `PlayerList` - รายชื่อผู้เล่นทั้งหมด

**Features**:
- สร้าง/เลือก Session
- เพิ่มผู้เล่นเข้าคิว
- Check-in ผู้เล่น
- จับคู่อัตโนมัติ
- บันทึกผลแพ้ชนะ
- แสดงสถิติผู้เล่น

**Tasks**:
- [ ] สร้างหน้า Group Play
- [ ] สร้าง Session Management
- [ ] สร้าง Player Registration Form
- [ ] สร้าง Queue Display
- [ ] สร้าง Current Games Grid
- [ ] Integrate กับ API
- [ ] เพิ่มใน main menu

---

## **PHASE 4: POS & Products** 🛒
> ระยะเวลา: 2-3 วัน | ความสำคัญ: ปานกลาง

### 4.1 Backend - Products & Sales
**ไฟล์**:
- `backend/models/product.model.js`
- `backend/models/sale.model.js`

**API Routes**:
- `backend/routes/products.routes.js`
- `backend/routes/sales.routes.js`

**Products API**:
- `GET /api/products` - ดูสินค้าทั้งหมด
- `POST /api/products` - เพิ่มสินค้า
- `PUT /api/products/:id` - แก้ไขสินค้า
- `DELETE /api/products/:id` - ลบสินค้า
- `PATCH /api/products/:id/stock` - อัพเดทสต็อก

**Sales API**:
- `POST /api/sales` - บันทึกการขาย
- `GET /api/sales` - ดูประวัติการขาย
- `GET /api/sales/daily` - รายงานรายวัน
- `GET /api/sales/:id` - ดูรายละเอียดบิล

**Seeder**: `backend/seeders/products.seeder.js`

**Tasks**:
- [ ] สร้าง Product Model
- [ ] สร้าง Sale Model
- [ ] สร้าง Products API routes
- [ ] สร้าง Sales API routes
- [ ] ทดสอบ API

---

### 4.2 Frontend - Product Management
**ไฟล์**: `frontend/src/pages/admin/settings/ProductManagement.jsx`

**Features**:
- รายการสินค้าทั้งหมด
- เพิ่ม/แก้ไข/ลบสินค้า
- จัดหมวดหมู่
- จัดการสต็อก
- ตั้งราคาสมาชิก/ทั่วไป

**Tasks**:
- [ ] สร้างหน้า Product Management
- [ ] สร้าง Product Table
- [ ] สร้าง Product Form Modal
- [ ] Stock Management UI
- [ ] เพิ่มใน Settings menu

---

### 4.3 Frontend - POS Page
**ไฟล์**: `frontend/src/pages/admin/POSPage.jsx`

**Components**:
- `ProductGrid` - กริดสินค้า
- `Cart` - ตะกร้าสินค้า
- `PaymentModal` - ชำระเงิน
- `ReceiptPrint` - พิมพ์ใบเสร็จ

**Features**:
- เลือกสินค้าจาก grid
- คำนวณราคารวม
- เลือกประเภทลูกค้า (สมาชิก/ทั่วไป)
- รวมบิลกับค่าสนาม (optional)
- ชำระเงินหลายช่องทาง
- พิมพ์ใบเสร็จ

**Tasks**:
- [ ] สร้างหน้า POS
- [ ] สร้าง Product Grid
- [ ] สร้าง Shopping Cart
- [ ] สร้าง Payment Modal
- [ ] Integrate กับ API
- [ ] เพิ่มใน main menu

---

## **PHASE 5: Reports & Analytics** 📊
> ระยะเวลา: 2 วัน | ความสำคัญ: ต่ำ

### 5.1 Backend - Reports API
**API Routes**: `backend/routes/reports.routes.js`
- `GET /api/reports/revenue/daily` - รายได้รายวัน
- `GET /api/reports/revenue/monthly` - รายได้รายเดือน
- `GET /api/reports/bookings/summary` - สรุปการจอง
- `GET /api/reports/products/sales` - ยอดขายสินค้า
- `GET /api/reports/courts/usage` - การใช้งานสนาม

**Tasks**:
- [ ] สร้าง Reports API routes
- [ ] สร้าง aggregation queries
- [ ] ทดสอบ API

---

### 5.2 Frontend - Reports Page
**ไฟล์**: `frontend/src/pages/admin/ReportsPage.jsx`

**Features**:
- กราฟรายได้
- สรุปการจอง
- ยอดขายสินค้า
- สถิติการใช้สนาม
- Export รายงาน (PDF/Excel)

**Tasks**:
- [ ] สร้างหน้า Reports
- [ ] สร้าง Charts (recharts)
- [ ] สร้าง Export function
- [ ] เพิ่มใน main menu

---

## **PHASE 6: Enhancement & Polish** ✨
> ระยะเวลา: 1-2 วัน | ความสำคัญ: ต่ำ

### Tasks
- [ ] Add loading states everywhere
- [ ] Add error handling
- [ ] Add success/error notifications (toast)
- [ ] Improve mobile responsiveness
- [ ] Add keyboard shortcuts
- [ ] Add print styles
- [ ] Optimize performance
- [ ] Write API documentation
- [ ] Add inline help/tooltips

---

## 📦 ลำดับการพัฒนาที่แนะนำ

### สัปดาห์ที่ 1
1. ✅ Day 1-2: PHASE 1.1-1.3 (Backend Settings, Courts, TimeSlots)
2. ✅ Day 3-4: PHASE 1.4-1.6 (Frontend Settings, Courts, TimeSlots)
3. ✅ Day 5-7: Testing & Bug fixes Phase 1

### สัปดาห์ที่ 2
1. ✅ Day 1-2: PHASE 2.1 (Backend Booking)
2. ✅ Day 3-4: PHASE 2.2 (Frontend Booking Calendar)
3. ✅ Day 5-6: PHASE 2.3 (Frontend Booking Management)
4. ✅ Day 7: Testing Phase 2

### สัปดาห์ที่ 3
1. ✅ Day 1-2: PHASE 3.1 (Backend Group Play)
2. ✅ Day 3-5: PHASE 3.2 (Frontend Group Play)
3. ✅ Day 6-7: Testing Phase 3

### สัปดาห์ที่ 4
1. ✅ Day 1-2: PHASE 4.1-4.2 (Backend & Frontend Products)
2. ✅ Day 3-4: PHASE 4.3 (Frontend POS)
3. ✅ Day 5-6: PHASE 5 (Reports)
4. ✅ Day 7: PHASE 6 (Polish & Testing)

---

## 🎯 Milestones

- **Milestone 1**: Settings & Courts ระบบพร้อมใช้งาน (Week 1)
- **Milestone 2**: Booking System ใช้งานได้เต็มรูปแบบ (Week 2)
- **Milestone 3**: Group Play พร้อมใช้งาน (Week 3)
- **Milestone 4**: ระบบครบทุกฟีเจอร์ (Week 4)

---

## 📝 หมายเหตุ

### Priority
- 🔴 สูงสุด: Settings, Courts, Booking
- 🟡 สูง: Time Slots, Booking Management
- 🟢 ปานกลาง: Group Play, POS
- 🔵 ต่ำ: Reports, Enhancement

### ข้อควรระวัง
1. **Time Zone**: ใช้ moment.js หรือ date-fns สำหรับจัดการเวลา
2. **Validation**: Validate ทั้ง frontend และ backend
3. **Real-time**: พิจารณาใช้ WebSocket สำหรับ Group Play
4. **Mobile**: ออกแบบให้ responsive ตั้งแต่เริ่ม
5. **Testing**: เขียน test สำหรับ critical paths

### เทคโนโลยีเพิ่มเติมที่อาจใช้
- **Charts**: recharts, chart.js
- **Calendar**: react-big-calendar, fullcalendar
- **Date**: moment.js, date-fns, dayjs
- **Forms**: react-hook-form, formik
- **Table**: react-table, ag-grid
- **Print**: react-to-print
- **Export**: xlsx, jspdf

---

**หมายเหตุ**: แผนนี้สามารถปรับเปลี่ยนได้ตามความเหมาะสม อาจมีการเพิ่ม/ลดฟีเจอร์ หรือปรับลำดับการทำงานตามความต้องการจริง
