import { test, expect, request as playwrightRequest } from '@playwright/test';
import { readFileSync } from 'fs';
import { AdminBookingPage } from '../pages/AdminBookingPage.js';
import { AdminBookingsListPage } from '../pages/AdminBookingsListPage.js';
import { RecurringBookingPage } from '../pages/RecurringBookingPage.js';

const BASE = 'http://localhost:3000';

// ── Helpers ────────────────────────────────────────────────────────────────────
async function waitForToast(page, textOrRegex) {
  await expect(page.getByText(textOrRegex)).toBeVisible({ timeout: 8000 });
}

async function waitForToastsToClear(page) {
  await page.waitForFunction(
    () => !document.querySelector('[data-rht-toaster]')?.firstElementChild,
    { timeout: 8000 }
  ).catch(() => {});
}

// วันที่ Bangkok (UTC+7) เป็น YYYY-MM-DD
function getBkkDateStr(offsetDays = 0) {
  const ms = Date.now() + 7 * 60 * 60 * 1000 + offsetDays * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

// ──────────────────────────────────────────────────────────────────────────────
test.describe('Booking System E2E (/admin/booking, /admin/bookings, /admin/recurring-bookings)', () => {
  test.describe.configure({ mode: 'serial' });

  let token;
  let courtId;
  let timeSlotId;
  let todayStr;
  let tomorrowStr;
  let dayAfterStr;

  // สร้างผ่าน UI ใน T8
  let bookingIdFromUI = null;
  let bookingCodeFromUI = null;

  // สร้างผ่าน API ใน beforeAll สำหรับ T17 (mark paid) และ T18 (cancel)
  let bookingIdForMgmt = null;
  let bookingIdToCancel = null;

  // สร้างใน recurring section (T20)
  let recurringGroupId = null;
  let recurringGroupCode = null;

  // ── beforeAll ───────────────────────────────────────────────────────────────
  test.beforeAll(async () => {
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;
    if (!token) return;

    todayStr = getBkkDateStr(0);
    tomorrowStr = getBkkDateStr(1);
    dayAfterStr = getBkkDateStr(2);

    const ctx = await playwrightRequest.newContext();
    const headers = { Authorization: `Bearer ${token}` };

    // 1. ดึง court แรกที่ไม่ได้ลบ
    const courtsRes = await ctx.get(`${BASE}/api/courts`, { headers });
    if (courtsRes.ok()) {
      const { data: courts } = await courtsRes.json();
      courtId = courts?.find((c) => !c.deletedAt)?._id ?? null;
    }

    // 2. ดึง timeslot active แรก
    const tsRes = await ctx.get(`${BASE}/api/timeslots`, { headers });
    if (tsRes.ok()) {
      const { data: slots } = await tsRes.json();
      timeSlotId = slots?.find((s) => s.status === 'active')?._id ?? null;
    }

    if (!courtId || !timeSlotId) {
      await ctx.dispose();
      return;
    }

    // 3. สร้าง booking สำหรับ T17 (mark paid)
    const mgmtRes = await ctx.post(`${BASE}/api/bookings`, {
      headers,
      data: {
        court: courtId,
        timeSlot: timeSlotId,
        date: dayAfterStr,
        customer: { name: 'Test Booking Mgmt', phone: '0897654321' },
        duration: 1,
      },
    });
    if (mgmtRes.ok()) {
      const mgmtData = await mgmtRes.json();
      bookingIdForMgmt = mgmtData.data?._id ?? null;
    }

    // 4. สร้าง booking สำหรับ T18 (cancel) — ใช้วันต่างออกไปเพื่อไม่ชน availability
    const cancelRes = await ctx.post(`${BASE}/api/bookings`, {
      headers,
      data: {
        court: courtId,
        timeSlot: timeSlotId,
        date: getBkkDateStr(3),
        customer: { name: 'Test Booking Cancel', phone: '0896543210' },
        duration: 1,
      },
    });
    if (cancelRes.ok()) {
      const cancelData = await cancelRes.json();
      bookingIdToCancel = cancelData.data?._id ?? null;
    }

    await ctx.dispose();
  });

  // ── afterAll ────────────────────────────────────────────────────────────────
  test.afterAll(async () => {
    if (!token) return;
    const ctx = await playwrightRequest.newContext();
    const headers = { Authorization: `Bearer ${token}` };

    // ยกเลิก bookings ที่เหลืออยู่
    for (const id of [bookingIdFromUI, bookingIdForMgmt, bookingIdToCancel]) {
      if (id) {
        await ctx.patch(`${BASE}/api/bookings/${id}/cancel`, { headers }).catch(() => {});
      }
    }

    // ยกเลิก recurring group
    if (recurringGroupId) {
      await ctx.patch(`${BASE}/api/recurring-bookings/${recurringGroupId}/cancel`, { headers }).catch(() => {});
    }

    // ลบ blocked date ที่เพิ่มไว้ (safety net)
    await ctx.delete(`${BASE}/api/settings/blocked-dates/${tomorrowStr}`, { headers }).catch(() => {});

    await ctx.dispose();
  });

  // ════════════════════════════════════════════════════════════════════════════
  // Section A: AdminBookingPage (/admin/booking)
  // ════════════════════════════════════════════════════════════════════════════

  test('T1 — AdminBookingPage โหลดสำเร็จ แสดง heading, schedule table, blocked dates section', async ({ page }) => {
    const p = new AdminBookingPage(page);
    await p.goto(todayStr);

    await expect(p.heading).toBeVisible();
    await expect(p.scheduleTable).toBeVisible();
    await expect(page.getByRole('heading', { name: 'วันปิดการจอง' })).toBeVisible();
  });

  test('T2 — CourtScheduleGrid แสดงสนามและ time slots', async ({ page }) => {
    const p = new AdminBookingPage(page);
    await p.goto(todayStr);
    await p.waitForScheduleLoaded();

    // มีแถว court อย่างน้อย 1 แถว
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // มี header column เวลา (HH:MM)
    const headers = page.locator('table thead th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(1); // > 1 (คอลัมน์แรกคือ "สนาม")
  });

  test('T3 — เพิ่ม blocked date สำเร็จ', async ({ page }) => {
    const p = new AdminBookingPage(page);
    await p.goto(todayStr);

    await p.blockedDateInput.fill(tomorrowStr);
    await p.blockedReasonInput.fill('E2E Test Block');
    await p.addBlockedDateBtn.click();
    await waitForToast(page, 'เพิ่มวันปิดการจองสำเร็จ');

    await expect(page.getByText('E2E Test Block')).toBeVisible({ timeout: 5000 });
  });

  test('T4 — ลบ blocked date สำเร็จ', async ({ page }) => {
    const p = new AdminBookingPage(page);
    await p.goto(todayStr);

    // หาแถวที่มี "E2E Test Block" แล้วคลิก trash icon
    const row = page.locator('div, li').filter({ hasText: 'E2E Test Block' }).first();
    await row.waitFor({ state: 'visible', timeout: 8000 });

    // dialog handler ต้องมาก่อน click (handleRemoveBlockedDate ใช้ window.confirm)
    page.once('dialog', (d) => d.accept());
    await row.locator('[data-tooltip="ลบ"]').click();

    await waitForToast(page, 'ลบวันปิดการจองสำเร็จ');
    await expect(page.getByText('E2E Test Block')).not.toBeVisible({ timeout: 5000 });
  });

  test('T5 — คลิก slot ที่ว่าง → BookingModal เปิด, ปิดได้', async ({ page }) => {
    const p = new AdminBookingPage(page);
    await p.goto(todayStr);
    await p.waitForScheduleLoaded();

    const hasSlot = await p.firstAvailableSlot.isVisible().catch(() => false);
    if (!hasSlot) test.skip(true, 'ไม่มี slot ว่างในวันนี้');

    await p.openFirstAvailableSlot();
    await expect(p.modalHeading).toBeVisible();
    // แสดงข้อมูล court + เวลา
    await expect(page.getByText('สนาม:')).toBeVisible();

    // ปิด modal
    await p.cancelModalBtn.click();
    await expect(p.modalHeading).not.toBeVisible({ timeout: 5000 });
  });

  test('T6 — BookingModal validation: ไม่กรอกชื่อ → แสดง error', async ({ page }) => {
    const p = new AdminBookingPage(page);
    await p.goto(todayStr);
    await p.waitForScheduleLoaded();

    const hasSlot = await p.firstAvailableSlot.isVisible().catch(() => false);
    if (!hasSlot) test.skip(true, 'ไม่มี slot ว่างในวันนี้');

    await p.openFirstAvailableSlot();
    // กรอก phone แต่ไม่กรอก name
    await p.customerPhoneInput.fill('0891234567');
    await p.confirmBookingBtn.click();

    await expect(page.getByText('กรุณากรอกชื่อลูกค้า')).toBeVisible({ timeout: 5000 });
    // modal ยังเปิดอยู่
    await expect(p.modalHeading).toBeVisible();
  });

  test('T7 — BookingModal validation: เบอร์โทรผิดรูปแบบ → แสดง error', async ({ page }) => {
    const p = new AdminBookingPage(page);
    await p.goto(todayStr);
    await p.waitForScheduleLoaded();

    const hasSlot = await p.firstAvailableSlot.isVisible().catch(() => false);
    if (!hasSlot) test.skip(true, 'ไม่มี slot ว่างในวันนี้');

    await p.openFirstAvailableSlot();
    await p.customerNameInput.fill('Test');
    await p.customerPhoneInput.fill('12345'); // ผิดรูปแบบ
    await p.confirmBookingBtn.click();

    await expect(page.getByText('รูปแบบเบอร์โทรไม่ถูกต้อง')).toBeVisible({ timeout: 5000 });
  });

  test('T8 — สร้างการจองสำเร็จ → toast + slot เปลี่ยนสี', async ({ page }) => {
    const p = new AdminBookingPage(page);
    await p.goto(todayStr);
    await p.waitForScheduleLoaded();

    const hasSlot = await p.firstAvailableSlot.isVisible().catch(() => false);
    if (!hasSlot) test.skip(true, 'ไม่มี slot ว่างในวันนี้ — ไม่สามารถสร้างการจองผ่าน UI ได้');

    await p.openFirstAvailableSlot();
    await p.customerNameInput.fill('Test Booking Customer');
    await p.customerPhoneInput.fill('0891234567');
    await p.durationSelect.selectOption('1'); // 1 ชั่วโมง
    // เลือก "ชำระแล้ว" เพื่อให้ check-in ได้ใน T16
    await p.paidStatusBtn.click();
    await p.confirmBookingBtn.click();

    // รอ toast สำเร็จ
    const toastLocator = page.getByText(/จองสำเร็จ.*รหัสจอง/);
    await toastLocator.waitFor({ timeout: 10000 });
    const toastText = await toastLocator.textContent();
    bookingCodeFromUI = toastText?.match(/BK\w+/)?.[0] ?? null;

    // modal ปิดแล้ว
    await expect(p.modalHeading).not.toBeVisible({ timeout: 5000 });

    // เก็บ bookingId จาก API
    if (bookingCodeFromUI && token) {
      const ctx = await playwrightRequest.newContext();
      const res = await ctx.get(`${BASE}/api/bookings?bookingCode=${bookingCodeFromUI}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok()) {
        const data = await res.json();
        bookingIdFromUI = data.data?.[0]?._id ?? null;
      }
      await ctx.dispose();
    }
  });

  // ════════════════════════════════════════════════════════════════════════════
  // Section B: AdminBookingsPage (/admin/bookings)
  // ════════════════════════════════════════════════════════════════════════════

  test('T9 — AdminBookingsPage โหลดสำเร็จ แสดง heading, filter, table', async ({ page }) => {
    const p = new AdminBookingsListPage(page);
    await p.goto();

    await expect(p.heading).toBeVisible();
    await expect(p.searchInput).toBeVisible();
    await expect(p.statusSelect).toBeVisible();
    await expect(p.applyFilterBtn).toBeVisible();
  });

  test('T10 — การจองจาก T8 ปรากฏในตาราง (search by code)', async ({ page }) => {
    if (!bookingCodeFromUI) test.skip(true, 'ไม่มี bookingCodeFromUI จาก T8 — ข้ามเทสนี้');

    const p = new AdminBookingsListPage(page);
    await p.goto();
    await p.searchByCode(bookingCodeFromUI);

    const row = p.getBookingRow(bookingCodeFromUI);
    await expect(row).toBeVisible({ timeout: 8000 });
    await expect(row.getByText('Test Booking')).toBeVisible();
  });

  test('T11 — Filter by date = วันนี้ → เห็นการจองที่สร้างใน T8', async ({ page }) => {
    if (!bookingCodeFromUI) test.skip(true, 'ไม่มี bookingCodeFromUI จาก T8');

    const p = new AdminBookingsListPage(page);
    await p.goto();

    await p.dateFromInput.fill(todayStr);
    await p.dateToInput.fill(todayStr);
    await p.applyFilters();

    await expect(p.getBookingRow(bookingCodeFromUI)).toBeVisible({ timeout: 8000 });
  });

  test('T12 — Filter by status "confirmed" → เห็นเฉพาะ confirmed', async ({ page }) => {
    const p = new AdminBookingsListPage(page);
    await p.goto();

    await p.statusSelect.selectOption('confirmed');
    await p.applyFilters();

    const rows = p.tableRows;
    const count = await rows.count();
    if (count === 0) {
      test.skip(true, 'ไม่มี confirmed bookings ในระบบ — ข้ามเทสนี้');
    }

    // แต่ละแถวต้องมี badge "ยืนยันแล้ว"
    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(rows.nth(i).getByText('ยืนยันแล้ว')).toBeVisible();
    }
  });

  test('T13 — Search by booking code ของ booking จาก API → หาเจอ', async ({ page }) => {
    if (!bookingIdForMgmt) test.skip(true, 'ไม่มี bookingIdForMgmt จาก beforeAll');

    const p = new AdminBookingsListPage(page);
    await p.goto();

    // ดึง code จาก API
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/api/bookings/${bookingIdForMgmt}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mgmtCode = res.ok() ? (await res.json()).data?.bookingCode : null;
    await ctx.dispose();

    if (!mgmtCode) test.skip(true, 'ไม่พบ booking code จาก API');

    // default page มี dateFrom=dateTo=today → ล้าง date filter ก่อนค้นหา booking ที่อยู่วันอื่น
    await p.dateFromInput.fill('');
    await p.dateToInput.fill('');
    await p.searchByCode(mgmtCode);
    await expect(p.getBookingRow(mgmtCode)).toBeVisible({ timeout: 8000 });
  });

  test('T14 — Clear filter → table แสดงข้อมูล', async ({ page }) => {
    const p = new AdminBookingsListPage(page);
    await p.goto();

    // ตั้ง filter ก่อน
    await p.statusSelect.selectOption('confirmed');
    await p.applyFilters();

    // clear
    await p.clearFilters();

    await expect(p.searchInput).toHaveValue('');
    // รอ table render (auto-wait บน row แรก) แล้วค่อย count
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {});
    await expect(p.tableRows.first()).toBeVisible({ timeout: 10000 });
    const count = await p.tableRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('T15 — ดู booking detail modal', async ({ page }) => {
    if (!bookingCodeFromUI) test.skip(true, 'ไม่มี bookingCodeFromUI จาก T8');

    const p = new AdminBookingsListPage(page);
    await p.goto();
    await p.searchByCode(bookingCodeFromUI);

    const row = p.getBookingRow(bookingCodeFromUI);
    await expect(row).toBeVisible({ timeout: 8000 });

    // คลิก view detail
    await p.viewDetailBtnInRow(row).click();

    // รอ modal เปิด — หา heading ที่มี booking code
    await expect(page.getByText(bookingCodeFromUI).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Test Booking Customer').first()).toBeVisible();

    // ปิด modal
    const closeBtn = page.getByRole('button', { name: 'ปิด' });
    await closeBtn.click();
  });

  test('T16 — Check-in booking → สถานะเปลี่ยนเป็น "เช็คอินแล้ว"', async ({ page }) => {
    if (!bookingCodeFromUI) test.skip(true, 'ไม่มี bookingCodeFromUI จาก T8');

    const p = new AdminBookingsListPage(page);
    await p.goto();
    await p.searchByCode(bookingCodeFromUI);

    const row = p.getBookingRow(bookingCodeFromUI);
    await expect(row).toBeVisible({ timeout: 8000 });

    const checkinBtn = p.checkinBtnInRow(row);
    const canCheckin = await checkinBtn.isVisible().catch(() => false);
    if (!canCheckin) {
      test.skip(true, 'ปุ่มเช็คอินไม่แสดง — booking อาจไม่ได้ status confirmed+paid');
    }

    await checkinBtn.click();
    await waitForToast(page, 'เช็คอินสำเร็จ');

    // รีเฟรชตาราง
    await p.searchByCode(bookingCodeFromUI);
    const updatedRow = p.getBookingRow(bookingCodeFromUI);
    await expect(updatedRow.getByText('เช็คอินแล้ว')).toBeVisible({ timeout: 8000 });
  });

  test('T17 — Mark as paid → payment badge เปลี่ยนเป็น "ชำระแล้ว"', async ({ page }) => {
    if (!bookingIdForMgmt) test.skip(true, 'ไม่มี bookingIdForMgmt จาก beforeAll');

    const p = new AdminBookingsListPage(page);
    await p.goto();

    // ดึง code ของ mgmt booking
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/api/bookings/${bookingIdForMgmt}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const mgmtCode = res.ok() ? (await res.json()).data?.bookingCode : null;
    await ctx.dispose();
    if (!mgmtCode) test.skip(true, 'ไม่พบ booking code');

    // ล้าง date filter (default=today, booking อยู่วันอื่น)
    await p.dateFromInput.fill('');
    await p.dateToInput.fill('');
    await p.searchByCode(mgmtCode);
    const row = p.getBookingRow(mgmtCode);
    await expect(row).toBeVisible({ timeout: 8000 });

    const paidBtn = p.markAsPaidBtnInRow(row);
    await paidBtn.click();

    // ConfirmDialog
    const confirmBtn = p.confirmDialogConfirmBtn;
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    await waitForToast(page, /อัปเดตสถานะการชำระเงิน.*สำเร็จ/);

    // ตรวจสอบ payment badge
    await p.searchByCode(mgmtCode);
    await expect(p.getBookingRow(mgmtCode).getByText('ชำระแล้ว')).toBeVisible({ timeout: 8000 });
  });

  test('T18 — Cancel booking → สถานะเปลี่ยนเป็น "ยกเลิก"', async ({ page }) => {
    if (!bookingIdToCancel) test.skip(true, 'ไม่มี bookingIdToCancel จาก beforeAll');

    const p = new AdminBookingsListPage(page);
    await p.goto();

    // ดึง code ของ cancel booking
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/api/bookings/${bookingIdToCancel}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const cancelCode = res.ok() ? (await res.json()).data?.bookingCode : null;
    await ctx.dispose();
    if (!cancelCode) test.skip(true, 'ไม่พบ booking code');

    // ล้าง date filter (default=today, booking อยู่วันอื่น)
    await p.dateFromInput.fill('');
    await p.dateToInput.fill('');
    await p.searchByCode(cancelCode);
    const row = p.getBookingRow(cancelCode);
    await expect(row).toBeVisible({ timeout: 8000 });

    await p.cancelBtnInRow(row).click();

    // ConfirmDialog
    const confirmBtn = p.confirmDialogConfirmBtn;
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    await waitForToast(page, 'ยกเลิกการจองสำเร็จ');

    // booking.cancel() ตั้ง deletedAt ด้วย → booking หายจาก list (deletedAt: null query)
    // ยืนยันผ่าน API ว่า GET /:id คืน 404 (soft-deleted)
    const verifyCtx = await playwrightRequest.newContext();
    const verifyRes = await verifyCtx.get(`${BASE}/api/bookings/${bookingIdToCancel}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await verifyCtx.dispose();
    expect(verifyRes.status()).toBe(404); // booking is soft-deleted

    // mark ว่า cancel แล้วใน afterAll ไม่ต้อง cancel ซ้ำ
    bookingIdToCancel = null;
  });

  // ════════════════════════════════════════════════════════════════════════════
  // Section C: RecurringBookingsPage (/admin/recurring-bookings)
  // ════════════════════════════════════════════════════════════════════════════

  test('T19 — RecurringBookingsPage โหลดสำเร็จ', async ({ page }) => {
    const p = new RecurringBookingPage(page);
    await p.goto();

    await expect(p.heading).toBeVisible();
    await expect(p.createBtn).toBeVisible();
    await expect(p.searchInput).toBeVisible();
  });

  test('T20 — สร้าง recurring booking ผ่าน preview → สร้างสำเร็จ', async ({ page }) => {
    if (!courtId || !timeSlotId) test.skip(true, 'ไม่มี court หรือ timeSlot ใน beforeAll');

    const p = new RecurringBookingPage(page);
    await p.goto();

    await p.createBtn.click();
    await expect(p.formModalHeading).toBeVisible({ timeout: 8000 });

    // รอ form load data (courts, timeslots)
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});

    // กรอก customer ใหม่
    await p.customerSearchInput.click();
    await p.addNewCustomerBtn.click();
    await p.newCustomerNameInput.fill('Test Recurring Customer');
    await p.newCustomerPhoneInput.fill('0899999999');

    // เลือก court แรก
    await p.courtSelect.selectOption({ index: 1 }); // index 0 คือ "เลือกสนาม"

    // เลือก timeSlot แรก
    await p.timeSlotSelect.selectOption({ index: 1 }); // index 0 คือ "เลือกช่วงเวลา"

    // เลือก duration 1 ชั่วโมง
    await p.durationSelect.selectOption('1');

    // เลือกวันจันทร์
    await p.dayBtn('จันทร์').click();

    // startDate = 2 สัปดาห์ข้างหน้า, endDate = 4 สัปดาห์ข้างหน้า
    const startDate = getBkkDateStr(14);
    const endDate = getBkkDateStr(28);
    await p.startDateInput.fill(startDate);
    await p.endDateInput.fill(endDate);

    // คลิก preview
    await p.previewBtn.click();

    // รอ preview modal
    await expect(page.getByText(/ตัวอย่างการจองประจำ|รายการจอง/)).toBeVisible({ timeout: 10000 });

    // ยืนยัน
    await p.previewModalConfirmBtn.click();

    // รอ toast สำเร็จ
    await waitForToast(page, /สร้างการจองประจำสำเร็จ|สร้าง.*สำเร็จ/);

    // หา recurring group ที่เพิ่งสร้าง — sort by groupCode desc เพื่อเอาตัวล่าสุด
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/api/recurring-bookings?search=Test+Recurring+Customer`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok()) {
      const data = await res.json();
      const groups = data.data ?? [];
      const latest = groups.sort((a, b) => b.groupCode.localeCompare(a.groupCode))[0];
      recurringGroupId = latest?._id ?? null;
      recurringGroupCode = latest?.groupCode ?? null;
    }
    await ctx.dispose();
  });

  test('T21 — ดู detail ของ recurring group', async ({ page }) => {
    if (!recurringGroupId || !recurringGroupCode) test.skip(true, 'ไม่มี recurringGroupId/Code จาก T20');

    const p = new RecurringBookingPage(page);
    await p.goto();

    // หา row ด้วย groupCode (unique) เพื่อหลีกเลี่ยง strict mode เมื่อมีหลาย group ชื่อเดียวกัน
    const row = p.getGroupRow(recurringGroupCode);
    await expect(row).toBeVisible({ timeout: 8000 });

    // คลิก "ดูรายละเอียด"
    await row.getByRole('button', { name: 'ดูรายละเอียด' }).click();

    // รอ detail modal
    await expect(page.getByText('Test Recurring Customer').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('รายการจองทั้งหมด')).toBeVisible();
  });

  test('T22 — ยกเลิก single session ใน detail modal', async ({ page }) => {
    if (!recurringGroupId || !recurringGroupCode) test.skip(true, 'ไม่มี recurringGroupId/Code จาก T20');

    const p = new RecurringBookingPage(page);
    await p.goto();

    const row = p.getGroupRow(recurringGroupCode);
    await expect(row).toBeVisible({ timeout: 8000 });
    await row.getByRole('button', { name: 'ดูรายละเอียด' }).click();
    await page.waitForLoadState('networkidle');

    // ตรวจว่ามีปุ่ม "ยกเลิกครั้งนี้" หรือไม่
    const cancelSingleBtn = page.getByRole('button', { name: 'ยกเลิกครั้งนี้' }).first();
    const hasBtn = await cancelSingleBtn.isVisible().catch(() => false);
    if (!hasBtn) {
      test.skip(true, 'ไม่มี session ที่ยกเลิกได้ (อาจเป็นอนาคต + confirmed แต่ไม่มีในช่วงเวลานี้)');
    }

    // dialog handler ต้องมาก่อน click
    p.acceptNextDialog();
    await cancelSingleBtn.click();

    await waitForToast(page, 'ยกเลิกการจองครั้งนี้สำเร็จ');
  });

  test('T23 — ยกเลิก recurring group ทั้งหมด', async ({ page }) => {
    if (!recurringGroupId || !recurringGroupCode) test.skip(true, 'ไม่มี recurringGroupId/Code จาก T20');

    const p = new RecurringBookingPage(page);
    await p.goto();

    const row = p.getGroupRow(recurringGroupCode);
    await expect(row).toBeVisible({ timeout: 8000 });
    await row.getByRole('button', { name: 'ดูรายละเอียด' }).click();
    await page.waitForLoadState('networkidle');

    // คลิกปุ่ม "ยกเลิกการจองทั้งหมด" ใน detail modal footer
    const cancelAllBtn = page.getByRole('button', { name: 'ยกเลิกการจองทั้งหมด' });
    await expect(cancelAllBtn).toBeVisible({ timeout: 8000 });

    // dialog handler
    p.acceptNextDialog();
    await cancelAllBtn.click();

    await waitForToast(page, /ยกเลิกการจองประจำสำเร็จ|ยกเลิก.*สำเร็จ/);

    // group status เปลี่ยนเป็น "ยกเลิก" ในตาราง
    await p.goto();
    await waitForToastsToClear(page);
    const updatedRow = p.getGroupRow(recurringGroupCode);
    await expect(updatedRow.getByText('ยกเลิก')).toBeVisible({ timeout: 8000 });

    recurringGroupId = null; // afterAll ไม่ต้อง cancel ซ้ำ
  });

  // ════════════════════════════════════════════════════════════════════════════
  // Section D: Cross-Page Tests
  // ════════════════════════════════════════════════════════════════════════════

  test('T24 (Cross-Page) — จองใน BookingPage → ปรากฏใน BookingsPage', async ({ page }) => {
    if (!bookingCodeFromUI) test.skip(true, 'ไม่มี bookingCodeFromUI จาก T8 — ข้ามเทสนี้');

    const p = new AdminBookingsListPage(page);
    await p.goto();
    await p.searchByCode(bookingCodeFromUI);

    await expect(p.getBookingRow(bookingCodeFromUI)).toBeVisible({ timeout: 8000 });
  });

  test('T25 (Cross-Page) — Dashboard API ทำงานได้ และ UI แสดง stat "การจองวันนี้"', async ({ page }) => {
    // Verify dashboard endpoint ทำงานได้ (cross-page: bookings จาก T8 + beforeAll ถูกนับ)
    const ctx = await playwrightRequest.newContext();
    const headers = { Authorization: `Bearer ${token}` };
    const dashRes = await ctx.get(`${BASE}/api/reports/dashboard`, { headers });
    await ctx.dispose();

    expect(dashRes.ok()).toBe(true);

    // navigate Dashboard และตรวจ UI
    await page.goto('/admin/dashboard');
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
    await expect(page.getByText('การจองวันนี้')).toBeVisible({ timeout: 8000 });
  });

  test('T26 (Cross-Page) — Recurring booking → สร้าง individual bookings จริงใน DB', async ({ page }) => {
    if (!recurringGroupId) test.skip(true, 'ไม่มี recurringGroupId จาก T20');

    // T23 ยกเลิก group ทั้งหมด (soft-delete ด้วย deletedAt) → bookings หายจาก BookingsPage list
    // ใช้ endpoint ที่แสดง bookings รวมที่ cancel แล้ว เพื่อ verify cross-page propagation
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/api/recurring-bookings/${recurringGroupId}/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await ctx.dispose();

    expect(res.ok()).toBe(true);
    const data = await res.json();
    const bookings = data.data ?? [];

    // recurring group ต้องสร้าง individual bookings อย่างน้อย 1 รายการ
    expect(bookings.length).toBeGreaterThan(0);
    expect(bookings[0].customer?.name).toContain('Test Recurring');

    // UI: ตรวจว่า AdminBookingsPage โหลดได้ปกติ (cross-page navigation)
    const p = new AdminBookingsListPage(page);
    await p.goto();
    await expect(p.heading).toBeVisible({ timeout: 8000 });
  });
});
