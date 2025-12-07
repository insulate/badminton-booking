# Customer Pages Mockup Plan

## Overview

สร้างหน้า Frontend สำหรับ Customer (Public) 3 หน้า:
1. **หน้าแผนผัง** - แสดงรูป placeholder แผนผังสนาม
2. **หน้าเงื่อนไขการจอง** - แสดงข้อความเงื่อนไข 10 ข้อ + ข้อมูลติดต่อ
3. **หน้าจองสนาม** - ตาราง Court x Time (mockup data) - ดูอย่างเดียว

**Reference:** https://www.plkbadminton.com

---

## Mockup Data

| รายการ | ค่า |
|--------|-----|
| ชื่อสนาม | **Lucky Badminton** |
| จำนวนสนาม | 8 สนาม (Court 1-8) |
| เวลาเปิด-ปิด | 08:00 - 24:00 (16 time slots) |
| เวลาวันอาทิตย์ | 08:00 - 22:00 |
| ข้อมูลติดต่อ | Placeholder |

### ข้อมูลติดต่อ (Placeholder)

```
เบอร์โทร: 099-999-9999
LINE: @luckybadminton
Facebook: Lucky Badminton
Instagram: @luckybadminton
```

---

## URL Structure

| URL | หน้า | Access |
|-----|------|--------|
| `/` | แผนผัง (HomePage) | Public |
| `/rules` | เงื่อนไขการจอง (RulesPage) | Public |
| `/booking` | จองสนาม (CustomerBookingPage) | Public |
| `/login` | Login | Public |
| `/admin/*` | Admin pages | Protected |

---

## Files to Create/Modify

### New Files

```
frontend/src/
├── components/
│   └── customer/
│       └── CustomerLayout.jsx       # Layout + Bottom Navigation
├── pages/
│   └── customer/
│       ├── HomePage.jsx             # หน้าแผนผัง (placeholder image)
│       ├── RulesPage.jsx            # หน้าเงื่อนไขการจอง
│       └── CustomerBookingPage.jsx  # หน้าจองสนาม (mockup grid)
```

### Modified Files

- `frontend/src/constants/routes.js` - เพิ่ม Customer routes
- `frontend/src/App.jsx` - เพิ่ม Public routes

---

## Implementation Details

### 1. CustomerLayout.jsx

**Location:** `frontend/src/components/customer/CustomerLayout.jsx`

**Features:**
- **Header:** โลโก้ (badminton icon) + "Lucky Badminton"
- **Main Content:** `<Outlet />` สำหรับ nested routes
- **Bottom Navigation (fixed):** 3 ปุ่ม
  - แผนผัง (`/`) - icon: MapIcon
  - เงื่อนไขการจอง (`/rules`) - icon: DocumentTextIcon
  - จองสนาม (`/booking`) - icon: CalendarIcon

**Design:**
- Background: `bg-gradient-to-b from-blue-900 to-blue-800`
- Bottom nav: `bg-blue-950` with `text-yellow-400` for active state
- Mobile-first responsive

---

### 2. HomePage.jsx (แผนผัง)

**Location:** `frontend/src/pages/customer/HomePage.jsx`

**Features:**
- Full-screen placeholder image แสดงแผนผังสนาม
- ใช้ SVG illustration หรือ placeholder
- Responsive image sizing

**Content:**
- แสดงรูป placeholder ของแผนผังสนาม 8 สนาม
- อาจใช้ simple SVG diagram หรือ placeholder image

---

### 3. RulesPage.jsx (เงื่อนไขการจอง)

**Location:** `frontend/src/pages/customer/RulesPage.jsx`

**Features:**
- พื้นหลัง: gradient น้ำเงิน
- หัวข้อ: "เงื่อนไขการจองสนามแบดมินตัน" (กรอบเหลือง)
- เนื้อหา: 10 ข้อ (2 คอลัมน์บน desktop, 1 คอลัมน์บน mobile)
- ข้อมูลติดต่อด้านล่างขวา

**เนื้อหาเงื่อนไข 10 ข้อ:**

