# 📋 TODO List - ระบบจองสนามแบดมินตัน
### แผนการพัฒนาแบบ Frontend + Backend ไปพร้อมกัน

> **หลักการ:** พัฒนาทีละ Feature ให้สมบูรณ์ (Backend API + Frontend UI) เพื่อให้ส่งอัพเดตให้ลูกค้าดูได้ตลอดเวลา

---

## ✅ Sprint 0: Project Setup (เสร็จแล้ว)
- [x] ติดตั้ง Express backend
- [x] ติดตั้ง Vite React frontend
- [x] ตั้งค่า Monorepo
- [x] ติดตั้ง MongoDB dependencies
- [x] สร้าง database config
- [x] ตั้งค่า CORS

**Progress:** 100% | **Demo:** พร้อมรัน dev server

---

## 🎯 Sprint 1: Authentication System (ระบบล็อกอิน)
> **เป้าหมาย:** มีหน้า Login ที่ใช้งานได้จริง เชื่อมต่อ Backend

### Backend Tasks
- [x] สร้าง User Model ✅
  - schema: username, name, password, phone, role, membershipType
  - **ใช้ username แทน email ในการ login**
  - password hashing ด้วย bcryptjs
  - JWT token generation
  - ไฟล์: `backend/models/User.js`

- [x] สร้าง Auth Middleware ✅
  - verify JWT token
  - protect routes
  - authorize by role
  - ไฟล์: `backend/middleware/auth.js`

- [x] สร้าง Auth Routes `/api/auth` ✅
  - POST `/login` - เข้าสู่ระบบ (ใช้ username + password)
  - GET `/profile` - ดูข้อมูลผู้ใช้
  - PUT `/profile` - อัพเดทข้อมูล
  - POST `/change-password` - เปลี่ยนรหัสผ่าน
  - ไฟล์: `backend/routes/auth.js`, `backend/controllers/authController.js`

- [x] สร้างผู้ใช้ Admin เริ่มต้น ✅
  - username: admin
  - password: admin123
  - Script: `backend/scripts/createAdmin.js`
  - เชื่อมต่อ MongoDB Atlas สำเร็จ

### Frontend Tasks
- [x] ติดตั้ง dependencies ✅
  - react-router-dom
  - axios
  - zustand
  - react-hot-toast

- [x] ตั้งค่า Tailwind CSS ✅
  - tailwind.config.js
  - postcss.config.js
  - color scheme (Blue, Green, Red, Yellow)

- [x] สร้าง API Service ✅
  - services/api.js (Axios instance with interceptors)
  - services/authService.js (login, logout, profile)

- [x] สร้าง Auth Store (Zustand) ✅
  - store/authStore.js
  - login, logout, updateProfile state management

- [x] สร้าง Login Page ✅
  - LoginPage.jsx พร้อม beautiful Tailwind UI
  - Gradient background (blue-400 to blue-500)
  - Badminton-themed background pattern (🏸)
  - ปุ่มกรอกข้อมูลทดสอบอัตโนมัติ
  - เชื่อมต่อ API สำเร็จ
  - บันทึก JWT token
  - redirect หลัง login

- [x] สร้าง Dashboard Page ✅
  - Dashboard.jsx พร้อม Navbar
  - แสดงข้อมูลผู้ใช้
  - Stats cards (placeholder)
  - Logout functionality

- [x] สร้าง Protected Routes ✅
  - ProtectedRoute component
  - PublicRoute component
  - Auto redirect based on auth state

### Testing Sprint 1
- [x] ทดสอบ Login API ✅
- [x] ทดสอบหน้า Login ใช้งานได้ ✅
- [x] ทดสอบ redirect หลัง login ✅
- [x] ทดสอบ Logout ✅
- [x] ทดสอบด้วย Playwright MCP ✅

**Progress:** 100% ✅ | **Demo:** พร้อมนำเสนอลูกค้า!

