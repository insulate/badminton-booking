# Test Plan: Customer Court Selection Feature

## Context

ระบบจองสนามแบดมินตัน (Badminton Court Booking System)
เพิ่ง implement feature ใหม่: ลูกค้าสามารถเลือกสนามเองได้ตอนจอง และสนามติด lock ทันทีโดยไม่ต้องรอ admin assign

---

## Environment

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- ต้องมี account ลูกค้า (player) และ admin อยู่แล้วในระบบ
- สนามต้องมีสถานะ `available` อย่างน้อย 2 สนาม

---

## API ที่เปลี่ยนแปลง

### ใหม่: `GET /api/bookings/public/court-availability`

```
Query: ?date=YYYY-MM-DD&timeSlotId=<id>&duration=1&startMinute=0
Response: { success: true, data: { courts: [{ _id, courtNumber, name, type }] } }
```

### แก้ไข: `POST /api/bookings/customer`

```
Body: { date, timeSlot, duration, court }  ← court เป็น required ใหม่
```

---

## Test Cases

### [TC-01] API: court-availability endpoint — Happy path

**วิธีทดสอบ:**
1. เรียก `GET /api/bookings/public/availability?date=<วันพรุ่งนี้>` เพื่อเอา `timeSlotId` ที่มีสนามว่าง
2. เรียก `GET /api/bookings/public/court-availability?date=<วันเดียวกัน>&timeSlotId=<id>&duration=1`

**ผลที่คาดหวัง:**
- status 200
- `data.courts` เป็น array ของสนามที่ว่าง
- แต่ละสนามมี field: `_id`, `courtNumber`, `name`, `type`
- ไม่มีสนามที่ `status != 'available'` หรือถูกจองแล้วปรากฏใน list

---

### [TC-02] API: court-availability — missing params

**วิธีทดสอบ:**
- `GET /api/bookings/public/court-availability` (ไม่ส่ง param ใดเลย)
- `GET /api/bookings/public/court-availability?date=2025-01-01` (ไม่มี timeSlotId)

**ผลที่คาดหวัง:**
- status 400
- message: `'กรุณาระบุวันที่และช่วงเวลา'`

---

### [TC-03] API: court-availability — duration ต่างกัน

**วิธีทดสอบ:**
1. จองสนาม A ไว้ 1 ชม. ที่ slot 09:00 (status: `confirmed` หรือ `payment_pending`)
2. เรียก court-availability ด้วย `duration=1` → สนาม A ต้องไม่อยู่ใน list
3. เรียก court-availability ด้วย `duration=2` (09:00–11:00) → สนาม A ต้องไม่อยู่ใน list
4. เรียก court-availability ด้วย `duration=1` แต่เป็น slot 10:00 → สนาม A ต้องอยู่ใน list (ช่วงนั้นไม่ถูกจอง)

**ผลที่คาดหวัง:** duration ส่งผลต่อผลลัพธ์ถูกต้อง

---

### [TC-04] API: POST /customer — จองโดยไม่ส่ง court field

**วิธีทดสอบ:**
```http
POST /api/bookings/customer
Authorization: Bearer <playerToken>
Content-Type: application/json

{ "date": "<วันพรุ่งนี้>", "timeSlot": "<id>", "duration": 1 }
```

**ผลที่คาดหวัง:**
- status 400
- message: `'กรุณาเลือกสนาม'`

---

### [TC-05] API: POST /customer — ส่ง court ที่ไม่มีในระบบ

**วิธีทดสอบ:**
```http
POST /api/bookings/customer
Authorization: Bearer <playerToken>

{ "date": "<วันพรุ่งนี้>", "timeSlot": "<id>", "duration": 1, "court": "000000000000000000000000" }
```

**ผลที่คาดหวัง:**
- status 400
- message: `'ไม่พบสนามที่เลือก หรือสนามไม่เปิดให้ใช้งาน'`

---

### [TC-06] API: POST /customer — จองสนามที่ถูกจองแล้ว (race condition)

**วิธีทดสอบ:**
1. จองสนาม A ที่ slot X duration 1 ชม. ไว้แล้ว (status: `payment_pending` หรือ `confirmed`)
2. ส่ง POST อีกครั้งด้วยสนาม A / slot X / duration เดิม

**ผลที่คาดหวัง:**
- status 409
- message: `'สนามนี้ถูกจองแล้วในช่วงเวลาที่เลือก กรุณาเลือกสนามอื่น'`

---

### [TC-07] API: POST /customer — จองสำเร็จ

**วิธีทดสอบ:**
```http
POST /api/bookings/customer
Authorization: Bearer <playerToken>

{ "date": "<วันพรุ่งนี้>", "timeSlot": "<id>", "duration": 1, "court": "<courtId ที่ว่าง>" }
```

**ผลที่คาดหวัง:**
- status 201
- `data.court` ต้องไม่เป็น `null` — ต้องเป็น courtId ที่ส่งไป
- `data.bookingStatus`: `'payment_pending'`
- `data.bookingCode` มีค่า

---

### [TC-08] UI: Modal แสดงสนามให้เลือก

**วิธีทดสอบ:**
1. Login ด้วย account ลูกค้า → ไปที่ `/booking`
2. เลือกวันที่มีสนามว่าง → คลิก "จองเลย" ที่ช่วงเวลาใดช่วงหนึ่ง

