# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

## Critical Rules (VERY IMPORTANT)

1. **ห้าม commit เองเด็ดขาด**
   - DO NOT run or suggest:
     - `git commit`
     - `git push`
     - `git rebase`
     - `git reset --hard`
     - หรือคำสั่งที่มีผลกับ history โดยไม่ได้รับคำสั่งชัดเจนจากผู้ใช้
   - ถ้าจำเป็นต้องยกตัวอย่างคำสั่ง git ให้ใส่ใน code block และระบุชัดเจนว่าเป็น "example only"

2. **ภาษาในการสื่อสาร**
   - คำอธิบายทั้งหมด (reasoning, explanation, summary, comments ในข้อความตอบ) ให้ใช้ **ภาษาไทย**
   - ชื่อไฟล์, ชื่อฟังก์ชัน, ตัวแปร, โค้ด, และคอมเมนต์ในโค้ด ใช้ **ภาษาอังกฤษตามมาตรฐานโปรแกรมเมอร์**

3. **แนวทางการแก้ไขโค้ด**
   - ให้เสนอ **แผนการแก้ไขเป็นข้อ ๆ สั้น ๆ** ก่อนลงมือเขียนโค้ด (เช่น bullet list)
   - จำกัดขอบเขตการแก้ไขแต่ละครั้งให้ชัดเจน (ไม่ refactor ใหญ่โดยไม่ได้รับคำสั่ง)
   - ถ้าการแก้ไขส่งผลกระทบหลายไฟล์ ให้ระบุให้ชัดว่าไฟล์ไหนจะถูกแก้ และแก้เรื่องอะไร

4. **Testing / TDD**
   - เมื่อแก้ business logic หรือเพิ่ม feature ใหม่:
     - ควรเพิ่ม/อัปเดต **Jest tests** (backend)
     - ควรเพิ่ม/อัปเดต **Playwright tests** ถ้าเกี่ยวกับ flow การใช้งานจริงของผู้ใช้
   - ถ้าไม่สามารถเขียนเทสได้ ให้ระบุเหตุผลให้ชัดเจน

5. **Clarifying Questions (ถ้าจำเป็น)**
   - ถามสิ่งที่จำเป็นต่อการออกแบบ schema, flow, หรือ constraint ให้ครบ
   - ถ้าข้อมูลพอแล้ว ให้บอกว่าคิดสมมติอะไรเพิ่มเองบ้าง (assumptions)

## Project Overview

Badminton Court Booking System - A monorepo with React frontend and Express backend for managing court bookings, POS sales, group play sessions, shifts, and venue operations.

### Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS (localhost:5173)
- **Backend**: Express.js + MongoDB Atlas + Mongoose (localhost:3000)
- **State Management**: Zustand (authStore)
- **Testing**: Jest (backend), Playwright (E2E)
- **Authentication**: JWT with bcryptjs

## Development Commands

### Running the Application

```bash
# Run both frontend and backend together (from root)
npm run dev

# Run frontend only (from root)
npm run dev:frontend

# Run backend only (from root)
npm run dev:backend

# Run from specific directory
cd frontend && npm run dev
cd backend && npm run dev  # or npm start for production mode
```

### Testing

```bash
# Run all tests (backend + E2E)
npm test

# Backend unit/integration tests (with Jest)
cd backend && npm test
npm run test:watch  # Watch mode

# E2E tests (with Playwright)
cd frontend && npm run test:e2e
npm run test:e2e:ui      # UI mode (รันจาก root ได้เลย — script cd เข้า frontend อัตโนมัติ)
cd frontend && npm run test:e2e:debug   # Debug mode

# Run specific test files
npm test -- auth.test.js
npm run test:e2e -- auth.spec.js
```

> **หมายเหตุ**: Backend Jest tests ต้องการ MongoDB รันที่ `localhost:27017` (local) เพราะใช้ test database แยกต่างหาก ไม่ใช่ Atlas URI จาก `.env` ถ้า local MongoDB ไม่ได้รัน tests จะ timeout

### Database Seeding