### 📝 สถานะปัจจุบัน (Updated: 2024-11-12)
- ✅ **Backend Authentication API พร้อมใช้งาน 100%**
  - User Model with username-based login
  - JWT Authentication & Authorization
  - Auth endpoints: login, profile, change-password
  - CORS configured for frontend
  - MongoDB Atlas connected (dev_badminton database)
  - Admin user created successfully

- ✅ **Frontend Authentication UI เสร็จสมบูรณ์ 100%**
  - ✅ Tailwind CSS v3 configured with custom colors
  - ✅ Beautiful Login Page with badminton-themed background
  - ✅ Auto-fill demo credentials button
  - ✅ Dashboard with user info and logout
  - ✅ Protected and Public routes
  - ✅ Toast notifications
  - ✅ Axios interceptors for token management
  - ✅ Zustand state management
  - ✅ Tested with Playwright MCP - all working!

- ⏸️ **MongoDB รอติดตั้ง**
  - Admin user script พร้อมแล้ว: `npm run create-admin`
  - จะรันได้เมื่อ MongoDB พร้อม

---

## 📊 Sprint 2: Dashboard (หน้าแรก) ✅
> **เป้าหมาย:** Dashboard แสดงภาพรวมระบบ พร้อมข้อมูลสถิติ

### Backend Tasks
- [x] สร้าง Court Model
  - courtNumber, name, type, status, description
  - ✅ พร้อม validation, indexes, และ methods

- [x] สร้าง TimeSlot Model
  - startTime, endTime, dayType, pricing, peakHour
  - ✅ พร้อม virtual fields และ time validation

- [x] สร้าง Booking Model (พื้นฐาน)
  - bookingCode, court, customer, date, timeSlot, price, status
  - ✅ พร้อม auto-generate booking code และ revenue calculation

- [x] สร้าง Setting Model
  - venue info, operating hours
  - ✅ Single document pattern พร้อม price calculation methods

- [x] สร้าง Dashboard Routes `/api/dashboard`
  - GET `/stats` - สถิติภาพรวม ✅
  - GET `/revenue/:period` - รายได้แยกตามช่วงเวลา (today/week/month/year) ✅
  - GET `/bookings/today` - การจองวันนี้ ✅
  - GET `/bookings/recent` - การจองล่าสุด ✅
  - GET `/courts/status` - สถานะสนามแบบเรียลไทม์ ✅
  - GET `/bookings/stats` - สถิติการจองตาม status ✅

- [x] สร้างข้อมูล Seed
  - 8 สนาม (Court 1-8) ✅
  - 16 ช่วงเวลา (06:00-22:00) ✅
  - 20 การจองตัวอย่าง ✅
  - Settings เริ่มต้น ✅
  - 6 users (1 admin + 5 members) ✅
  - รันได้ด้วย `npm run seed`

### Frontend Tasks
- [x] สร้าง Dashboard Service
  - services/dashboardService.js ✅
  - เชื่อมต่อกับ Dashboard API ทั้งหมด

- [x] สร้าง Reusable Components
  - components/Card.jsx ✅
  - components/Badge.jsx (รองรับ status variants) ✅
  - components/Loading.jsx ✅

- [x] สร้าง Dashboard Page
  - pages/Dashboard.jsx ✅
  - Card รายได้วันนี้ ✅
  - Card การจองวันนี้ ✅
  - Card สนามว่าง ✅
  - Card รอดำเนินการ ✅
  - ตารางสถานะสนาม (8 สนาม) ✅
  - ตารางการจองวันนี้ ✅
  - Loading states ✅

- [x] ตั้งค่า Routing
  - `/` -> Dashboard (Protected) ✅
  - `/login` -> Login (Public) ✅

### Testing Sprint 2
- [x] ทดสอบ Dashboard APIs ✅
- [x] ทดสอบหน้า Dashboard แสดงข้อมูลถูกต้อง ✅
- [x] ทดสอบ loading states ✅
- [x] ทดสอบด้วย Playwright MCP ✅

**Progress:** 100% ✅ | **Demo:** Dashboard แสดงข้อมูลเรียลไทม์จากฐานข้อมูล MongoDB Atlas

