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
- ลงทะเบียนผู้เล่นหน้างาน
- จัดคิวการเล่นอัตโนมัติ
- ระบบจับคู่ตามระดับความสามารถ
- หมุนเวียนผู้เล่น (Winner Stays / All Rotate)
- แสดงคิวและเวลารอบนหน้าจอ

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
Session: Evening Play (18:00-21:00)
สถานะ: กำลังเล่น

┌─────────────────────────┬──────────────────────────┐
│     คิวรอเล่น (8 คน)    │    กำลังเล่น (4 คอร์ท)   │
├─────────────────────────┼──────────────────────────┤
│ 1. สมชาย (รอ 15 นาที)  │ Court 1: ทีม A vs ทีม B │
│ 2. สมหญิง (รอ 30 นาที)  │         (เวลา 12:45)     │
│ 3. สมศรี (รอ 45 นาที)   │ Court 2: ทีม C vs ทีม D │
│ ...                     │         (เวลา 08:30)     │
└─────────────────────────┴──────────────────────────┘

[ลงทะเบียนผู้เล่นใหม่] [จบเกม] [จัดคิวใหม่]
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

### Group Play (ตีก๊วน)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/groupplay` | ดู Session ทั้งหมด |
| POST | `/api/groupplay` | สร้าง Session ใหม่ |
| POST | `/api/groupplay/:id/register` | ลงทะเบียนผู้เล่น |
| PATCH | `/api/groupplay/:id/checkin/:phone` | Check-in ผู้เล่น |
| PATCH | `/api/groupplay/:id/start` | เริ่ม Session |
| GET | `/api/groupplay/:id/queue` | ดูคิว |

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

### GroupPlay (ตีก๊วน)
```javascript
{
  date: Date,
  session: {
    name: String,         // "Evening Session"
    startTime: String,
    endTime: String
  },
  courts: [ObjectId],     // ref: Court
  players: [{
    name: String,
    phone: String,
    level: String,        // beginner/intermediate/advanced
    checkInTime: Date,
    status: String,       // waiting/playing/finished
    gamesPlayed: Number,
    fee: Number,
    paid: Boolean
  }],
  queue: [String],        // Phone numbers
  currentGames: [{
    court: ObjectId,
    players: [String],
    startTime: Date,
    score: {
      team1: Number,
      team2: Number
    },
    status: String        // playing/finished
  }],
  settings: {
    gameType: String,     // singles/doubles/mixed
    pointsPerGame: Number,
    minutesPerGame: Number,
    rotationType: String  // winner_stays/all_rotate
  }
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

### 3. การลงทะเบียนผู้เล่นตีก๊วน
```javascript
// POST /api/groupplay/:sessionId/register
const player = {
  name: "สมศรี",
  phone: "0898765432",
  level: "intermediate",
  fee: 100
};

const response = await axios.post(
  `/api/groupplay/${sessionId}/register`, 
  player
);
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