```
1. ราคาและเงื่อนไขการจองสนามนี้ จะเริ่มมีผลตั้งแต่ 1 มกราคม 2568 เป็นต้นไป

2. ลูกค้าสามารถจองสนามล่วงหน้าได้สูงสุด 2 เดือน โดยระบบจะขยายระยะเวลาการจอง วันต่อวัน
   ตัวอย่างเช่น:
   • วันที่ 1 ต.ค. สามารถจองได้ถึงวันที่ 30 พ.ย.
   • วันที่ 2 ต.ค. สามารถจองได้ถึงวันที่ 1 ธ.ค.
   • วันที่ 3 ต.ค. สามารถจองได้ถึงวันที่ 2 ธ.ค.

3. ทางสนามขอสงวนสิทธิ์ในการคืนเงินค่าบริการสนามแบดมินตันในทุกกรณี

4. ทางสนามขอสงวนสิทธิ์ในการยกเลิกการจอง / เปลี่ยน, เลื่อน, ย้ายวันหรือเวลาการจอง หรือฝากขายสนาม

5. การโอนชำระการจองสนาม ลูกค้าจะต้องโอนชำระเต็มจำนวนเท่านั้น

6. หากลูกค้าทำการจองสนามเรียบร้อยแล้ว ลูกค้าจะต้องโอนชำระเงินภายใน 5 นาที
   (หากเกินระยะเวลาที่กำหนด ระบบจะทำการยกเลิกการจองทันที)
   
   ในกรณีลูกค้าจองผ่านเว็บไซต์:
   • หลังจากทำการจองผ่านเว็บไซต์และโอนเงินชำระแล้ว ให้ลูกค้าแคปหน้าจอรายละเอียดการจอง
     เพื่อแสดงต่อเจ้าหน้าที่เมื่อมาถึงสนาม

7. เมื่อเข้าใช้บริการ ขอความร่วมมือลูกค้าโปรดรักษาความสะอาดในบริเวณสนาม และไม่สร้างความรบกวนต่อผู้อื่น

8. เมื่อสิ้นสุดเวลาการจอง ลูกค้าจะต้องออกจากสนาม เพื่อให้ลูกค้าท่านต่อไปเข้าใช้บริการในชั่วโมงถัดไป

9. ก่อนทำการจองสนาม ขอความร่วมมือลูกค้าทุกท่านอ่านและทำความเข้าใจเงื่อนไขการจองสนามอย่างละเอียดก่อนทำการจอง

10. ทางสนามขอสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไขโดยไม่ต้องแจ้งให้ทราบล่วงหน้า
```

**ข้อมูลติดต่อ (ด้านล่างขวา):**
- โลโก้ "Lucky Badminton"
- เวลาเปิด: จ-ส 08:00-24:00 น. / อา 08:00-22:00 น.
- LINE QR Code placeholder
- TEL: 099-999-9999
- FACEBOOK: Lucky Badminton
- INSTAGRAM: @luckybadminton

---

### 4. CustomerBookingPage.jsx (จองสนาม)

**Location:** `frontend/src/pages/customer/CustomerBookingPage.jsx`

**Features:**
- Header: "Reservation Courts"
- Date picker: เลือกวันที่
- ตาราง Grid แสดง Court x Time

**ตาราง Structure:**
```
            │ 08:00 │ 09:00 │ 10:00 │ 11:00 │ ... │ 23:00 │
────────────┼───────┼───────┼───────┼───────┼─────┼───────┤
Court 1     │  ✓    │  ✗    │  ✓    │  ✓    │     │  ✓    │
Court 2     │  ✗    │  ✗    │  ✓    │  ✓    │     │  ✓    │
Court 3     │  ✓    │  ✓    │  ✓    │  ✗    │     │  ✗    │
Court 4     │  ✓    │  ✓    │  ✗    │  ✗    │     │  ✓    │
Court 5     │  ✓    │  ✓    │  ✓    │  ✓    │     │  ✓    │
Court 6     │  ✗    │  ✓    │  ✓    │  ✓    │     │  ✗    │
Court 7     │  ✓    │  ✗    │  ✗    │  ✓    │     │  ✓    │
Court 8     │  ✓    │  ✓    │  ✓    │  ✓    │     │  ✓    │

✓ = ว่าง (available) - สีเขียว/ขาว
✗ = จองแล้ว (booked) - สีแดง/เทา
```

**Time Slots (16 slots):**
- 08:00-09:00, 09:00-10:00, 10:00-11:00, 11:00-12:00
- 12:00-13:00, 13:00-14:00, 14:00-15:00, 15:00-16:00
- 16:00-17:00, 17:00-18:00, 18:00-19:00, 19:00-20:00
- 20:00-21:00, 21:00-22:00, 22:00-23:00, 23:00-24:00

**Mockup Data:**
- Hardcoded random availability (บาง slot ว่าง บาง slot จองแล้ว)
- ใช้ seed pattern เพื่อให้ดูสมจริง