### 🎉 Sprint 2 เสร็จสมบูรณ์!
- Login: `admin` / `admin123`
- Dashboard แสดงสถิติ 4 แบบ
- แสดงสถานะสนามทั้ง 8 สนามพร้อม badge
- ตารางการจองวันนี้พร้อมข้อมูลครบถ้วน
- Screenshot: `.playwright-mcp/dashboard-working.png`

---

## 🏸 Sprint 3: Booking System (ระบบจองสนาม)
> **เป้าหมาย:** จองสนามได้จริง มีปฏิทิน ตารางสนาม คำนวณราคา

### Backend Tasks
- [ ] อัพเดท Booking Model (เพิ่มฟีเจอร์)
  - payment info
  - customer type (member/guest/walkin)
  - auto-generate booking code

- [ ] สร้าง Booking Routes `/api/bookings`
  - GET `/` - ดูการจองทั้งหมด
  - POST `/` - สร้างการจอง
  - GET `/schedule/daily` - ตารางรายวัน
  - PATCH `/:id/cancel` - ยกเลิกการจอง
  - PATCH `/:id/payment` - อัพเดทการชำระเงิน

- [ ] สร้าง Court Routes `/api/courts`
  - GET `/` - ดูสนามทั้งหมด
  - GET `/available` - ดูสนามว่างตามวันเวลา

- [ ] สร้าง TimeSlot Routes `/api/timeslots`
  - GET `/` - ดูช่วงเวลาทั้งหมด
  - GET `/available` - ช่วงเวลาว่าง

- [ ] Validation & Helpers
  - ตรวจสอบช่วงเวลาซ้ำ
  - คำนวณราคาตามประเภทลูกค้า
  - สร้าง booking code generator

### Frontend Tasks
- [ ] ติดตั้ง dependencies
  - react-calendar
  - moment

- [ ] สร้าง Booking Services
  - services/bookingService.js
  - services/courtService.js

- [ ] สร้าง Booking Store
  - store/bookingStore.js

- [ ] สร้าง Components
  - components/Calendar.jsx
  - components/CourtGrid.jsx (ตารางสนาม)
  - components/BookingForm.jsx
  - components/TimeSlotPicker.jsx

- [ ] สร้าง Booking Page
  - pages/BookingPage.jsx
  - เลือกวันที่จาก Calendar
  - แสดงตารางสนาม (grid layout)
  - Color coding (เขียว=ว่าง, แดง=จอง, เหลือง=รอชำระ)
  - เลือกหลายช่วงเวลา
  - ฟอร์มข้อมูลลูกค้า
  - คำนวณราคารวม
  - ยืนยันการจอง

- [ ] อัพเดท Routing
  - `/booking` -> BookingPage

### Testing Sprint 3
- [ ] ทดสอบ Booking API flow
- [ ] ทดสอบเลือกวันที่ + สนาม
- [ ] ทดสอบการจองซ้ำ (ต้องไม่ได้)
- [ ] ทดสอบคำนวณราคา
- [ ] ทดสอบยืนยันการจอง

**Progress:** 0% | **Demo:** จองสนามได้จริง มี UI สวยงาม

---

## 👥 Sprint 4: Group Play System (ระบบตีก๊วน)
> **เป้าหมาย:** ลงทะเบียนผู้เล่น จัดคิว หมุนเวียนสนาม

### Backend Tasks
- [ ] สร้าง GroupPlay Model
  - session info, courts, players, queue, currentGames, settings

- [ ] สร้าง GroupPlay Routes `/api/groupplay`
  - GET `/` - ดู Session ทั้งหมด
  - POST `/` - สร้าง Session ใหม่
  - POST `/:id/register` - ลงทะเบียนผู้เล่น
  - PATCH `/:id/checkin/:phone` - Check-in
  - GET `/:id/queue` - ดูคิว
  - POST `/:id/match/start` - เริ่มเกม
  - POST `/:id/match/end` - จบเกม
  - PATCH `/:id/shuffle` - จัดคิวใหม่

