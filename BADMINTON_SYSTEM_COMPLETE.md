# 🏸 ระบบจองสนามแบดมินตัน (Badminton Booking System)

## 📋 ภาพรวมระบบ

ระบบจองสนามแบดมินตันแบบครบวงจร พัฒนาด้วย React + Node.js + MongoDB รองรับการจองสนาม, ระบบตีก๊วน (Group Play), และการขายสินค้า/อาหารเครื่องดื่ม

---

## ✨ ฟีเจอร์หลัก

### 1. ระบบจองสนาม
- จองสนามล่วงหน้าผ่านปฏิทิน
- แสดงตารางสนามแบบ Real-time
- คำนวณค่าสนามตามช่วงเวลา (Peak/Off-Peak)
- รองรับการจองหลายช่วงเวลาต่อเนื่อง

### 2. ระบบตีก๊วน (Group Play)
- Check-in ผู้เล่น พร้อมคิดค่าเข้าร่วม (ครั้งเดียวต่อวัน)
- บันทึกทีมที่ลงสนามแข่ง (สถานะ: กำลังเล่น)
- บันทึกผลเมื่อเล่นเสร็จ + ใช้สินค้า (ลูกแบด, น้ำ, ขนม)
- คำนวณค่าใช้จ่ายรวมต่อคน (ค่าเข้าร่วม + ค่าสินค้า ÷ จำนวนคนในทีม)
- สรุปยอดเงินเมื่อ Check-out
- รองรับการเล่นซ้ำหลายเกม (จ่ายค่าเข้าร่วมครั้งเดียว)

### 3. ระบบขายสินค้า (POS)
- ขายสินค้า, อาหาร, เครื่องดื่ม
- จัดการสต็อกสินค้า
- คำนวณราคาสำหรับสมาชิก/ทั่วไป
- รวมบิลกับค่าสนาม

### 4. ระบบการจัดการ (Admin Settings)
- **กำหนดจำนวนสนามได้เอง** (ไม่จำกัด)
- **ตั้งเวลาเปิด-ปิดสนามได้เอง**
- **กำหนดราคาตามช่วงเวลา**
- **แยกราคา Weekday/Weekend/Holiday**
- รายงานรายได้แยกประเภท

---

## 🛠 เทคโนโลยีที่ใช้

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Tailwind CSS, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| State Management | Zustand |
| Authentication | JWT |
| UI Components | Headless UI, React Icons |
| Date/Time | Moment.js, React Calendar |

---

## 📁 โครงสร้างโปรเจค

```
badminton-system/
├── backend/
│   ├── models/           # MongoDB Schemas
│   │   ├── Court.js     # สนาม
│   │   ├── Booking.js   # การจอง
│   │   ├── GroupPlay.js # ตีก๊วน
│   │   ├── Product.js   # สินค้า
│   │   ├── Sale.js      # การขาย
│   │   ├── TimeSlot.js  # ช่วงเวลา
│   │   ├── User.js      # ผู้ใช้
│   │   └── Setting.js   # การตั้งค่า
│   ├── routes/          # API Routes
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   ├── courts.js
│   │   ├── groupplay.js
│   │   ├── products.js
│   │   ├── sales.js
│   │   ├── settings.js
│   │   └── timeslots.js
│   ├── middleware/      # Auth middleware
│   ├── utils/          # Helper functions
│   ├── .env.example    # Environment template
│   ├── package.json
│   └── server.js       # Main server
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/      # Page components
│   │   │   ├── BookingPage.jsx
│   │   │   ├── GroupPlayPage.jsx
│   │   │   ├── POSPage.jsx
│   │   │   ├── AdminSettings.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/   # API calls
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
├── install.bat         # Windows installer
├── install.sh         # Mac/Linux installer
├── start-system.bat   # Windows starter
├── start-system.sh    # Mac/Linux starter
└── README.md
```

---

## 🚀 การติดตั้ง

