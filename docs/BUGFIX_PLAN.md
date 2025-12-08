# Bugfix Plan: Booking & Court Issues

## สรุปปัญหาที่พบ (Identified Issues)

### Issue 1: การจองไม่ถูกบันทึก (Booking Persistence Failure)
- **อาการ:** กดจองสำเร็จแต่ไม่พบข้อมูลใน "ตารางงานของฉัน" หรือ "หลังบ้าน"
- **สาเหตุ:**
  1. Frontend ไม่มี `else` handling เมื่อ `response.success === false`
  2. Backend ไม่มี date validation (วันอดีต, advanceBookingDays, dayType)

### Issue 2: เพิ่มสนามไม่ได้ (Add Court Failure)
- **อาการ:** กด "บันทึกสนาม" แล้วไม่มีอะไรเกิดขึ้น
- **สาเหตุ:**
  1. Frontend ไม่มี `else` handling เมื่อ `response.success === false`
  2. รหัสสนาม (courtNumber) ซ้ำกับที่มีอยู่

### Issue 3: Login Redirect
- **อาการ:** Login สำเร็จแต่ไม่พาไปหน้าที่ต้องการ
- **สาเหตุ:**
  1. `ProtectedRoute.jsx` ไม่ส่ง redirect path
  2. `LoginPage.jsx` hardcode redirect ไป dashboard

---

## ไฟล์ที่ต้องแก้ไข (7 ไฟล์)

| # | ไฟล์ | Priority | สถานะ |
|---|-----|----------|-------|
| 1 | `frontend/src/components/customer/BookingSlotModal.jsx` | High | [ ] |
| 2 | `frontend/src/pages/admin/settings/courts/CourtsAddPage.jsx` | High | [ ] |
| 3 | `backend/routes/bookings.routes.js` | High | [ ] |
| 4 | `backend/routes/courts.routes.js` | Medium | [ ] |
| 5 | `frontend/src/components/ProtectedRoute.jsx` | Medium | [ ] |
| 6 | `frontend/src/pages/LoginPage.jsx` | Medium | [ ] |
| 7 | `backend/__tests__/bookings.test.js` | Medium | [ ] |

---

## รายละเอียดการแก้ไข

---

### 1. BookingSlotModal.jsx

**ไฟล์:** `frontend/src/components/customer/BookingSlotModal.jsx`

**ปัญหา:**
- ไม่มี `else` handling เมื่อ `response.success === false`
- ไม่มีการป้องกันการกดปุ่มซ้ำ

**การแก้ไข:** บรรทัด 64-84

**ก่อนแก้ไข:**
```javascript
const handleConfirm = async () => {
  try {
    setLoading(true);
    const response = await customerBookingsAPI.create({
      date: selectedDate.toISOString().split('T')[0],
      timeSlot: slot.timeSlotId,
      duration: selectedDuration,
    });

    if (response.success) {
      onSuccess(response.data);
      onClose();
    }
  } catch (error) {
    console.error('Booking error:', error);
    toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการจอง');
  } finally {
    setLoading(false);
  }
};
```

**หลังแก้ไข:**
```javascript
const handleConfirm = async () => {
  // ป้องกันการกดปุ่มซ้ำ
  if (loading) return;

  try {
    setLoading(true);
    const response = await customerBookingsAPI.create({
      date: selectedDate.toISOString().split('T')[0],
      timeSlot: slot.timeSlotId,
      duration: selectedDuration,
    });

    if (response.success) {
      onSuccess(response.data);
      onClose();
    } else {
      // แสดง error เมื่อ success === false
      toast.error(response.message || 'ไม่สามารถจองได้ กรุณาลองใหม่อีกครั้ง');
    }
  } catch (error) {
    console.error('Booking error:', error);
    toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการจอง');
  } finally {
    setLoading(false);
  }
};
```

---

### 2. CourtsAddPage.jsx

**ไฟล์:** `frontend/src/pages/admin/settings/courts/CourtsAddPage.jsx`

**ปัญหา:** ไม่มี `else` handling เมื่อ `response.success === false`

