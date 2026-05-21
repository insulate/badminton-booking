import { test, expect, request as playwrightRequest } from '@playwright/test';
import { TimeSlotsPage } from '../pages/TimeSlotsPage.js';
import { readFileSync } from 'fs';

// ── Test data ────────────────────────────────────────────────────────────────
// ใช้ชั่วโมง 00:00–05:59 (ไม่ใช่เวลาเปิดทำการ) → ไม่ชนกับ seed data
// เนื่องจาก timeslots ห้าม overlap กันในแต่ละ dayType
// จึงกำหนดแต่ละ test ใช้ startHour เฉพาะตัว และรัน serial
const WEEKDAY_02 = { startTime: '02:00', endTime: '03:00', dayType: 'weekday' };
// test 2 สร้าง 03:00 weekday แล้วเปลี่ยนเป็น inactive → ใช้ตรวจ cross-page inactive ด้วย
const WEEKDAY_03 = { startTime: '03:00', endTime: '04:00', dayType: 'weekday' };
const WEEKDAY_04 = { startTime: '04:00', endTime: '05:00', dayType: 'weekday' };
const WEEKDAY_05 = { startTime: '05:00', endTime: '06:00', dayType: 'weekday' };
const WEEKDAY_01_INACTIVE = { startTime: '01:00', endTime: '02:00', dayType: 'weekday', status: 'inactive' };

// ── Tests run sequentially ────────────────────────────────────────────────────
// จำเป็นต้องรัน serial เพราะ timeslot ห้ามมี overlap ใน dayType เดียวกัน
// cross-page tests หลายตัวอาศัย slot ที่ test ก่อนหน้าสร้างไว้
test.describe.configure({ mode: 'serial' });

async function waitForToastsToClear(page) {
  await page.waitForFunction(
    () => !document.querySelector('[data-rht-toaster]')?.firstElementChild,
    { timeout: 8000 }
  );
}

async function fillTimeslotModal(page, {
  startTime, endTime, dayType,
  status = 'active',
  normalPrice = 150,
  memberPrice = 120,
  peakNormalPrice = 200,
  peakMemberPrice = 170,
}) {
  await page.fill('input[name="startTime"]', startTime);
  await page.fill('input[name="endTime"]', endTime);
  await page.selectOption('select[name="dayType"]', dayType);
  await page.fill('input[name="pricing.normal"]', String(normalPrice));
  await page.fill('input[name="pricing.member"]', String(memberPrice));
  await page.fill('input[name="peakPricing.normal"]', String(peakNormalPrice));
  await page.fill('input[name="peakPricing.member"]', String(peakMemberPrice));
  await page.selectOption('select[name="status"]', status);
}

async function createTimeslotViaUI(page, slot) {
  const slotsPage = new TimeSlotsPage(page);
  await slotsPage.goto();
  await slotsPage.addButton.click();
  await fillTimeslotModal(page, slot);
  await page.getByRole('button', { name: 'เพิ่มช่วงเวลา', exact: true }).click();
  await page.getByText('เพิ่มช่วงเวลาสำเร็จ').waitFor();
  await waitForToastsToClear(page);
}

const makePlayer = () => {
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return { name: `Test Player ${suffix}`, phone: `089${suffix}`, password: 'testpass123' };
};

async function registerPlayerAndGotoBooking(page, player) {
  await page.goto('/register');
  await page.fill('input[name="name"]', player.name);
  await page.fill('input[name="phone"]', player.phone);
  await page.fill('input[name="password"]', player.password);
  await page.fill('input[name="confirmPassword"]', player.password);
  await page.getByRole('button', { name: 'สมัครสมาชิก' }).click();
  await page.waitForURL(/\/booking/);
}