### ข้อกำหนดเบื้องต้น
- Node.js v14+ 
- MongoDB 4.4+
- npm หรือ yarn

### วิธีที่ 1: ติดตั้งอัตโนมัติ (แนะนำ)

#### Windows:
```batch
1. แตกไฟล์ badminton-system.zip
2. ดับเบิลคลิก install.bat
3. รอติดตั้งเสร็จ
4. ดับเบิลคลิก start-system.bat เพื่อรันระบบ
```

#### Mac/Linux:
```bash
unzip badminton-system.zip
cd badminton-system
chmod +x install.sh start-system.sh
./install.sh
./start-system.sh
```

### วิธีที่ 2: ติดตั้งแบบ Manual

#### 1. ติดตั้ง MongoDB
```bash
# Download จาก https://www.mongodb.com/try/download/community
# ติดตั้งและรัน MongoDB service
```

#### 2. Clone หรือ Extract โปรเจค
```bash
unzip badminton-system.zip
cd badminton-system
```

#### 3. ติดตั้ง Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

#### 4. ติดตั้ง Frontend (Terminal ใหม่)
```bash
cd frontend
npm install
npm start
```

เปิดเบราว์เซอร์ที่ http://localhost:3000

---

## ⚙️ การตั้งค่า Environment

### Backend (.env)
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/badminton-booking

# Server Port
PORT=5000

# JWT Secret
JWT_SECRET=your-secret-key-here-change-in-production

# Environment
NODE_ENV=development
```

---

## 📱 การใช้งานระบบ

### 1. หน้า Admin Settings - จัดการสนาม

#### Tab จัดการสนาม
```
┌─────────┬──────────┬──────────┬────────────┬─────────┐
│ รหัส    │ ชื่อสนาม │ ประเภท  │ สถานะ     │ จัดการ  │
├─────────┼──────────┼──────────┼────────────┼─────────┤
│ C01     │ Court 1  │ ปกติ     │ พร้อมใช้   │ 🗑️     │
│ C02     │ Court 2  │ พรีเมียม │ พร้อมใช้   │ 🗑️     │
└─────────┴──────────┴──────────┴────────────┴─────────┘
[+ เพิ่มสนาม]
```

#### Tab ช่วงเวลา & ราคา
```
┌─────────────┬──────────┬───────┬────────┬─────────┬──────┐
│ ช่วงเวลา    │ วันประเภท│ ปกติ  │ สมาชิก │ Walk-in │ Peak │
├─────────────┼──────────┼───────┼────────┼─────────┼──────┤
│ 06:00-07:00 │ ธรรมดา   │ 100   │ 80     │ 120     │      │
│ 18:00-20:00 │ ธรรมดา   │ 200   │ 150    │ 250     │ ✓    │
└─────────────┴──────────┴───────┴────────┴─────────┴──────┘
[+ เพิ่มช่วงเวลา]
```

#### Tab ข้อมูลสนาม
```
ชื่อสนาม: [_____________________]
ที่อยู่:   [_____________________]
เบอร์โทร: [_____________________]
อีเมล:    [_____________________]

เวลาเปิด-ปิด: [06:00] ถึง [22:00]

วันเปิดทำการ:
[✓] จันทร์ [✓] อังคาร [✓] พุธ [✓] พฤหัส 
[✓] ศุกร์  [✓] เสาร์  [✓] อาทิตย์

[บันทึกการตั้งค่า]
```

### 2. หน้าจองสนาม

```
┌──────────────┬─────────────────────────────────────┐
│   ปฏิทิน     │         ตารางสนาม                  │
│              │  06:00  07:00  08:00  09:00  10:00 │
│ [กุมภาพันธ์] │                                     │
│     2024     │ Court 1  [ว่าง] [จอง] [ว่าง] [ว่าง] │
│              │ Court 2  [ว่าง] [ว่าง] [จอง] [ว่าง] │
│ ○ 15         │ Court 3  [จอง] [ว่าง] [ว่าง] [ว่าง] │
│ ● 16         │                                     │
│ ○ 17         │ สีเขียว = ว่าง                      │
│              │ สีแดง = จองแล้ว                    │
└──────────────┴─────────────────────────────────────┘