**Responsive:**
- Desktop: แสดงตารางเต็ม
- Mobile: Horizontal scroll

---

### 5. routes.js (แก้ไข)

**Location:** `frontend/src/constants/routes.js`

**Changes:**
```javascript
export const ROUTES = {
  // Customer Routes (Public)
  CUSTOMER: {
    HOME: '/',
    RULES: '/rules',
    BOOKING: '/booking',
  },

  // Authentication
  LOGIN: '/login',

  // Admin Routes (Protected)
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    // ... existing routes
  },

  // Legacy - keep for backward compatibility
  ROOT: '/',
};
```

---

### 6. App.jsx (แก้ไข)

**Location:** `frontend/src/App.jsx`

**Changes:**

Add imports:
```javascript
// Customer Pages
import CustomerLayout from './components/customer/CustomerLayout';
import HomePage from './pages/customer/HomePage';
import RulesPage from './pages/customer/RulesPage';
import CustomerBookingPage from './pages/customer/CustomerBookingPage';
```

Update routes:
```jsx
<Routes>
  {/* Customer Public Routes */}
  <Route element={<CustomerLayout />}>
    <Route path={ROUTES.CUSTOMER.HOME} element={<HomePage />} />
    <Route path={ROUTES.CUSTOMER.RULES} element={<RulesPage />} />
    <Route path={ROUTES.CUSTOMER.BOOKING} element={<CustomerBookingPage />} />
  </Route>

  {/* Auth Routes */}
  <Route path={ROUTES.LOGIN} element={<LoginPage />} />

  {/* Protected Admin Routes */}
  <Route
    path={ROUTES.ADMIN.ROOT}
    element={
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    }
  >
    {/* ... existing admin routes */}
  </Route>

  {/* Catch all - redirect to home */}
  <Route path="*" element={<Navigate to={ROUTES.CUSTOMER.HOME} replace />} />
</Routes>
```

---

## Design Specifications

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#1e3a8a` (blue-800) | Background, headers |
| Dark Blue | `#172554` (blue-950) | Bottom navigation |
| Accent Yellow | `#fbbf24` (yellow-400) | Active states, highlights |
| Light Yellow | `#fef3c7` (yellow-100) | Title backgrounds |
| Available | `#22c55e` (green-500) | Available slots |
| Booked | `#ef4444` (red-500) | Booked slots |
| Text Light | `#ffffff` | Primary text on dark bg |

### Typography

- หัวข้อหลัก: `text-2xl font-bold`
- หัวข้อรอง: `text-xl font-semibold`
- เนื้อหา: `text-base`
- หมายเหตุ: `text-sm text-gray-300`

### Responsive Breakpoints

- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md)
- Desktop: > 1024px (lg)

---

## Future Enhancements (Phase 2)

หลังจาก mockup เสร็จแล้ว จะทำต่อ:

- [ ] สร้าง Public API สำหรับดู courts, timeslots, availability
- [ ] เชื่อมต่อ API จริงแทน mockup data
- [ ] ระบบ Customer Login/Register
- [ ] ระบบจองจริง + แสดง QR Code / ข้อมูลบัญชี
- [ ] ระบบอัพโหลดสลิปการโอนเงิน
- [ ] Admin สามารถ upload รูปแผนผัง/เงื่อนไขได้
- [ ] Notification ยืนยันการจอง (LINE/Email)

---

## Execution Checklist

- [ ] 1. สร้าง `frontend/src/components/customer/CustomerLayout.jsx`
- [ ] 2. สร้าง `frontend/src/pages/customer/HomePage.jsx`
- [ ] 3. สร้าง `frontend/src/pages/customer/RulesPage.jsx`
- [ ] 4. สร้าง `frontend/src/pages/customer/CustomerBookingPage.jsx`
- [ ] 5. แก้ไข `frontend/src/constants/routes.js`
- [ ] 6. แก้ไข `frontend/src/App.jsx`
- [ ] 7. ทดสอบ navigation ทั้ง 3 หน้า
- [ ] 8. ทดสอบ responsive (mobile/desktop)

---

## Notes

- ทั้ง 3 หน้าเป็น Public (ไม่ต้อง login)
- หน้าจองสนามแค่ดูตารางว่าง/ไม่ว่าง (mockup data)
- ยังไม่ต้องทำระบบ login/จอง/ชำระเงินจริง
- ใช้ TailwindCSS สำหรับ styling (เหมือน project ที่มีอยู่)