**การแก้ไข:** บรรทัด 41-54

**ก่อนแก้ไข:**
```javascript
try {
  setSaving(true);
  const response = await courtsAPI.create(formData);

  if (response.success) {
    toast.success('เพิ่มสนามใหม่สำเร็จ');
    navigate(ROUTES.ADMIN.COURTS);
  }
} catch (error) {
  console.error('Error creating court:', error);
  toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มสนาม');
} finally {
  setSaving(false);
}
```

**หลังแก้ไข:**
```javascript
try {
  setSaving(true);
  const response = await courtsAPI.create(formData);

  if (response.success) {
    toast.success('เพิ่มสนามใหม่สำเร็จ');
    navigate(ROUTES.ADMIN.COURTS);
  } else {
    // แสดง error เมื่อ success === false
    toast.error(response.message || 'ไม่สามารถเพิ่มสนามได้ กรุณาลองใหม่อีกครั้ง');
  }
} catch (error) {
  console.error('Error creating court:', error);
  toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มสนาม');
} finally {
  setSaving(false);
}
```

---

### 3. bookings.routes.js (Customer Booking Endpoint)

**ไฟล์:** `backend/routes/bookings.routes.js`

**ปัญหา:** Customer booking endpoint ไม่มี date validation

**การแก้ไข:** เพิ่ม validation หลังบรรทัด 76 และ 85

**เพิ่มหลัง `bookingDate.setHours(0, 0, 0, 0);` (บรรทัด 76):**
```javascript
// === Date Validation ===
const today = new Date();
today.setHours(0, 0, 0, 0);

// เช็คว่าไม่ใช่วันในอดีต
if (bookingDate < today) {
  return res.status(400).json({
    success: false,
    message: 'ไม่สามารถจองวันที่ผ่านมาแล้วได้',
  });
}

// ดึง Settings สำหรับ advance booking limit
const settings = await Setting.findOne();
const advanceBookingDays = settings?.booking?.advanceBookingDays || 14;

// เช็ค advance booking limit
const maxAdvanceDate = new Date(today);
maxAdvanceDate.setDate(today.getDate() + advanceBookingDays);

if (bookingDate > maxAdvanceDate) {
  return res.status(400).json({
    success: false,
    message: `ไม่สามารถจองล่วงหน้าเกิน ${advanceBookingDays} วันได้`,
  });
}
```

**เพิ่มหลังได้ timeSlotDoc (หลังเช็ค `if (!timeSlotDoc)`):**
```javascript
// เช็ค dayType mismatch
const dayOfWeek = bookingDate.getDay();
const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
const expectedDayType = isWeekend ? 'weekend' : 'weekday';

if (timeSlotDoc.dayType !== expectedDayType) {
  return res.status(400).json({
    success: false,
    message: `ช่วงเวลานี้สำหรับวัน${timeSlotDoc.dayType === 'weekday' ? 'ธรรมดา' : 'หยุด'} แต่วันที่เลือกเป็นวัน${expectedDayType === 'weekday' ? 'ธรรมดา' : 'หยุด'}`,
  });
}
```

---

### 4. courts.routes.js

**ไฟล์:** `backend/routes/courts.routes.js`

**ปัญหา:** เช็ค courtNumber เฉพาะ `deletedAt: null` แต่ต้องการห้ามใช้ซ้ำตลอดไป

**การแก้ไข POST (บรรทัด 82-89):**

**ก่อนแก้ไข:**
```javascript
const existingCourt = await Court.findOne({ courtNumber, deletedAt: null });
if (existingCourt) {
  return res.status(400).json({
    success: false,
    message: 'รหัสสนามนี้มีอยู่ในระบบแล้ว',
  });
}
```

**หลังแก้ไข:**
```javascript
const existingCourt = await Court.findOne({ courtNumber });
if (existingCourt) {
  const message = existingCourt.deletedAt 
    ? 'รหัสสนามนี้เคยใช้แล้ว ไม่สามารถใช้ซ้ำได้'
    : 'รหัสสนามนี้มีอยู่ในระบบแล้ว';
  return res.status(400).json({
    success: false,
    message,
  });
}
```