Selected: 2 ช่วงเวลา
ราคารวม: ฿300
[ดำเนินการจอง]
```

### 3. หน้าตีก๊วน

```
Session: ก๊วนจันทร์-ศุกร์ (Court A, 18:00-24:00)
สถานะ: กำลังเปิด

┌───────────────────────────────────────────────────────────┐
│           ผู้เล่นที่ Check-in แล้ว (8 คน)                 │
├──────┬──────────────┬──────┬─────────┬──────────┬─────────┤
│ ชื่อ │   เบอร์โทร   │ เข้า │ เล่นแล้ว│ ค่าใช้จ่าย│ สถานะ   │
├──────┼──────────────┼──────┼─────────┼──────────┼─────────┤
│สมชาย │ 081-234-5678 │14:05 │ 3 เกม   │  95 บาท  │ กำลังเล่น│
│สมหญิง│ 082-345-6789 │14:10 │ 2 เกม   │  70 บาท  │ รอ      │
│สมศรี │ 083-456-7890 │14:15 │ 1 เกม   │  45 บาท  │ รอ      │
└──────┴──────────────┴──────┴─────────┴──────────┴─────────┘

┌───────────────────────────────────────────────────────────┐
│                   เกมที่กำลังเล่น                         │
├──────────────────────────────────────────────────────────┤
│ เกม #1: สมชาย + สมพร vs สมหมาย + สมใจ                   │
│         เริ่ม: 15:30 | กำลังเล่น                         │
└──────────────────────────────────────────────────────────┘

[Check-in ผู้เล่น] [เริ่มเกมใหม่] [จบเกม] [Check-out]
```

---

## 🔑 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| GET | `/api/auth/profile` | ดูข้อมูลผู้ใช้ |

### Courts Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courts` | ดูสนามทั้งหมด |
| POST | `/api/courts` | เพิ่มสนามใหม่ |
| PUT | `/api/courts/:id` | แก้ไขสนาม |
| DELETE | `/api/courts/:id` | ลบสนาม |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | ดูการจองทั้งหมด |
| POST | `/api/bookings` | สร้างการจองใหม่ |
| PATCH | `/api/bookings/:id/cancel` | ยกเลิกการจอง |
| PATCH | `/api/bookings/:id/checkin` | Check-in |
| PATCH | `/api/bookings/:id/payment` | อัพเดทการชำระเงิน |
| GET | `/api/bookings/schedule/daily` | ตารางรายวัน |

### Players (ผู้เล่นประจำ)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/players` | ดูผู้เล่นทั้งหมด (filter by level, search by name/phone) |
| POST | `/api/players` | เพิ่มผู้เล่นใหม่ |
| GET | `/api/players/:id` | ดูรายละเอียดผู้เล่น |
| PUT | `/api/players/:id` | แก้ไขข้อมูลผู้เล่น (ชื่อ, เบอร์, ระดับมือ) |
| DELETE | `/api/players/:id` | ลบผู้เล่น |
| GET | `/api/players/stats/:id` | ดูสถิติการเล่น (จำนวนเกม, ค่าใช้จ่ายรวม) |