```bash
cd backend

# Seed individual collections
npm run seed:users
npm run seed:settings
npm run seed:courts
npm run seed:timeslots

# Seed everything
npm run seed:all
```

### Building

```bash
# Build frontend for production (from root)
npm run build

# Or from frontend directory
cd frontend && npm run build
```

## Architecture

### Backend Structure (`backend/`)

- **app.js** - Express app configuration, CORS, middleware, and route registration
- **bin/www** - Server startup script
- **models/** - Mongoose schemas (see Data Models section)
- **routes/** - API endpoints (see Important API Routes section)
- **controllers/** - Business logic for routes
- **middleware/** - Auth (JWT), booking validation, rate limiting, upload (multer), ObjectId validation
- **utils/availabilityChecker.js** - Core availability logic: `checkAvailability`, `getAvailableCourts`, `getCourtSchedule`, `getAvailabilityByTimeSlot`
- **config/** - Database connection
- **seeders/** - Database seed scripts
- **scripts/** - Utility scripts
- **__tests__/** - Jest test files

### Frontend Structure (`frontend/`)

- **src/App.jsx** - Route definitions using React Router
- **src/pages/** - Page components
  - `LoginPage.jsx` - Public login page
  - `admin/` - Protected admin pages:
    - `DashboardPage.jsx`, `BookingPage.jsx`, `BookingsPage.jsx`
    - `RecurringBookingsPage.jsx` - Manage recurring booking groups (create, view sessions, cancel single session or entire group)
    - `ReportsPage.jsx` - Revenue/booking/product/court usage reports (daily/monthly/yearly tabs)
    - `POSPage.jsx`, `SalesHistoryPage.jsx`
    - `GroupPlayPage.jsx`, `PlayersPage.jsx`
    - `ShiftPage.jsx`, `AttendancePage.jsx`
    - `UserManagementPage.jsx`, `CategoryManagementPage.jsx`
  - `admin/settings/` - Settings pages (Venue, Operating Hours, Booking, Payment, General, Courts, TimeSlots, Products)
- **src/components/** - Reusable components (booking, products, timeslots, layout, common)
- **src/stores/** - Zustand stores (authStore.js)
- **src/lib/api.js** - Axios API client with auth interceptors
- **src/constants/** - API endpoints, routes, and shared constants
- **e2e/** - Playwright E2E tests

### Key Architectural Patterns

**Authentication Flow:**
1. JWT tokens stored in localStorage
2. authStore (Zustand) manages user state
3. ProtectedRoute component guards admin routes
4. API client (lib/api.js) automatically includes Authorization header
5. Backend middleware (middleware/auth.js) validates JWT

**Booking System:**
- Auto-generates booking codes using Counter model
- Validates court availability and time slot conflicts (`middleware/bookingValidation.js`)
- Supports multi-hour bookings with `duration` field (float: 0.5, 1, 1.5, 2, ...)
- Supports half-slot bookings with `startMinute: 0 | 30` — bookings can start at `:00` or `:30` within a 1-hour TimeSlot
- Tracks booking status: `pending`, `confirmed`, `cancelled`, `completed`
- Payment tracking: `unpaid`, `partial`, `paid`
- Soft-delete via `deletedAt` field — queries should include `deletedAt: null` to exclude deleted bookings (except `getBookingsInGroup` which intentionally shows cancelled sessions)

**Recurring Bookings System:**
- `RecurringBookingGroup` model groups multiple `Booking` documents under one `groupCode` (e.g. `RG202605190001`)
- Each booking in the group has `recurringGroupId` pointing back to the group
- Cancel entire group: `PATCH /api/recurring-bookings/:id/cancel` — calls `booking.cancel()` which sets `bookingStatus='cancelled'` AND `deletedAt` (soft-delete)
- Cancel single session: `PATCH /api/recurring-bookings/:groupId/bookings/:bookingId/cancel` — sets only `bookingStatus='cancelled'` without soft-delete, so session remains visible in detail modal and court slot is freed

**Availability Checking:**
- `availabilityChecker.js` filters `bookingStatus: { $ne: 'cancelled' }` AND `deletedAt: null`
- Half-slot tracking uses composite keys: `{slotId}_first` (`:00` half) and `{slotId}_second` (`:30` half)
- Dates stored as UTC midnight Bangkok time — e.g. Bangkok June 4 = `2026-06-03T17:00:00.000Z` in UTC. When constructing date strings for availability checks, convert from UTC+7

**POS System:**
- Sales linked to Categories and Products
- Auto-generates sale codes (S-XXXXX format)
- Tracks inventory changes on product sales
- Payment method options: cash, bank_transfer, promptpay

**Shift System:**
- Staff open/close shifts manually
- Shift summary tracks revenue, expenses, and sales within the shift period

**Group Play System:**
- Ad-hoc group sessions with player check-in, game tracking, and per-player billing
- Players linked via Player model

**File Uploads:**
- Product images: multer middleware (`middleware/upload.js`)
- Stored in `backend/uploads/products/`
- Served at `/uploads/products/` endpoint

**Rate Limiting:**
- Login endpoint: 5 attempts per 15 minutes per IP (development: disabled in `middleware/rateLimiter.js`)

## Production Server

| Item | Value |
|------|-------|
| **IP** | `146.190.97.131` |
| **OS** | Ubuntu 22.04.5 LTS |
| **SSH User** | `root` |
| **SSH Key** | `~/.ssh/id_ed25519_old` |
| **SSH Alias** | `ssh luckybadminton` (configured in `~/.ssh/config`) |
| **Project Path** | `/root/badminton-booking` |
| **Deploy Method** | Docker Compose (`docker-compose.prod.yml`) |

### Domains
- **Frontend**: https://luckybadminton.com (via Cloudflare proxy)
- **API**: https://api.luckybadminton.com → nginx → `badminton-backend:3000`
- **Legacy API**: https://badminton-api.conypetshop.com (nginx config in `/root/badminton-booking/nginx/badminton.conf`)

### Docker Containers
| Container | Image | Role |
|-----------|-------|------|
| `badminton-nginx` | nginx:alpine | Reverse proxy, SSL termination (port 80/443) |
| `badminton-frontend` | badminton-booking-frontend | React app (built from `./frontend`) |
| `badminton-backend` | badminton-booking-backend | Express API (port 3000) |
| `badminton-mongodb` | mongo:7.0 | Database |

### Common Server Commands
```bash
# SSH into server
ssh luckybadminton

# Check container status
docker compose -f docker-compose.prod.yml ps

# View backend logs
docker logs badminton-backend --tail 50

# Rebuild & redeploy frontend (e.g. after code change)
cd /root/badminton-booking
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend

# Rebuild & redeploy backend
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d backend

# Restart all services
docker compose -f docker-compose.prod.yml up -d
```

### DNS (Cloudflare)
- `luckybadminton.com` A record → `146.190.97.131` (Proxied)
- `api.luckybadminton.com` A record → `146.190.97.131` (Proxied)
- `www.luckybadminton.com` CNAME → `luckybadminton.com`

## Environment Configuration

**Backend** requires `.env` file (see `backend/.env.example`):
```env
MONGODB_URI=mongodb+srv://...  # or mongodb://localhost for Docker
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
```

## Testing Notes

- **Jest tests** run with `--runInBand` to prevent DB conflicts
- **Jest tests** require local MongoDB at `localhost:27017` — they use a separate test DB, not the Atlas URI from `.env`
- **Playwright** auto-starts both frontend/backend via webServer config
- E2E tests use `http://localhost:5173` as baseURL
- Test environment uses separate test database (configured in test files)
- **E2E project order**: `setup` (สร้าง admin session) → `admin-authenticated` (รัน tests) → `cleanup` teardown (ล้าง test data จาก DB)
- **E2E test data**: teardown ล้าง 3 ประเภทหลังรันจบ:
  - users ชื่อ `testuser_*` → `DELETE /api/users/:id/permanent` (hard-delete)
  - courts รหัส `TCT*` → `DELETE /api/courts/:id` (soft-delete)
  - players ชื่อ `Test Player *` → `DELETE /api/players/:id`
- **Auth error messages**: login endpoint คืนข้อความภาษาไทย (`'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'`, `'บัญชีนี้ถูกระงับการใช้งาน'`) — E2E tests assert ข้อความเหล่านี้
- **`test.describe.configure()`** ต้องวางไว้ **ข้างใน** describe block เสมอ (ไม่ใช่ top-level) เพราะ `--ui` mode โหลดไฟล์แบบ concurrent — การเรียก top-level จะทำให้ global state ของ Playwright เสียหายและทำให้ไฟล์อื่นใน project เดียวกัน error
- **Settings tests** (เช่น venue) ที่แก้ไขข้อมูล shared — ให้ backup ข้อมูลเดิมใน `beforeAll` และ restore ใน `afterAll` ผ่าน API แทนการใช้ teardown (เพราะ settings ไม่ใช่ test data ที่สร้างขึ้นใหม่)

## Important API Routes

- `POST /api/auth/login` - User authentication
- `GET /api/bookings` - List bookings with filters (date, court, status)
- `POST /api/bookings` - Create booking (auto-generates booking code)
- `POST /api/bookings/check-availability` - Check court availability for a given date/slot/duration
- `GET /api/bookings/public/court-availability` - Get available courts (public, by timeSlotId + date)
- `GET /api/courts` - List courts with availability
- `GET /api/timeslots` - Get time slots with pricing
- `POST /api/sales` - Create POS sale (auto-generates sale code)
- `GET /api/settings` - Get all settings
- `PATCH /api/settings/:key` - Update specific setting
- `POST /api/recurring-bookings/preview` - Preview recurring booking dates and pricing
- `POST /api/recurring-bookings` - Create recurring booking group
- `GET /api/recurring-bookings` - List all recurring booking groups
- `GET /api/recurring-bookings/:id/bookings` - Get all sessions in a group (including cancelled)
- `PATCH /api/recurring-bookings/:id/cancel` - Cancel entire recurring group (soft-delete)
- `PATCH /api/recurring-bookings/:groupId/bookings/:bookingId/cancel` - Cancel single session only (no soft-delete)
- `PATCH /api/recurring-bookings/:id/payment` - Update bulk payment for a group
- `GET /api/reports/revenue/daily` - Daily revenue report
- `GET /api/reports/revenue/monthly` - Monthly revenue report
- `GET /api/reports/bookings/summary` - Booking summary report
- `GET /api/reports/courts/usage` - Court usage report
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/shifts/current` - Get current open shift
- `POST /api/shifts/open` / `POST /api/shifts/:id/close` - Open/close shift
- `GET /api/users` - List users (`?includeDeleted=true` to include soft-deleted)
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user (sets `deletedAt`)
- `PATCH /api/users/:id/restore` - Restore soft-deleted user
- `DELETE /api/users/:id/permanent` - Hard delete user permanently (admin only, used by E2E teardown)

## Data Models

**Core Collections:**
- **User** - username, password (hashed), role (admin/staff)
- **Booking** - bookingCode, customer info, court, date, timeSlot, duration, startMinute (0|30), pricing, bookingStatus (pending/confirmed/cancelled/completed), payment, recurringGroupId, deletedAt (soft-delete)
- **RecurringBookingGroup** - groupCode, customer info, court, timeSlot, startMinute, duration, daysOfWeek, startDate, endDate, totalBookings, cancelledBookings
- **Court** - name, status (active/inactive), description
- **TimeSlot** - startTime, endTime, pricing (weekday/weekend/holiday)
- **Product** - name, SKU, category, price, quantity, image
- **Sale** - saleCode, items[], totalAmount, paymentMethod, paymentStatus
- **Category** - name, type (product/service)
- **Setting** - key-value pairs for system configuration
- **Counter** - Auto-incrementing counters for bookingCode, saleCode, groupCode
- **GroupPlay** - group play session with player list, games, and product purchases
- **Player** - player profile linked to group play sessions
- **Shift** - staff shift with open/close time, expenses, revenue summary
- **Attendance** - staff attendance records