**ผลที่คาดหวัง:**
- Modal เปิดขึ้นมา
- มี section "เลือกสนาม" แสดง card สนามที่ว่าง
- ขณะ loading แสดง skeleton (กระพริบ) 4 ช่อง
- ปุ่ม "ยืนยันการจอง" ยัง disabled (สีจาง) เพราะยังไม่เลือกสนาม

---

### [TC-09] UI: เปลี่ยน duration → สนามที่เลือกต้อง reset

**วิธีทดสอบ:**
1. เปิด modal → เลือก duration 1 ชม. → เลือกสนาม A (border เปลี่ยนเป็นสีน้ำเงิน)
2. เปลี่ยน duration เป็น 2 ชม.

**ผลที่คาดหวัง:**
- สนาม A ถูก deselect ทันที (border สีน้ำเงินหายไป)
- ระบบ fetch สนามใหม่สำหรับ 2 ชม. (skeleton loading)
- ปุ่ม "ยืนยันการจอง" กลับเป็น disabled

---

### [TC-10] UI: กดจองโดยไม่เลือกสนาม

**วิธีทดสอบ:**
- เปิด modal → ไม่เลือกสนาม → พยายามกดปุ่ม "ยืนยันการจอง"

**ผลที่คาดหวัง:**
- ปุ่มยัง disabled (กดไม่ได้) ตราบใดที่ไม่มีสนามถูกเลือก
- ถ้า onClick ถูกเรียกได้ → toast error `'กรุณาเลือกสนาม'`

---

### [TC-11] UI: จองสำเร็จ end-to-end

**วิธีทดสอบ:**
1. Login → `/booking` → เลือกวัน → คลิก slot → เลือก duration → เลือกสนาม
2. สังเกตว่า summary ด้านล่างแสดง `"สนาม A1 — ชื่อสนาม"`
3. กด "ยืนยันการจอง"

**ผลที่คาดหวัง:**
- Redirect ไป `/payment/:bookingId`
- หน้า payment แสดงข้อมูลถูกต้อง
- ตรวจสอบใน DB: `booking.court` ต้องไม่เป็น `null`

---

### [TC-12] UI: สถานะสนามเต็ม

**วิธีทดสอบ (row-level — flow ปกติ):**
- จองสนามทุกสนามในช่วงเวลาหนึ่งให้เต็ม
- ดูที่ booking page

**ผลที่คาดหวัง (row-level):**
- row แสดง **"เต็มแล้ว"** (สีแดง)
- ปุ่มแสดงเป็น **"เต็ม"** (สีเทา, disabled) — modal ไม่เปิด
- slot ก่อนหน้า: duration options ที่จะ overlap slot เต็ม ถูกตัดออกอัตโนมัติ (เช่น slot 17:00 เสนอแค่ 30 น./1 ชม. ถ้า 18:00 เต็ม)

**วิธีทดสอบ (race-condition — modal เปิดอยู่แล้ว):**
1. เปิด modal ที่ slot ยังว่าง
2. ระหว่างนั้นให้ผู้ใช้อื่นจองสนามทั้งหมดในช่วงนั้น
3. เปลี่ยน duration ใน modal (trigger re-fetch)

**ผลที่คาดหวัง (race-condition):**
- แสดงข้อความ `'ไม่มีสนามว่างในช่วงเวลานี้'` (ตัวอักษรสีแดง)
- ปุ่ม "ยืนยันการจอง" disabled

---

### [TC-13] Admin: booking ใหม่แสดงสนามทันที

**วิธีทดสอบ:**
1. ทำการจองใหม่ (TC-11) ให้สำเร็จ
2. Login admin → ไปที่ Booking Management
3. หา booking ที่เพิ่งสร้าง

**ผลที่คาดหวัง:**
- booking แสดงชื่อสนามที่ลูกค้าเลือก (ไม่ใช่ `"-"` หรือ `"ยังไม่ assign"`)

---

### [TC-14] Admin: ยกเลิก booking → สนามว่างคืน

**วิธีทดสอบ:**
1. จองสนาม A / slot X สำเร็จ (status: `payment_pending`)
2. Admin cancel booking นั้น
3. เรียก `GET /api/bookings/public/court-availability?date=...&timeSlotId=...&duration=1`

**ผลที่คาดหวัง:**
- สนาม A กลับมาอยู่ใน `courts` list
- ลูกค้าอื่นสามารถจองสนาม A / slot เดิมได้

---

## สิ่งที่ต้องรายงาน

สำหรับแต่ละ TC ให้บันทึก:

| TC | Result | หมายเหตุ |
|----|--------|---------|
| TC-01 | PASS / FAIL | |
| TC-02 | PASS / FAIL | |
| TC-03 | PASS / FAIL | |
| TC-04 | PASS / FAIL | |
| TC-05 | PASS / FAIL | |
| TC-06 | PASS / FAIL | |
| TC-07 | PASS / FAIL | |
| TC-08 | PASS / FAIL | |
| TC-09 | PASS / FAIL | |
| TC-10 | PASS / FAIL | |
| TC-11 | PASS / FAIL | |
| TC-12 | PASS / FAIL | |
| TC-13 | PASS / FAIL | |
| TC-14 | PASS / FAIL | |

ถ้า FAIL ให้ระบุ: ผลที่ได้จริง vs ผลที่คาดหวัง + response body หรือ screenshot ประกอบ