- [ ] Queue Management Logic
  - ระบบจัดคิวอัตโนมัติ
  - Winner Stays / All Rotate
  - คำนวณเวลารอ

### Frontend Tasks
- [ ] สร้าง GroupPlay Service
  - services/groupPlayService.js

- [ ] สร้าง Components
  - components/PlayerQueue.jsx
  - components/CourtStatus.jsx
  - components/PlayerForm.jsx

- [ ] สร้าง GroupPlay Page
  - pages/GroupPlayPage.jsx
  - แสดง Session ปัจจุบัน
  - ฟอร์มลงทะเบียนผู้เล่น
  - แสดงคิวผู้รอ
  - แสดงสนามที่กำลังเล่น
  - ปุ่มเริ่ม/จบเกม
  - ตั้งค่าการหมุนเวียน

- [ ] อัพเดท Routing
  - `/groupplay` -> GroupPlayPage

### Testing Sprint 4
- [ ] ทดสอบลงทะเบียนผู้เล่น
- [ ] ทดสอบระบบคิว
- [ ] ทดสอบเริ่ม/จบเกม
- [ ] ทดสอบการหมุนเวียน

**Progress:** 0% | **Demo:** ระบบตีก๊วนใช้งานได้ มีคิวอัตโนมัติ

---

## 🛒 Sprint 5: POS System (ระบบขายสินค้า)
> **เป้าหมาย:** ขายสินค้า อาหาร เครื่องดื่ม คำนวณราคา พิมพ์บิล

### Backend Tasks
- [ ] สร้าง Product Model
  - name, category, price, memberPrice, stock, image

- [ ] สร้าง Sale Model
  - saleCode, items, customer, total, payment

- [ ] สร้าง Product Routes `/api/products`
  - GET `/` - ดูสินค้าทั้งหมด
  - POST `/` - เพิ่มสินค้า
  - PUT `/:id` - แก้ไขสินค้า
  - PATCH `/:id/stock` - อัพเดทสต็อก
  - GET `/category/:category` - กรองตามหมวด

- [ ] สร้าง Sale Routes `/api/sales`
  - GET `/` - ประวัติการขาย
  - POST `/` - บันทึกการขาย
  - GET `/:id` - รายละเอียดบิล
  - GET `/daily` - ยอดขายรายวัน

- [ ] สร้างสินค้าตัวอย่าง
  - อุปกรณ์: ลูกแบด, ไม้แบด, เสื้อ, รองเท้า
  - เครื่องดื่ม: น้ำ, กาแฟ, ชา
  - อาหาร: ข้าวกล่อง, ขนม

### Frontend Tasks
- [ ] สร้าง Product/Sale Services
  - services/productService.js
  - services/saleService.js

- [ ] สร้าง Cart Store
  - store/cartStore.js

- [ ] สร้าง Components
  - components/ProductCard.jsx
  - components/Cart.jsx
  - components/CategoryFilter.jsx

- [ ] สร้าง POS Page
  - pages/POSPage.jsx
  - แสดงสินค้าเป็น grid
  - กรองตามหมวดหมู่
  - ค้นหาสินค้า
  - ตะกร้าสินค้า
  - เลือกประเภทลูกค้า (ส่วนลดสมาชิก)
  - เลือกวิธีชำระเงิน
  - ยืนยันการขาย

- [ ] อัพเดท Routing
  - `/pos` -> POSPage

### Testing Sprint 5
- [ ] ทดสอบเพิ่มสินค้าลงตะกร้า
- [ ] ทดสอบคำนวณราคา + ส่วนลด
- [ ] ทดสอบการขาย
- [ ] ทดสอบอัพเดทสต็อก

**Progress:** 0% | **Demo:** POS ขายสินค้าได้ มีตะกร้า

---

## ⚙️ Sprint 6: Admin Settings (ตั้งค่าระบบ)
> **เป้าหมาย:** Admin จัดการสนาม ช่วงเวลา ราคา สินค้า ได้เอง

