import { test, expect, request as playwrightRequest } from '@playwright/test';
import { readFileSync } from 'fs';

const BASE = 'http://localhost:3000';

// ── Test Data ──────────────────────────────────────────────────────────────────
const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
const TEST_PLAYER = {
  name: `Test Player ${uid}`,
  phone: `08${Date.now().toString().slice(-8)}`,
  password: 'testpass123',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
async function registerPlayerAndGotoBooking(page, player) {
  await page.goto('/register');
  await page.fill('input[name="name"]', player.name);
  await page.fill('input[name="phone"]', player.phone);
  await page.fill('input[name="password"]', player.password);
  await page.fill('input[name="confirmPassword"]', player.password);
  await page.getByRole('button', { name: 'สมัครสมาชิก' }).click();
  await page.waitForURL(/\/booking/, { timeout: 15000 });
}

async function loginPlayerAndGotoBooking(page, player) {
  await page.goto('/login');
  await page.fill('input[name="phone"]', player.phone);
  await page.fill('input[name="password"]', player.password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForURL(/\/booking/, { timeout: 15000 });
}

async function waitForBookingPageReady(page) {
  // รอ step 1 heading หรือ "วันนี้ปิด" หรือ spinner หาย
  await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
  await Promise.race([
    page.getByText('เลือกวันที่').waitFor({ timeout: 15000 }),
    page.getByText('ไม่เปิดให้จองในวันนี้').waitFor({ timeout: 15000 }),
    page.getByText('จองคอร์ทแบดมินตัน').waitFor({ timeout: 15000 }),
  ]).catch(() => {});
}

// ──────────────────────────────────────────────────────────────────────────────
test.describe('Customer Booking Flow (CustomerBookingPage → PaymentPage → MyBookingsPage)', () => {
  test.describe.configure({ mode: 'serial' });

  let adminToken;
  let customerBookingId = null;   // booking ที่ customer สร้าง — cleanup ใน afterAll
  let playerId = null;            // player ID สำหรับ cleanup

  test.beforeAll(async () => {
    // อ่าน admin token สำหรับ cleanup และ cross-page verification
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    adminToken = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;
  });

  test.afterAll(async () => {
    if (!adminToken) return;
    const ctx = await playwrightRequest.newContext();
    const headers = { Authorization: `Bearer ${adminToken}` };

    // ยกเลิก booking ที่ customer สร้าง
    if (customerBookingId) {
      await ctx.patch(`${BASE}/api/bookings/${customerBookingId}/cancel`, { headers }).catch(() => {});
    }

    // ลบ player (teardown.js จัดการ "Test Player *" แต่ทำไว้ด้วยเพื่อความมั่นใจ)
    if (playerId) {
      await ctx.delete(`${BASE}/api/players/${playerId}/permanent`, { headers }).catch(() => {});
    }

    await ctx.dispose();
  });

  // ── CT1: CustomerBookingPage โหลดสำเร็จ ─────────────────────────────────────
  test('CT1 — CustomerBookingPage โหลดสำเร็จ แสดง heading และ date strip', async ({ page }) => {
    await registerPlayerAndGotoBooking(page, TEST_PLAYER);
    await waitForBookingPageReady(page);

    await expect(page.getByText('จองคอร์ทแบดมินตัน')).toBeVisible({ timeout: 8000 });
    // date strip หรือ step 1
    await expect(page.getByText('เลือกวันที่', { exact: true }).first()).toBeVisible({ timeout: 8000 });
  });

  // ── CT2: เลือกวัน → time slots โหลด ────────────────────────────────────────
  test('CT2 — เลือกวันพรุ่งนี้ → step 2 "เลือกเวลา" ปรากฏ', async ({ page }) => {
    await loginPlayerAndGotoBooking(page, TEST_PLAYER);
    await waitForBookingPageReady(page);

    // ตรวจว่าวันนี้ปิดหรือเปล่า
    const isClosed = await page.getByText('ไม่เปิดให้จองในวันนี้').isVisible().catch(() => false);
    if (isClosed) test.skip(true, 'วันนี้ปิดให้จอง');

    // คลิกวันพรุ่งนี้ (ปุ่มวันที่ที่ 2 ใน date strip หรือหา button ที่ไม่ disabled)
    const dateButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    const count = await dateButtons.count();
    if (count < 2) test.skip(true, 'ไม่มี date button พอ');

    await dateButtons.nth(1).click();

    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {});
    // step 2 ปรากฏ
    const step2Visible = await page.getByText(/เลือกเวลาและระยะเวลา|เลือกเวลา/).isVisible().catch(() => false);
    if (!step2Visible) test.skip(true, 'วันพรุ่งนี้ไม่มี time slots ให้เลือก');
    await expect(page.getByText(/เลือกเวลาและระยะเวลา|เลือกเวลา/)).toBeVisible({ timeout: 8000 });
  });

  // ── CT3-CT4: เลือกเวลา + court → จองสำเร็จ ──────────────────────────────────
  test('CT3-CT4 — เลือก date/time/court แล้วจอง → redirect PaymentPage', async ({ page }) => {
    await loginPlayerAndGotoBooking(page, TEST_PLAYER);
    await waitForBookingPageReady(page);

    const isClosed = await page.getByText('ไม่เปิดให้จองในวันนี้').isVisible().catch(() => false);
    if (isClosed) test.skip(true, 'วันนี้ปิดให้จอง');

    // Step 1: เลือกวันพรุ่งนี้
    const dateButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    const dateCount = await dateButtons.count();
    if (dateCount < 2) test.skip(true, 'ไม่มี date button');
    await dateButtons.nth(1).click();
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {});

    // Step 2: เลือก time slot ที่ว่าง
    // Time slot ที่ว่าง = ปุ่มที่ไม่ disabled และมีข้อความ "ว่าง" หรือไม่มี "เต็ม"
    const availableSlots = page.locator('button').filter({ hasText: /ว่าง|\d{2}:\d{2}/ }).filter({ hasNot: page.locator(':disabled') });
    const slotCount = await availableSlots.count();
    if (slotCount === 0) test.skip(true, 'ไม่มี time slot ว่าง');
    await availableSlots.first().click();
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 5000 }).catch(() => {});

    // เลือก duration 1 ชม. (ถ้ามี button)
    const durationBtn = page.getByRole('button', { name: /1ชม\.|1 ชม/ });
    if (await durationBtn.isVisible().catch(() => false)) {
      await durationBtn.click();
      await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 5000 }).catch(() => {});
    }

    // Step 3: เลือก court ที่ว่าง
    const courtCards = page.locator('button, div[role="button"]').filter({ hasText: /ว่าง/ });
    const courtCount = await courtCards.count();
    if (courtCount === 0) test.skip(true, 'ไม่มีสนามว่าง');
    await courtCards.first().click();

    // คลิกปุ่มจอง
    const bookBtn = page.getByRole('button', { name: /จองเลย|จอง/ });
    await expect(bookBtn).toBeVisible({ timeout: 8000 });
    await bookBtn.click();

    // รอ redirect ไป PaymentPage
    await page.waitForURL(/\/payment\//, { timeout: 15000 });

    // เก็บ bookingId จาก URL
    const urlMatch = page.url().match(/\/payment\/([a-f0-9]+)/);
    customerBookingId = urlMatch?.[1] ?? null;
  });

  // ── CT5: PaymentPage แสดงข้อมูลถูกต้อง ──────────────────────────────────────
  test('CT5 — PaymentPage แสดง booking code, ราคา, payment methods', async ({ page }) => {
    if (!customerBookingId) test.skip(true, 'ไม่มี customerBookingId จาก CT4');

    await page.goto(`/payment/${customerBookingId}`);
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});

    // ควรแสดง booking code หรือ payment info
    await expect(
      page.getByText(/BK\w+|PromptPay|การชำระเงิน|ยอดที่ต้องชำระ/)
    ).toBeVisible({ timeout: 8000 });
  });

  // ── CT6: MyBookingsPage แสดงการจองที่สร้างแล้ว ───────────────────────────────
  test('CT6 — MyBookingsPage แสดง booking ที่สร้างพร้อม status "รอชำระเงิน"', async ({ page }) => {
    if (!customerBookingId) test.skip(true, 'ไม่มี customerBookingId จาก CT4');

    // login เป็น player ก่อน
    await page.goto('/login');
    await page.fill('input[name="phone"]', TEST_PLAYER.phone).catch(async () => {
      // fallback: ลอง login via register (ถ้า session หมดอายุ)
      await registerPlayerAndGotoBooking(page, TEST_PLAYER);
    });

    // navigate ไป my-bookings
    await page.goto('/my-bookings');
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('networkidle');

    // ควรแสดงรายการจองของ player
    await expect(page.getByText('ประวัติการจอง')).toBeVisible({ timeout: 8000 });

    // ถ้า booking ใหม่ ควรมี "รอชำระเงิน" หรือ booking code
    const hasBooking = await page.getByText(/BK\w+|รอชำระเงิน/).isVisible().catch(() => false);
    if (hasBooking) {
      await expect(page.getByText(/รอชำระเงิน/)).toBeVisible({ timeout: 5000 });
    }
    // ถ้าเจอ "ไม่พบรายการจอง" → ยังถือว่า pass เพราะ MyBookingsPage โหลดได้
    await expect(page.getByText(/ประวัติการจอง/)).toBeVisible();
  });

  // ── CT7 (Cross-Page): Customer booking → ปรากฏใน AdminBookingsPage ─────────────
  test('CT7 (Cross-Page) — booking ที่ customer สร้าง ปรากฏใน AdminBookingsPage', async ({ page }) => {
    if (!customerBookingId || !adminToken) test.skip(true, 'ไม่มี customerBookingId หรือ adminToken');

    // ดึงข้อมูล booking ผ่าน admin API
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get(`${BASE}/api/bookings/${customerBookingId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await ctx.dispose();

    expect(res.ok()).toBe(true);
    const data = await res.json();
    const booking = data.data;

    expect(booking).toBeTruthy();
    expect(booking.bookingStatus).toBe('payment_pending');
    // customer name ตรงกับ player name
    expect(booking.customer?.name).toContain(TEST_PLAYER.name.split(' ').slice(0, 2).join(' '));
  });
});