### Group Play (ตีก๊วน)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groupplay` | ดู Session ทั้งหมด (filter by date, court, status) |
| POST | `/api/groupplay` | สร้าง Session ใหม่ (แบบวันเดียว หรือ recurring) + สร้าง booking ใน Calendar |
| GET | `/api/groupplay/:id` | ดูรายละเอียด Session |
| POST | `/api/groupplay/:id/checkin` | Check-in ผู้เล่น (เลือกจาก database หรือสร้างใหม่) + เก็บค่าเข้าร่วม |
| POST | `/api/groupplay/:id/game/start` | เริ่มเกมใหม่ (เลือกผู้เล่น 2-4 คน, แนะนำตามระดับมือ) |
| PATCH | `/api/groupplay/:id/game/:gameId/finish` | จบเกม + บันทึกสินค้าที่ใช้ + คำนวณค่าใช้จ่าย |
| POST | `/api/groupplay/:id/checkout` | Check-out ผู้เล่น + สรุปยอดเงิน |
| DELETE | `/api/groupplay/:id` | ลบ Session + ลบ booking ใน Calendar |

### Products & Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | ดูสินค้าทั้งหมด |
| POST | `/api/products` | เพิ่มสินค้า |
| POST | `/api/sales` | บันทึกการขาย |
| GET | `/api/sales` | ดูประวัติการขาย |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | ดูการตั้งค่า |
| PUT | `/api/settings` | อัพเดทการตั้งค่า |
| PATCH | `/api/settings/:section` | อัพเดทเฉพาะส่วน |

---

## 📊 Database Schema

### Court (สนาม)
```javascript
{
  courtNumber: String,    // รหัสสนาม
  name: String,           // ชื่อสนาม
  type: String,           // normal/premium/tournament
  status: String,         // available/maintenance/inactive
  description: String     // รายละเอียด
}
```

### Booking (การจอง)
```javascript
{
  bookingCode: String,    // BK20240115xxxx
  court: ObjectId,        // ref: Court
  customer: {
    name: String,
    phone: String,
    email: String,
    type: String          // member/guest/walkin
  },
  date: Date,
  timeSlot: {
    startTime: String,    // "09:00"
    endTime: String,      // "10:00"
    duration: Number      // minutes
  },
  price: {
    courtFee: Number,
    additionalFee: Number,
    discount: Number,
    total: Number
  },
  payment: {
    method: String,       // cash/transfer/credit_card
    status: String,       // pending/paid/refunded
    paidAmount: Number
  },
  status: String          // pending/confirmed/cancelled
}
```

### Player (ผู้เล่นประจำ)
```javascript
{
  name: String,                   // ชื่อผู้เล่น
  phone: String,                  // เบอร์โทร (unique)
  password: String,               // Password สำหรับอนาคต (login)
  level: String,                  // ระดับมือ: "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10" (optional)
  levelName: String,              // ชื่อระดับ: "เปะ-แปะ", "หน้าบ้าน", "S-", "S", "N", "P-", "P", "P+", "C", "B", "A"
  stats: {
    totalGames: Number,           // จำนวนเกมรวมทั้งหมด
    totalSpent: Number,           // ค่าใช้จ่ายรวมทั้งหมด
    lastPlayed: Date              // เล่นครั้งล่าสุดเมื่อไหร่
  },
  notes: String,                  // หมายเหตุ (เช่น "ซ้ายมือ", "ชอบตบ")
  status: String,                 // "active", "inactive"
  createdAt: Date,
  updatedAt: Date
}
```

### GroupPlay (ตีก๊วน)
```javascript
{
  sessionName: String,              // เช่น "ก๊วนจันทร์-ศุกร์"
  court: ObjectId,                  // ref: Court
  date: Date,                       // วันที่เริ่ม (สำหรับ session แบบวันเดียว)
  daysOfWeek: [String],             // ["monday", "tuesday", ...] สำหรับ recurring
  startTime: String,                // เช่น "18:00"
  endTime: String,                  // เช่น "24:00"
  entryFee: Number,                 // Default 30 บาท (configurable)
  recurring: Boolean,               // true ถ้าเป็น session ประจำ
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
        product: ObjectId,          // ref: Product
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
  createdBy: ObjectId,              // ref: User
  createdAt: Date,
  updatedAt: Date
}
```

