# Badminton Court Booking System

Monorepo สำหรับระบบจองสนามแบดมินตัน

## โครงสร้างโปรเจค

```
badminton-system/
├── frontend/          # React + Vite
├── backend/           # Node.js + Express + MongoDB Atlas
├── package.json       # Root package.json สำหรับ monorepo
└── README.md
```

## เทคโนโลยีที่ใช้

### Frontend
- React 18
- Vite
- Development server: http://localhost:5173

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Server: http://localhost:3000

## การติดตั้ง

### 1. Clone โปรเจค

```bash
cd badminton-system
```

### 2. ติดตั้ง Dependencies ทั้งหมด

```bash
npm run install:all
```

หรือติดตั้งแยกกัน:

```bash
# Root
npm install

# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### 3. ตั้งค่า MongoDB Atlas

1. สร้างบัญชี MongoDB Atlas ที่ https://www.mongodb.com/cloud/atlas
2. สร้าง Cluster
3. สร้าง Database User
4. เพิ่ม IP Address ที่ Network Access (หรือใช้ 0.0.0.0/0 สำหรับ development)
5. คัดลอก Connection String

### 4. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/`:

```bash
cd backend
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS
CLIENT_URL=http://localhost:5173
```

## การรันโปรเจค

### รันทั้ง Frontend และ Backend พร้อมกัน

```bash
npm run dev
```

### รันแยกกัน

**Frontend:**
```bash
npm run dev:frontend
```

**Backend:**
```bash
npm run dev:backend
```

### หรือรันโดยตรงในแต่ละโฟลเดอร์

**Frontend:**
```bash
cd frontend
npm run dev
```

**Backend:**
```bash
cd backend
npm run dev
```

## Build

สำหรับ production build ของ frontend:

```bash
npm run build
```

## API Endpoints

Backend API จะอยู่ที่: `http://localhost:3000/api`

- `GET /api/` - Welcome message
- `GET /api/users` - Users endpoint (example)

## Next Steps

1. ✅ Setup monorepo structure
2. ✅ Install frontend (React + Vite)
3. ✅ Install backend (Express + MongoDB)
4. 🔄 กำหนด Database Schema สำหรับ:
   - Users
   - Courts
   - Bookings
   - Payments
5. 🔄 สร้าง API Routes
6. 🔄 พัฒนา Frontend Components
7. 🔄 Authentication & Authorization
8. 🔄 Payment Integration

## License

ISC