// ──────────────────────────────────────────────────────────────────────────────
test.describe('TimeSlot Management', () => {

  // ── Pre-test cleanup: ล้าง leftover timeslots จาก run ก่อนหน้า ─────────────
  test.beforeAll(async () => {
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    const token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;
    if (!token) return;

    const ctx = await playwrightRequest.newContext();
    const headers = { Authorization: `Bearer ${token}` };
    const res = await ctx.get('http://localhost:3000/api/timeslots', { headers });
    if (res.ok()) {
      const { data: timeslots } = await res.json();
      for (const ts of timeslots ?? []) {
        const hour = parseInt(ts.startTime?.split(':')[0] ?? '99', 10);
        if (hour < 6) {
          await ctx.delete(`http://localhost:3000/api/timeslots/${ts._id}`, { headers });
        }
      }
    }
    await ctx.dispose();
  });

  // ── CRUD ────────────────────────────────────────────────────────────────────

  // test 1: สร้าง 02:00 weekday → ยังคงอยู่ใน DB สำหรับ tests ต่อไป
  test('เพิ่มช่วงเวลา weekday สำเร็จ', async ({ page }) => {
    const slotsPage = new TimeSlotsPage(page);
    await slotsPage.goto();
    await slotsPage.addButton.click();

    await fillTimeslotModal(page, WEEKDAY_02);
    await page.getByRole('button', { name: 'เพิ่มช่วงเวลา', exact: true }).click();

    await expect(page.getByText('เพิ่มช่วงเวลาสำเร็จ')).toBeVisible();
    const row = slotsPage.getRow('02:00', '03:00');
    await expect(row).toBeVisible();
    await expect(row).toContainText('150');
    await expect(row).toContainText('เปิดใช้งาน');
  });

  // test 2: สร้าง 03:00 weekday → แก้ไขเป็น inactive+ราคา 180 → 03:00 จะ inactive ตลอดสำหรับ tests ต่อไป
  test('แก้ไขราคาและสถานะสำเร็จ', async ({ page }) => {
    const slotsPage = new TimeSlotsPage(page);
    await createTimeslotViaUI(page, WEEKDAY_03);

    await slotsPage.getRow('03:00', '04:00').locator('[data-tooltip="แก้ไข"]').click();
    await expect(page.getByRole('heading', { name: 'แก้ไขช่วงเวลา' })).toBeVisible();

    await page.fill('input[name="pricing.normal"]', '180');
    await page.selectOption('select[name="status"]', 'inactive');
    await page.getByRole('button', { name: 'บันทึกการแก้ไข' }).click();

    await expect(page.getByText('แก้ไขช่วงเวลาสำเร็จ')).toBeVisible();
    const row = slotsPage.getRow('03:00', '04:00');
    await expect(row).toContainText('180');
    await expect(row).toContainText('ปิดใช้งาน');
  });

  // test 3: สร้าง 04:00 weekday → ลบทิ้ง (04:00 ว่างสำหรับ Cross Admin ลบ ต่อมา)
  test('ลบช่วงเวลาสำเร็จ', async ({ page }) => {
    const slotsPage = new TimeSlotsPage(page);
    await createTimeslotViaUI(page, WEEKDAY_04);

    slotsPage.acceptDialog();
    await slotsPage.getRow('04:00', '05:00').locator('[data-tooltip="ลบ"]').click();

    await expect(page.getByText('ลบช่วงเวลาสำเร็จ')).toBeVisible();
    await expect(slotsPage.getRow('04:00', '05:00')).not.toBeVisible();
  });

  test('กด ยกเลิก ใน modal → modal ปิด ไม่บันทึก', async ({ page }) => {
    const slotsPage = new TimeSlotsPage(page);
    await slotsPage.goto();
    await slotsPage.addButton.click();

    await expect(page.getByRole('heading', { name: 'เพิ่มช่วงเวลาใหม่' })).toBeVisible();
    await page.getByRole('button', { name: 'ยกเลิก' }).click();

    await expect(page.getByRole('heading', { name: 'เพิ่มช่วงเวลาใหม่' })).not.toBeVisible();
  });

  // ── Peak Hour Toggle ────────────────────────────────────────────────────────

  // test 5: สร้าง 05:00 weekday สำหรับ peak toggle
  test('Toggle เปิด/ปิด Peak Hour สำเร็จ', async ({ page }) => {
    const slotsPage = new TimeSlotsPage(page);
    await createTimeslotViaUI(page, WEEKDAY_05);

    const row = slotsPage.getRow('05:00', '06:00');
    await row.locator('[data-tooltip="เปิด Peak Hour"]').click();

    await expect(page.getByText('เปิด Peak Hour สำเร็จ')).toBeVisible();
    await expect(row.locator('[data-tooltip="ปิด Peak Hour"]')).toBeVisible();
    await waitForToastsToClear(page);

    await row.locator('[data-tooltip="ปิด Peak Hour"]').click();
    await expect(page.getByText('ปิด Peak Hour สำเร็จ')).toBeVisible();
    await expect(row.locator('[data-tooltip="เปิด Peak Hour"]')).toBeVisible();
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  test('เวลาเริ่มต้น format ผิด → error toast', async ({ page }) => {
    const slotsPage = new TimeSlotsPage(page);
    await slotsPage.goto();
    await slotsPage.addButton.click();

    await fillTimeslotModal(page, { ...WEEKDAY_02, startTime: 'abc' });
    await page.getByRole('button', { name: 'เพิ่มช่วงเวลา', exact: true }).click();

    await expect(page.getByText('รูปแบบเวลาเริ่มต้นไม่ถูกต้อง')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'เพิ่มช่วงเวลาใหม่' })).toBeVisible();
  });

  test('endTime <= startTime → error toast', async ({ page }) => {
    const slotsPage = new TimeSlotsPage(page);
    await slotsPage.goto();
    await slotsPage.addButton.click();

    await fillTimeslotModal(page, { ...WEEKDAY_02, startTime: '10:00', endTime: '09:00' });
    await page.getByRole('button', { name: 'เพิ่มช่วงเวลา', exact: true }).click();

    await expect(page.getByText('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น')).toBeVisible();
  });

  test('Bulk update ไม่กรอกราคาเลย → error toast', async ({ page }) => {
    const slotsPage = new TimeSlotsPage(page);
    await slotsPage.goto();
    await slotsPage.bulkUpdateButton.click();

    await expect(page.getByRole('heading', { name: 'อัปเดตราคาทั้งหมด' })).toBeVisible();
    await page.getByRole('button', { name: 'อัปเดตราคา', exact: true }).click();

    await expect(page.getByText('กรุณากรอกราคาอย่างน้อย 1 ช่อง')).toBeVisible();
  });

  // ── Filter ──────────────────────────────────────────────────────────────────

  test('กรอง dayType = weekday → เปลี่ยนเป็น flat table ไม่มี section headers', async ({ page }) => {
    const slotsPage = new TimeSlotsPage(page);
    await slotsPage.goto();
    await slotsPage.dayTypeFilter.selectOption('weekday');

    // เมื่อ filter dayType ทำงาน → grouped sections (h2) หายไป เปลี่ยนเป็น flat table
    await expect(page.locator('h2').filter({ hasText: 'วันเสาร์-อาทิตย์' })).not.toBeVisible();
    await expect(page.locator('h2').filter({ hasText: 'วันจันทร์-ศุกร์' })).not.toBeVisible();
    // flat table แสดง column "ประเภทวัน" แทน section headers
    await expect(page.locator('th').filter({ hasText: 'ประเภทวัน' })).toBeVisible();
  });

  // test 10: สร้าง 01:00 weekday inactive → ใช้ตรวจ filter + cross-page recurring ต่อมา
  test('กรอง status = inactive → เห็นเฉพาะ row ที่ inactive', async ({ page }) => {
    const slotsPage = new TimeSlotsPage(page);
    await createTimeslotViaUI(page, WEEKDAY_01_INACTIVE);

    await slotsPage.statusFilter.selectOption('inactive');

    const row = slotsPage.getRow('01:00', '02:00');
    await expect(row).toBeVisible();
    await expect(row).toContainText('ปิดใช้งาน');
    await expect(page.locator('tbody').getByText('เปิดใช้งาน')).not.toBeVisible();
  });

  // ── Bulk Update Pricing ─────────────────────────────────────────────────────

  // ใช้ 02:00 weekday ที่สร้างไว้ใน test 1 → ไม่ต้อง create ใหม่
  test('อัปเดตราคา weekday สำเร็จ → toast แสดง count', async ({ page }) => {
    const slotsPage = new TimeSlotsPage(page);
    await slotsPage.goto();
    await slotsPage.bulkUpdateButton.click();
    await expect(page.getByRole('heading', { name: 'อัปเดตราคาทั้งหมด' })).toBeVisible();

    await page.selectOption('select[name="dayType"]', 'weekday');
    await page.fill('input[name="pricing.normal"]', '999');
    await page.getByRole('button', { name: 'อัปเดตราคา', exact: true }).click();

    await expect(page.getByText(/อัปเดตราคา \d+ ช่วงเวลาสำเร็จ/)).toBeVisible();
    await waitForToastsToClear(page);

    const row = slotsPage.getRow('02:00', '03:00');
    await expect(row).toContainText('999');

    // Restore: reset ราคา weekday กลับเป็น 150 เพื่อไม่ให้ seed data ค้างราคา 999
    await slotsPage.bulkUpdateButton.click();
    await page.selectOption('select[name="dayType"]', 'weekday');
    await page.fill('input[name="pricing.normal"]', '150');
    await page.getByRole('button', { name: 'อัปเดตราคา', exact: true }).click();
    await page.getByText(/อัปเดตราคา \d+ ช่วงเวลาสำเร็จ/).waitFor();
    await waitForToastsToClear(page);
  });

  // ── Cross-Page — Admin BookingPage ──────────────────────────────────────────

  test.describe('Cross-Page — Admin BookingPage', () => {
    // ใช้ 02:00 weekday active ที่สร้างไว้ใน test 1
    test('timeslot active → label เวลาปรากฏใน CourtScheduleGrid', async ({ page }) => {
      await page.goto('/admin/booking');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText('02:00').first()).toBeVisible();
    });

    // 04:00 ถูกลบใน test 3 แล้ว → สร้างใหม่ได้ แล้วลบอีกครั้งเพื่อตรวจ cross-page
    test('ลบ timeslot → หายจาก CourtScheduleGrid', async ({ page }) => {
      const slotsPage = new TimeSlotsPage(page);
      await createTimeslotViaUI(page, WEEKDAY_04);

      await page.goto('/admin/booking');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('04:00').first()).toBeVisible();

      await slotsPage.goto();
      await waitForToastsToClear(page);
      slotsPage.acceptDialog();
      await slotsPage.getRow('04:00', '05:00').locator('[data-tooltip="ลบ"]').click();
      await page.getByText('ลบช่วงเวลาสำเร็จ').waitFor();

      await page.goto('/admin/booking');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('04:00')).not.toBeVisible();
    });
  });

  // ── Cross-Page — RecurringBookingsPage ──────────────────────────────────────

  test.describe('Cross-Page — RecurringBookingsPage', () => {
    // 02:00 weekday active (test 1) → ปรากฏใน dropdown
    test('timeslot weekday active → ปรากฏใน dropdown ของ RecurringBookingForm', async ({ page }) => {
      await page.goto('/admin/recurring-bookings');
      await page.getByRole('button', { name: 'สร้างการจองประจำ' }).click();
      await expect(page.getByRole('heading', { name: 'สร้างการจองประจำใหม่' })).toBeVisible();

      const timeslotSelect = page.locator('select[name="timeSlot"]');
      await expect(timeslotSelect).toContainText('02:00');
    });

    // 03:00 weekday inactive (test 2) → ไม่ปรากฏใน dropdown (form filter: active only)
    test('timeslot inactive → ไม่ปรากฏใน dropdown ของ RecurringBookingForm', async ({ page }) => {
      await page.goto('/admin/recurring-bookings');
      await page.getByRole('button', { name: 'สร้างการจองประจำ' }).click();
      await expect(page.getByRole('heading', { name: 'สร้างการจองประจำใหม่' })).toBeVisible();

      const timeslotSelect = page.locator('select[name="timeSlot"]');
      // 03:00 inactive → กรองออก; 02:00 active → ยังอยู่
      await expect(timeslotSelect).not.toContainText('03:00');
      await expect(timeslotSelect).toContainText('02:00');
    });
  });

  // ── Cross-Page — Customer BookingPage ──────────────────────────────────────

  test.describe('Cross-Page — Customer BookingPage', () => {
    // 02:00 weekday active (test 1) → ปรากฏเป็น slot ให้เลือก
    test('timeslot active → ปรากฏเป็น slot ให้ลูกค้าเลือก', async ({ page }) => {
      const player = makePlayer();
      await registerPlayerAndGotoBooking(page, player);

      await Promise.race([
        page.getByText('เลือกเวลาและระยะเวลา').waitFor({ timeout: 15000 }),
        page.getByText('ไม่เปิดให้จองในวันนี้').waitFor({ timeout: 15000 }),
      ]);

      // test.skip แทน return เพื่อให้ Playwright รายงานว่า "skipped" ไม่ใช่ "passed"
      const isBlocked = await page.getByText('ไม่เปิดให้จองในวันนี้').isVisible();
      test.skip(isBlocked, 'วันนี้ปิดให้จอง — ไม่สามารถตรวจ timeslot availability ได้');

      await expect(page.getByText('02:00').first()).toBeVisible();
    });

    // 03:00 weekday inactive (test 2) → ไม่ปรากฏ (customer API ดึงเฉพาะ active)
    // ต้องมี 02:00 active ปรากฏด้วยเพื่อพิสูจน์ว่า test รันบน weekday จริง
    // (ถ้าวันนี้เป็น weekend, weekday slots ทั้งหมดก็ไม่แสดงอยู่แล้ว → skip)
    test('timeslot inactive → ไม่ปรากฏในหน้า customer booking', async ({ page }) => {
      const player = makePlayer();
      await registerPlayerAndGotoBooking(page, player);

      await Promise.race([
        page.getByText('เลือกเวลาและระยะเวลา').waitFor({ timeout: 15000 }),
        page.getByText('ไม่เปิดให้จองในวันนี้').waitFor({ timeout: 15000 }),
      ]);

      const isBlocked = await page.getByText('ไม่เปิดให้จองในวันนี้').isVisible();
      test.skip(isBlocked, 'วันนี้ปิดให้จอง — ไม่สามารถตรวจ timeslot availability ได้');

      // ตรวจก่อนว่า 02:00 active ปรากฏอยู่ → หมายความว่าวันนี้เป็น weekday
      // ถ้าไม่เจอ 02:00 แสดงว่าวันนี้เป็น weekend (weekday slots ไม่แสดง) → skip
      const isWeekday = await page.getByText('02:00').first().isVisible();
      test.skip(!isWeekday, 'วันนี้เป็น weekend — weekday inactive test ไม่สามารถพิสูจน์ได้');

      // บนหน้า weekday: 02:00 active ปรากฏ, 03:00 inactive ต้องไม่ปรากฏ
      await expect(page.getByText('02:00').first()).toBeVisible();
      await expect(page.getByText('03:00')).not.toBeVisible();
    });
  });
});