### TimeSlot (ช่วงเวลา)
```javascript
{
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

### Setting (การตั้งค่า)
```javascript
{
  venue: {
    name: String,
    address: String,
    phone: String,
    email: String
  },
  operating: {
    openTime: String,     // "06:00"
    closeTime: String,    // "22:00"
    daysOpen: [String]    // ["monday", "tuesday", ...]
  },
  booking: {
    advanceBookingDays: Number,
    minBookingHours: Number,
    maxBookingHours: Number,
    cancellationHours: Number,
    requireDeposit: Boolean,
    depositAmount: Number
  },
  payment: {
    acceptCash: Boolean,
    acceptTransfer: Boolean,
    acceptCreditCard: Boolean,
    acceptPromptPay: Boolean
  }
}
```

---

## 🔐 ระดับผู้ใช้งาน (User Roles)

| Role | Permissions |
|------|------------|
| **Admin** | จัดการระบบทั้งหมด, ตั้งค่า, ดูรายงาน |
| **Manager** | จัดการสนาม, ดูรายงาน, ตั้งราคา |
| **Staff** | จองสนาม, จัดการตีก๊วน, ขายสินค้า |
| **Cashier** | ขายสินค้า, รับเงิน |

---

## 🎨 UI Components

### Colors Scheme
```css
Primary: #3B82F6 (Blue)
Secondary: #10B981 (Green)
Danger: #EF4444 (Red)
Warning: #F59E0B (Yellow)
Info: #6366F1 (Indigo)
```

### Status Colors
```css
Available: #10B981 (Green)
Booked: #EF4444 (Red)
Pending: #F59E0B (Yellow)
Maintenance: #6B7280 (Gray)
```

---

## 🆘 การแก้ปัญหาเบื้องต้น

### 1. MongoDB Connection Error
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo service mongod start
```

### 2. Port Already in Use
```bash
# เปลี่ยน Port ใน .env
PORT=5001

# หรือหา Process ที่ใช้ Port
# Windows
netstat -ano | findstr :5000

# Mac/Linux
lsof -i :5000
```

### 3. npm install Error
```bash
# ลบ node_modules และลงใหม่
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 4. CORS Error
```javascript
// ตรวจสอบ CORS setting ใน server.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## 📈 Features Roadmap

### Phase 1 (Current) ✅
- [x] ระบบจองสนาม
- [x] ระบบตีก๊วน
- [x] ระบบขายสินค้า
- [x] Admin Settings

### Phase 2 (Next)
- [ ] ระบบสมาชิกและสะสมแต้ม
- [ ] Payment Gateway Integration
- [ ] Line Notification
- [ ] QR Code Check-in

### Phase 3 (Future)
- [ ] Mobile App (React Native)
- [ ] ระบบ Tournament
- [ ] Analytics Dashboard
- [ ] ระบบเช่าอุปกรณ์
- [ ] Social Media Integration

---

## 📝 Code Examples

### 1. การเพิ่มสนามใหม่
```javascript
// POST /api/courts
const newCourt = {
  courtNumber: "C01",
  name: "Court 1",
  type: "normal",
  status: "available",
  description: "สนามมาตรฐาน พื้นยาง"
};

const response = await axios.post('/api/courts', newCourt);
```

### 2. การจองสนาม
```javascript
// POST /api/bookings
const booking = {
  court: "courtId123",
  customer: {
    name: "สมชาย ใจดี",
    phone: "0812345678",
    type: "guest"
  },
  date: "2024-02-15",
  timeSlot: {
    startTime: "09:00",
    endTime: "11:00",
    duration: 120
  },
  price: {
    courtFee: 200,
    total: 200
  }
};

const response = await axios.post('/api/bookings', booking);
```

### 3. Check-in ผู้เล่นตีก๊วน
```javascript
// POST /api/groupplay/:sessionId/checkin
const player = {
  name: "สมศรี",
  phone: "0898765432"
};

// Check-in และเก็บค่าเข้าร่วม 30 บาท (ครั้งเดียวต่อวัน)
const response = await axios.post(
  `/api/groupplay/${sessionId}/checkin`,
  player
);
```