### Backend Tasks
- [ ] อัพเดท Court Routes (เพิ่ม CRUD)
  - POST `/` - เพิ่มสนาม (Admin)
  - PUT `/:id` - แก้ไขสนาม
  - DELETE `/:id` - ลบสนาม
  - PATCH `/:id/status` - เปลี่ยนสถานะ

- [ ] อัพเดท TimeSlot Routes (เพิ่ม CRUD)
  - POST `/` - เพิ่มช่วงเวลา
  - PUT `/:id` - แก้ไขราคา
  - DELETE `/:id` - ลบช่วงเวลา

- [ ] สร้าง Setting Routes `/api/settings`
  - GET `/` - ดูการตั้งค่า
  - PUT `/` - อัพเดทการตั้งค่า
  - PATCH `/venue` - อัพเดทข้อมูลสนาม
  - PATCH `/operating` - อัพเดทเวลาทำการ

- [ ] Role-based Access Control
  - เฉพาะ Admin เท่านั้น

### Frontend Tasks
- [ ] สร้าง Setting Service
  - services/settingService.js

- [ ] สร้าง Components
  - components/Table.jsx
  - components/Modal.jsx
  - components/Input.jsx
  - components/Select.jsx
  - components/Button.jsx

- [ ] สร้าง Admin Settings Page (Tabs)
  - pages/AdminSettings.jsx

  - **Tab 1: จัดการสนาม**
    - ตารางแสดงสนาม
    - Modal เพิ่ม/แก้ไข/ลบ

  - **Tab 2: ช่วงเวลา & ราคา**
    - ตารางช่วงเวลา
    - ตั้งราคา (ปกติ/สมาชิก/Walk-in)
    - กำหนด Peak Hour

  - **Tab 3: ข้อมูลสนาม**
    - ฟอร์มแก้ไขข้อมูล
    - เวลาเปิด-ปิด
    - วันทำการ

  - **Tab 4: จัดการสินค้า**
    - ตารางสินค้า
    - Modal เพิ่ม/แก้ไข/ลบ
    - จัดการสต็อก

- [ ] อัพเดท Routing
  - `/admin` -> AdminSettings

### Testing Sprint 6
- [ ] ทดสอบเพิ่ม/แก้ไข/ลบ สนาม
- [ ] ทดสอบตั้งราคาช่วงเวลา
- [ ] ทดสอบแก้ไขข้อมูลสนาม
- [ ] ทดสอบจัดการสินค้า

**Progress:** 0% | **Demo:** Admin ตั้งค่าระบบได้ครบ

---

## 📈 Sprint 7: Reports & Polish (รายงานและปรับปรุง)
> **เป้าหมาย:** รายงานรายได้ การจอง ปรับแต่ง UI/UX

### Backend Tasks
- [ ] สร้าง Report Routes `/api/reports`
  - GET `/revenue/daily` - รายได้รายวัน
  - GET `/revenue/monthly` - รายได้รายเดือน
  - GET `/bookings` - รายงานการจอง
  - GET `/sales` - รายงานการขาย
  - GET `/groupplay` - รายงาน Group Play

- [ ] Export Functions
  - Export to JSON
  - Generate summary stats

### Frontend Tasks
- [ ] สร้าง Reports Page
  - pages/ReportsPage.jsx
  - เลือกช่วงวันที่
  - แสดงกราฟรายได้
  - ตารางรายงาน
  - ปุ่ม Export

- [ ] UI/UX Polish
  - เพิ่ม loading states ทุกหน้า
  - เพิ่ม error handling
  - เพิ่ม toast notifications
  - ปรับ responsive design
  - เพิ่ม animations

- [ ] อัพเดท Routing
  - `/reports` -> ReportsPage

### Testing Sprint 7
- [ ] ทดสอบรายงานทุกประเภท
- [ ] ทดสอบ Export
- [ ] ทดสอบทุกหน้าบน mobile
- [ ] ทดสอบ error cases

**Progress:** 0% | **Demo:** ระบบสมบูรณ์พร้อมใช้งาน

