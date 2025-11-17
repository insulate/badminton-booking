# Setup & Run Guide - Badminton System

## ✅ สถานะปัจจุบัน

**ทุกอย่างพร้อมใช้งานแล้ว!**

✅ **MongoDB (Docker):**
- Container: badminton-mongodb
- Port: 27017
- Status: ✓ Running

✅ **Backend:**
- URL: http://localhost:3000
- Status: ✓ Running
- MongoDB: ✓ Connected

✅ **Frontend:**
- URL: http://localhost:5173
- Status: ✓ Running

✅ **Admin User:**
- Username: `admin`
- Password: `admin123`
- Status: ✓ Created

---

## 🚀 วิธีการรัน (Quick Start)

### 1. Start MongoDB (Docker)
```bash
docker compose up -d
```

### 2. Start Backend
```bash
cd backend
npm run dev
```

Backend จะรันที่: **http://localhost:3000**

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

Frontend จะรันที่: **http://localhost:5173**

---

## 🐳 Docker Commands

### Start MongoDB
```bash
docker compose up -d
```

### Stop MongoDB
```bash
docker compose down
```

### View MongoDB Logs
```bash
docker compose logs -f mongodb
```

### Connect to MongoDB Shell
```bash
docker exec -it badminton-mongodb mongosh -u admin -p admin123 --authenticationDatabase admin
```

### Remove MongoDB (⚠️ ลบข้อมูลทั้งหมด)
```bash
docker compose down -v
```

---

## 📋 NPM Scripts

### Backend
- `npm start` - รันแบบ production
- `npm run dev` - รันแบบ development (auto-reload)

### Frontend
- `npm run dev` - รันแบบ development
- `npm run build` - build สำหรับ production
- `npm run preview` - preview production build

---

## 👤 Admin User

Admin user ถูกสร้างแล้ว:

```
Username: admin
Password: admin123
```

**การสร้าง Admin User ใหม่:**
```bash
cd backend
node scripts/createAdmin.js
```

---

## 🔧 Configuration

### MongoDB Connection
ไฟล์: `backend/.env`
```env
MONGODB_URI=mongodb://admin:admin123@localhost:27017/badminton_db?authSource=admin
```

### Docker Compose
ไฟล์: `docker-compose.yml`
- MongoDB 7.0
- Port: 27017
- Auto-restart: unless-stopped
- Data persistence: mongodb_data volume

---

## 🌐 URLs & Ports

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:5173 | ✓ Running |
| Backend API | http://localhost:3000 | ✓ Running |
| MongoDB | localhost:27017 | ✓ Running |

---

## 📚 API Documentation

- `docs/API_AUTHENTICATION.md` - Authentication endpoints
- `docs/API_USER_CRUD.md` - User management endpoints (Admin only)
- `docs/BACKEND_STRUCTURE.md` - Backend structure
- `docs/FRONTEND_INTEGRATION.md` - Frontend integration guide

---

## 🔐 API Endpoints Summary

### Authentication (Public)
- `POST /api/auth/login` - Login

### Authentication (Private)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### User Management (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user
- `PATCH /api/users/:id/restore` - Restore deleted user

---

## 🔧 Troubleshooting

### MongoDB ไม่รัน
```bash
# Check Docker
docker ps | grep badminton-mongodb

# View logs
docker compose logs mongodb

# Restart
docker compose restart mongodb
```

### Backend ไม่รัน
```bash
# Check if MongoDB is running
docker ps | grep badminton-mongodb

# Check backend logs
cd backend
npm run dev

# Test MongoDB connection
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✓ Connected')).catch(e => console.log('✗ Error:', e.message))"
```

### Port ถูกใช้แล้ว
```bash
# Kill processes
lsof -i :3000 -i :5173 -i :27017 | grep LISTEN
kill -9 <PID>
```

---

## 📂 Project Structure

```
badminton-system/
├── backend/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── user.controller.js
│   ├── models/
│   │   └── user.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   └── index.routes.js
│   ├── middleware/
│   │   └── auth.js
│   ├── scripts/
│   │   ├── createAdmin.js
│   │   └── mongo-init.js
│   ├── .env
│   └── package.json
├── frontend/
│   └── ...
├── docs/
│   ├── API_AUTHENTICATION.md
│   ├── API_USER_CRUD.md
│   ├── BACKEND_STRUCTURE.md
│   └── FRONTEND_INTEGRATION.md
├── docker-compose.yml
└── SETUP.md
```

---

## ✅ Development Checklist

- [x] MongoDB Docker container running
- [x] Backend running (http://localhost:3000)
- [x] Frontend running (http://localhost:5173)
- [x] Admin user created (admin/admin123)
- [ ] Login and test the system
- [ ] Create additional users (if needed)

---

## 🎯 Next Steps

1. **เปิด Frontend:** http://localhost:5173
2. **Login ด้วย:**
   - Username: `admin`
   - Password: `admin123`
3. **เริ่มพัฒนาต่อ!**

---

## 💡 Tips

- ใช้ `docker compose logs -f` เพื่อดู MongoDB logs แบบ real-time
- Backend จะ auto-reload เมื่อแก้ไขไฟล์ (nodemon)
- Frontend จะ hot-reload เมื่อแก้ไขไฟล์ (Vite HMR)
- MongoDB data จะถูกเก็บไว้ใน Docker volume (ไม่หายเมื่อ restart)

---

## 🆘 Support

หากมีปัญหา:
1. ตรวจสอบ logs: `docker compose logs mongodb`
2. ตรวจสอบ backend logs
3. ตรวจสอบว่า ports ว่าง: `lsof -i :3000 -i :5173 -i :27017`
4. Restart ทุกอย่าง:
   ```bash
   docker compose restart
   cd backend && npm run dev
   cd frontend && npm run dev
   ```