### 4. จบเกมและคำนวณค่าใช้จ่าย
```javascript
// PATCH /api/groupplay/:sessionId/game/:gameId/finish
const gameData = {
  items: [
    {
      product: "65f1234567890abcdef12345", // ลูกแบด
      quantity: 1,
      price: 60
    },
    {
      product: "65f1234567890abcdef12346", // น้ำ
      quantity: 1,
      price: 20
    }
  ]
};

// คำนวณ: totalItemsCost = 80 บาท
// costPerPlayer = 80 ÷ 4 คน = 20 บาท/คน
const response = await axios.patch(
  `/api/groupplay/${sessionId}/game/${gameId}/finish`,
  gameData
);
```

### 5. Player Levels Constants (MK Badminton 2025)
```javascript
// backend/constants/playerLevels.js หรือ frontend/src/constants/playerLevels.js

export const PLAYER_LEVELS = {
  '0': { name: 'เปะ-แปะ', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  '1': { name: 'หน้าบ้าน', color: 'gray', bgColor: 'bg-gray-200', textColor: 'text-gray-800' },
  '2': { name: 'S-', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  '3': { name: 'S', color: 'orange', bgColor: 'bg-orange-200', textColor: 'text-orange-800' },
  '4': { name: 'N', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  '5': { name: 'P-', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  '6': { name: 'P', color: 'yellow', bgColor: 'bg-yellow-200', textColor: 'text-yellow-800' },
  '7': { name: 'P+', color: 'yellow', bgColor: 'bg-yellow-300', textColor: 'text-yellow-900' },
  '8': { name: 'C', color: 'green', bgColor: 'bg-green-200', textColor: 'text-green-900' },
  '9': { name: 'B', color: 'purple', bgColor: 'bg-purple-200', textColor: 'text-purple-900' },
  '10': { name: 'A', color: 'red', bgColor: 'bg-red-200', textColor: 'text-red-900' }
};

export const getLevelName = (level) => {
  return PLAYER_LEVELS[level]?.name || '-';
};

export const getLevelBadgeClass = (level) => {
  const l = PLAYER_LEVELS[level];
  return l ? `${l.bgColor} ${l.textColor}` : 'bg-gray-100 text-gray-800';
};
```

---

## 🔄 Git Commands

### Initial Setup
```bash
git init
git add .
git commit -m "Initial commit - Badminton Booking System"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### Daily Workflow
```bash
git status
git add .
git commit -m "feat: add feature description"
git push origin main
```

---

## 📦 Deployment

### Deploy to Heroku
```bash
heroku create badminton-booking-app
heroku addons:create mongolab
git push heroku main
heroku open
```

### Deploy to Vercel (Frontend)
```bash
cd frontend
vercel
```

### Deploy to Railway
```bash
railway login
railway init
railway add
railway up
```

---

## 🔒 Security Best Practices

1. **Environment Variables**
   - ไม่ push .env file ขึ้น git
   - ใช้ strong JWT secret
   - เปลี่ยน default passwords

2. **Database Security**
   - Enable MongoDB authentication
   - Use connection string with credentials
   - Regular backups

3. **API Security**
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS in production

---

## 📚 Resources & References

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [JWT.io](https://jwt.io/)

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Contact & Support

- **Developer**: Your Team Name
- **Email**: support@badminton-system.com
- **Website**: https://badminton-system.com
- **Version**: 1.0.0
- **Last Updated**: February 2024

---

## 🙏 Acknowledgments

- ขอบคุณทุกคนที่ใช้งานระบบ
- ขอบคุณ Open Source Community
- ขอบคุณทีมพัฒนาที่ช่วยกัน

---

**Made with ❤️ by Badminton System Development Team**