---

## 🚀 Sprint 8: Final Testing & Deployment
> **เป้าหมาย:** ระบบพร้อม Deploy จริง

### Tasks
- [ ] Integration Testing ทั้งระบบ
- [ ] Performance Testing
- [ ] Security Check
  - SQL Injection
  - XSS
  - CSRF
  - JWT expiration

- [ ] Documentation
  - อัพเดท README.md
  - API Documentation
  - User Manual (คู่มือการใช้งาน)

- [ ] Environment Setup
  - .env.example สำหรับ backend
  - .env.example สำหรับ frontend
  - ตรวจสอบ .gitignore

- [ ] Build & Deploy Preparation
  - ทดสอบ `npm run build`
  - ทดสอบ production mode
  - สร้าง deployment scripts

**Progress:** 0% | **Demo:** ระบบพร้อม Deploy

---

## 📊 Overall Progress Tracking

| Sprint | Feature | Backend | Frontend | Status |
|--------|---------|---------|----------|--------|
| 0 | Project Setup | ✅ 100% | ✅ 100% | ✅ เสร็จ |
| 1 | Authentication | ✅ 100% | 🔄 25% | 🔄 กำลังทำ |
| 2 | Dashboard | ⏳ 0% | ⏳ 0% | 🔄 รอทำ |
| 3 | Booking System | ⏳ 0% | ⏳ 0% | 🔄 รอทำ |
| 4 | Group Play | ⏳ 0% | ⏳ 0% | 🔄 รอทำ |
| 5 | POS System | ⏳ 0% | ⏳ 0% | 🔄 รอทำ |
| 6 | Admin Settings | ⏳ 0% | ⏳ 0% | 🔄 รอทำ |
| 7 | Reports | ⏳ 0% | ⏳ 0% | 🔄 รอทำ |
| 8 | Deployment | ⏳ 0% | ⏳ 0% | 🔄 รอทำ |

**Overall Progress:** 19% (1.5/8 sprints completed)

### 🎯 Sprint 1 Progress Details:
- ✅ Backend: User Model, Auth Middleware, Auth Controllers, Auth Routes
- ✅ Frontend: Dependencies installed
- 🔄 Frontend: กำลังติดตั้ง Tailwind CSS
- ⏳ Frontend: รอสร้าง Login Page
- ⏸️ MongoDB: รอติดตั้ง (Admin user script พร้อมแล้ว)

---

## 🎯 Current Sprint: Sprint 1 (Authentication)
**Next Steps:**
1. ✅ ~~สร้าง User Model (Backend)~~ - เสร็จแล้ว
2. ✅ ~~สร้าง Auth Routes (Backend)~~ - เสร็จแล้ว
3. 🔄 ติดตั้ง Tailwind CSS (Frontend) - กำลังทำ
4. ⏳ สร้าง Login Page (Frontend)
5. ⏳ สร้าง Layout Components
6. ⏳ ทดสอบระบบ Login

**Backend API Endpoints พร้อมใช้งาน:**
- POST `/api/auth/login` - เข้าสู่ระบบ (username + password)
- GET `/api/auth/profile` - ดูข้อมูลผู้ใช้ (ต้อง JWT token)
- PUT `/api/auth/profile` - อัพเดทข้อมูล
- POST `/api/auth/change-password` - เปลี่ยนรหัสผ่าน

---

## 🔮 Future Enhancements (หลัง Sprint 8)

- [ ] ระบบสมาชิกและสะสมแต้ม
- [ ] Payment Gateway (Stripe, PayPal, PromptPay)
- [ ] Line Notification
- [ ] QR Code Check-in
- [ ] Mobile App (React Native)
- [ ] ระบบ Tournament
- [ ] Advanced Analytics
- [ ] ระบบเช่าอุปกรณ์
- [ ] Social Media Integration

---

**Last Updated:** 2024-11-12
**Version:** 1.0.0
**Total Sprints:** 8
**Estimated Timeline:** 8-10 สัปดาห์