**การแก้ไข PUT (บรรทัด 135-147):**

**ก่อนแก้ไข:**
```javascript
if (req.body.courtNumber && req.body.courtNumber !== court.courtNumber) {
  const existingCourt = await Court.findOne({
    courtNumber: req.body.courtNumber,
    deletedAt: null,
    _id: { $ne: req.params.id },
  });

  if (existingCourt) {
    return res.status(400).json({
      success: false,
      message: 'รหัสสนามนี้มีอยู่ในระบบแล้ว',
    });
  }
}
```

**หลังแก้ไข:**
```javascript
if (req.body.courtNumber && req.body.courtNumber !== court.courtNumber) {
  const existingCourt = await Court.findOne({
    courtNumber: req.body.courtNumber,
    _id: { $ne: req.params.id },
  });

  if (existingCourt) {
    const message = existingCourt.deletedAt 
      ? 'รหัสสนามนี้เคยใช้แล้ว ไม่สามารถใช้ซ้ำได้'
      : 'รหัสสนามนี้มีอยู่ในระบบแล้ว';
    return res.status(400).json({
      success: false,
      message,
    });
  }
}
```

---

### 5. ProtectedRoute.jsx

**ไฟล์:** `frontend/src/components/ProtectedRoute.jsx`

**ปัญหา:** ไม่ส่ง redirect path ไปกับ login URL

**การแก้ไข:** ทั้งไฟล์

```javascript
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants';
import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, initAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen gradient-blue flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 animate-pulse-glow">
            <span className="text-white font-bold text-4xl">B</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-white/80 text-sm mt-4">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (พร้อมส่ง path ปัจจุบัน)
  if (!isAuthenticated) {
    const redirectPath = location.pathname + location.search;
    return (
      <Navigate 
        to={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectPath)}`} 
        replace 
      />
    );
  }

  // Render children if authenticated
  return children;
}
```

---

### 6. LoginPage.jsx

**ไฟล์:** `frontend/src/pages/LoginPage.jsx`

**ปัญหา:** Hardcode redirect ไป dashboard

**การแก้ไข:**

**1. แก้ไข import (บรรทัด 2):**
```javascript
import { useNavigate, useLocation } from 'react-router-dom';
```

**2. เพิ่มหลัง `const navigate = useNavigate();` (บรรทัด 10):**
```javascript
const location = useLocation();

// ดึง redirect path จาก query params
const searchParams = new URLSearchParams(location.search);
const redirectTo = searchParams.get('redirect') || ROUTES.ADMIN.DASHBOARD;
```

**3. แก้ไข useEffect (บรรทัด 20-25):**
```javascript
useEffect(() => {
  if (isAuthenticated) {
    navigate(redirectTo, { replace: true });
  }
}, [isAuthenticated, navigate, redirectTo]);
```

**4. แก้ไข navigate หลัง login สำเร็จ (บรรทัด 54-55):**
```javascript
navigate(redirectTo, { replace: true });
```

---

### 7. bookings.test.js

**ไฟล์:** `backend/__tests__/bookings.test.js`

**การเพิ่ม:** Test cases สำหรับ customer booking date validation

**เพิ่มท้ายไฟล์ (ก่อน `});` สุดท้าย):**

```javascript
describe('POST /api/bookings/customer - Date Validation', () => {
  let playerToken;
  let testPlayer;

  beforeAll(async () => {
    const Player = require('../models/player.model');
    testPlayer = await Player.create({
      name: 'Test Player',
      phone: '0888888888',
      password: 'password123',
      status: 'active',
    });
    
    playerToken = jwt.sign({ id: testPlayer._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
  });

  afterAll(async () => {
    const Player = require('../models/player.model');
    await Player.deleteMany({ phone: '0888888888' });
  });

  it('should reject booking in the past', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const response = await request(app)
      .post('/api/bookings/customer')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        date: yesterday.toISOString().split('T')[0],
        timeSlot: testTimeSlot._id.toString(),
        duration: 1,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('วันที่ผ่านมาแล้ว');
  });

  it('should reject booking beyond advance booking limit', async () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 30);

    const response = await request(app)
      .post('/api/bookings/customer')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        date: farFuture.toISOString().split('T')[0],
        timeSlot: testTimeSlot._id.toString(),
        duration: 1,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('ล่วงหน้าเกิน');
  });
});
```

---

## ลำดับการทำงาน

```
1. BookingSlotModal.jsx ────► 2. CourtsAddPage.jsx
                                      │
                                      ▼
