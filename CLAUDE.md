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
   - ถ้าจำเป็นต้องยกตัวอย่างคำสั่ง git ให้ใส่ใน code block และระบุชัดเจนว่าเป็น “example only”

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
   - 
4. **Clarifying Questions (ถ้าจำเป็น)**
   - ถามสิ่งที่จำเป็นต่อการออกแบบ schema, flow, หรือ constraint ให้ครบ
   - ถ้าข้อมูลพอแล้ว ให้บอกว่าคิดสมมติอะไรเพิ่มเองบ้าง (assumptions)

## Project Overview

Badminton Court Booking System - A monorepo with React frontend and Express backend for managing court bookings, POS sales, and venue operations.

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
npm run test:e2e:ui      # UI mode
npm run test:e2e:debug   # Debug mode

# Run specific test files
npm test -- auth.test.js
npm run test:e2e -- auth.spec.js
```

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
- **models/** - Mongoose schemas (User, Booking, Court, TimeSlot, Product, Sale, Category, Setting, Counter)
- **routes/** - API endpoints (`/api/auth`, `/api/bookings`, `/api/courts`, `/api/timeslots`, `/api/products`, `/api/sales`, `/api/categories`, `/api/settings`, `/api/users`)
- **controllers/** - Business logic for routes
- **middleware/** - Auth (JWT), booking validation, rate limiting, upload (multer), ObjectId validation
- **config/** - Database connection
- **seeders/** - Database seed scripts
- **scripts/** - Utility scripts
- **__tests__/** - Jest test files

### Frontend Structure (`frontend/`)

- **src/App.jsx** - Route definitions using React Router
- **src/pages/** - Page components
  - `LoginPage.jsx` - Public login page
  - `admin/` - Protected admin pages (Dashboard, Booking, Bookings, POS, UserManagement, CategoryManagement)
  - `admin/settings/` - Settings pages (Venue, Operating Hours, Booking, Payment, General, Courts, TimeSlots, Products)
- **src/components/** - Reusable components (booking, products, timeslots, layout, common)
- **src/stores/** - Zustand stores (authStore.js)
- **src/lib/api.js** - Axios API client with auth interceptors
- **src/constants/** - API endpoints, routes, and shared constants
- **e2e/** - Playwright E2E tests (auth.spec.js, bookings.spec.js, pos.spec.js, settings.spec.js)

### Key Architectural Patterns

**Authentication Flow:**
1. JWT tokens stored in localStorage
2. authStore (Zustand) manages user state
3. ProtectedRoute component guards admin routes
4. API client (lib/api.js) automatically includes Authorization header
5. Backend middleware (middleware/auth.js) validates JWT

**Booking System:**
- Auto-generates booking codes using Counter model
- Validates court availability and time slot conflicts (middleware/bookingValidation.js)
- Supports multi-hour bookings with duration field
- Tracks booking status: pending, confirmed, cancelled, completed
- Payment tracking: unpaid, partial, paid

**POS System:**
- Sales linked to Categories and Products
- Auto-generates sale codes (S-XXXXX format)
- Tracks inventory changes on product sales
- Payment method options: cash, bank_transfer, promptpay

**File Uploads:**
- Product images: multer middleware (middleware/upload.js)
- Stored in `backend/uploads/products/`
- Served at `/uploads/products/` endpoint

**Rate Limiting:**
- Login endpoint: 5 attempts per 15 minutes per IP (development: disabled in middleware/rateLimiter.js)

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
- **Playwright** auto-starts both frontend/backend via webServer config
- E2E tests use `http://localhost:5173` as baseURL
- Test environment uses separate test database (configured in test files)

## Important API Routes

- `POST /api/auth/login` - User authentication
- `GET /api/bookings` - List bookings with filters (date, court, status)
- `POST /api/bookings` - Create booking (auto-generates booking code)
- `GET /api/courts` - List courts with availability
- `GET /api/timeslots` - Get time slots with pricing
- `POST /api/sales` - Create POS sale (auto-generates sale code)
- `GET /api/settings` - Get all settings
- `PATCH /api/settings/:key` - Update specific setting

## Data Models

**Core Collections:**
- **User** - username, password (hashed), role (admin/staff)
- **Booking** - bookingCode, customer info, court, date, timeSlot, duration, pricing, status, payment
- **Court** - name, status (active/inactive), description
- **TimeSlot** - startTime, endTime, pricing (weekday/weekend/holiday)
- **Product** - name, SKU, category, price, quantity, image
- **Sale** - saleCode, items[], totalAmount, paymentMethod, paymentStatus
- **Category** - name, type (product/service)
- **Setting** - key-value pairs for system configuration
- **Counter** - Auto-incrementing counters for bookingCode and saleCode