3. bookings.routes.js ◄──────────────┘
         │
         ▼
4. courts.routes.js
         │
         ▼
5. ProtectedRoute.jsx ────► 6. LoginPage.jsx
                                      │
                                      ▼
                           7. bookings.test.js
                                      │
                                      ▼
                           8. รัน Tests ยืนยัน
```

---

## Commands สำหรับ Testing

```bash
# Backend Tests
cd backend && npm test

# E2E Tests
cd frontend && npm run test:e2e

# Run both servers for manual testing
npm run dev
```

---

## Rollback Plan

หากเกิดปัญหา สามารถ revert ได้ด้วย:

```bash
git checkout -- frontend/src/components/customer/BookingSlotModal.jsx
git checkout -- frontend/src/pages/admin/settings/courts/CourtsAddPage.jsx
git checkout -- backend/routes/bookings.routes.js
git checkout -- backend/routes/courts.routes.js
git checkout -- frontend/src/components/ProtectedRoute.jsx
git checkout -- frontend/src/pages/LoginPage.jsx
git checkout -- backend/__tests__/bookings.test.js
```

---

## สถานะการดำเนินการ

| # | รายการ | สถานะ | หมายเหตุ |
|---|--------|--------|----------|
| 1 | BookingSlotModal.jsx | [x] Completed | เพิ่ม else handling + ป้องกันกดซ้ำ |
| 2 | CourtsAddPage.jsx | [x] Completed | เพิ่ม else handling |
| 3 | bookings.routes.js | [x] Completed | เพิ่ม date validation (วันอดีต, advanceBookingDays, dayType) |
| 4 | courts.routes.js | [x] Completed | ห้ามใช้ courtNumber ซ้ำตลอดไป |
| 5 | ProtectedRoute.jsx | [x] Completed | ส่ง redirect path |
| 6 | LoginPage.jsx | [x] Completed | ใช้ redirect path หลัง login |
| 7 | bookings.test.js | [x] Completed | เพิ่ม 3 test cases สำหรับ date validation |
| 8 | CustomerProtectedRoute.jsx | [x] Completed | เพิ่ม initAuth() เพื่อโหลด token จาก localStorage |
| 9 | Run Backend Tests | [x] Completed | Tests ใหม่ผ่านหมด (3/3) |
| 10 | Run E2E Tests | [x] Completed | 98/102 ผ่าน (96%) |

---

## สรุปผลการทดสอบ

### Backend Tests (Jest)
- **Tests ใหม่ที่เพิ่ม (3 ตัว):** ผ่านหมด ✅
  - ✓ should reject booking in the past
  - ✓ should reject booking beyond advance booking limit
  - ✓ should reject booking with mismatched dayType

### E2E Tests (Playwright)
- **Auth Tests:** 20/20 ผ่าน ✅
- **Bookings Tests:** 15/15 ผ่าน ✅
- **Settings Tests:** 23/23 ผ่าน ✅
- **POS Tests:** 29/29 ผ่าน ✅
- **รวม:** 98/102 ผ่าน (96%)

### หมายเหตุ
- Test ที่ fail อยู่เดิม (4 ตัว) ไม่เกี่ยวกับการแก้ไขครั้งนี้:
  - 2 ตัวใน groupplay.spec.js (UI issues)
  - 2 ตัวใน sales-history.spec.js (UI issues)

---

*สร้างเมื่อ: 2025-12-08*
*อัปเดตล่าสุด: 2025-12-08*
*สถานะ: ✅ Implementation เสร็จสมบูรณ์*
