import { test, expect, request as playwrightRequest } from '@playwright/test';
import { BookingSettingsPage } from '../pages/BookingSettingsPage.js';
import { readFileSync } from 'fs';

// ── Test data ────────────────────────────────────────────────────────────────
const TEST_BOOKING = {
  advanceBookingDays:  3,
  minimumAdvanceHours: 2,
  minBookingHours:     1,
  maxBookingHours:     4,
  cancellationHours:   12,
};

const TEST_DEPOSIT = {
  depositAmount:     200,
  depositPercentage: 20,
};

test.describe('การตั้งค่าการจอง', () => {
  test.describe.configure({ mode: 'serial' });

  let originalBooking = {};
  let token = null;

  // ── Backup: เก็บข้อมูล booking settings เดิมก่อนรัน test ─────────────────
  test.beforeAll(async () => {
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;
    if (!token) return;

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get('http://localhost:3000/api/settings', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok()) {
      const data = await res.json();
      originalBooking = data.data?.booking ?? {};
    }
    await ctx.dispose();
  });

  // ── Restore: คืนข้อมูล booking settings เดิมหลังรัน test ทุกตัวจบ ────────
  test.afterAll(async () => {
    if (!token || originalBooking.advanceBookingDays == null) return;

    const ctx = await playwrightRequest.newContext();
    await ctx.patch('http://localhost:3000/api/settings/booking', {
      headers: { Authorization: `Bearer ${token}` },
      data: originalBooking,
    });
    await ctx.dispose();
  });

  // ── 1. UI: Form แสดงข้อมูลปัจจุบัน ──────────────────────────────────────
  test('แสดง form ตั้งค่าการจองพร้อมข้อมูลปัจจุบัน', async ({ page }) => {
    const p = new BookingSettingsPage(page);
    await p.goto();

    await expect(p.advanceBookingDaysInput).toBeVisible();
    await expect(p.minimumAdvanceHoursInput).toBeVisible();
    await expect(p.minBookingHoursInput).toBeVisible();
    await expect(p.maxBookingHoursInput).toBeVisible();
    await expect(p.cancellationHoursInput).toBeVisible();
    await expect(p.requireDepositCheckbox).toBeVisible();
    await expect(p.saveButton).toBeVisible();

    await expect(p.advanceBookingDaysInput).not.toHaveValue('');
    await expect(p.minBookingHoursInput).not.toHaveValue('');
    await expect(p.maxBookingHoursInput).not.toHaveValue('');
    await expect(p.cancellationHoursInput).not.toHaveValue('');
  });

  // ── 2. UI: Deposit fields ซ่อนอยู่ตอน requireDeposit ไม่ได้เปิด ─────────
  test('requireDeposit unchecked → ซ่อน depositAmount และ depositPercentage', async ({ page }) => {
    const p = new BookingSettingsPage(page);
    await p.goto();

    await p.setDepositEnabled(false);

    await expect(p.depositAmountInput).not.toBeVisible();
    await expect(p.depositPercentageInput).not.toBeVisible();
  });

  // ── 3. Validation: minBookingHours > maxBookingHours → toast error ────────
  test('minBookingHours > maxBookingHours → toast error ปรากฏ / ไม่บันทึก', async ({ page }) => {
    const p = new BookingSettingsPage(page);
    await p.goto();

    await p.minBookingHoursInput.fill('5');
    await p.maxBookingHoursInput.fill('2');
    await p.save();

    await expect(
      page.getByText('ระยะเวลาจองต่ำสุดต้องน้อยกว่าหรือเท่ากับระยะเวลาจองสูงสุด')
    ).toBeVisible();

    await expect(page.getByText('บันทึกการตั้งค่าการจองสำเร็จ')).not.toBeVisible({ timeout: 2000 });
  });

  // ── 4. Validation: advanceBookingDays required ────────────────────────────
  test('advanceBookingDays ว่าง → HTML5 required block', async ({ page }) => {
    const p = new BookingSettingsPage(page);
    await p.goto();

    await p.advanceBookingDaysInput.fill('');
    await p.save();

    await expect(page.getByText('บันทึกการตั้งค่าการจองสำเร็จ')).not.toBeVisible({ timeout: 2000 });
    const isInvalid = await p.advanceBookingDaysInput.evaluate((el) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  // ── 5. Validation: minBookingHours required ───────────────────────────────
  test('minBookingHours ว่าง → HTML5 required block', async ({ page }) => {
    const p = new BookingSettingsPage(page);
    await p.goto();

    await p.minBookingHoursInput.fill('');
    await p.save();

    await expect(page.getByText('บันทึกการตั้งค่าการจองสำเร็จ')).not.toBeVisible({ timeout: 2000 });
    const isInvalid = await p.minBookingHoursInput.evaluate((el) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  // ── 6. Validation: maxBookingHours required ───────────────────────────────
  test('maxBookingHours ว่าง → HTML5 required block', async ({ page }) => {
    const p = new BookingSettingsPage(page);
    await p.goto();

    await p.maxBookingHoursInput.fill('');
    await p.save();

    await expect(page.getByText('บันทึกการตั้งค่าการจองสำเร็จ')).not.toBeVisible({ timeout: 2000 });
    const isInvalid = await p.maxBookingHoursInput.evaluate((el) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  // ── 7. Validation: cancellationHours min=0 (ไม่สามารถทดสอบ "ว่าง" ได้เพราะ React แปลง '' → 0 ซึ่ง valid)
  //    ทดสอบด้วยค่า -1 ซึ่ง rangeUnderflow จาก min="0"
  test('cancellationHours ต่ำกว่า 0 → HTML5 range block', async ({ page }) => {
    const p = new BookingSettingsPage(page);
    await p.goto();

    await p.cancellationHoursInput.fill('-1');
    await p.save();

    await expect(page.getByText('บันทึกการตั้งค่าการจองสำเร็จ')).not.toBeVisible({ timeout: 2000 });
    const isInvalid = await p.cancellationHoursInput.evaluate((el) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  // ── 8. Deposit Toggle: เปิด requireDeposit → แสดง deposit fields ──────────
  test('เปิด requireDeposit → แสดง depositAmount และ depositPercentage', async ({ page }) => {
    const p = new BookingSettingsPage(page);
    await p.goto();

    await p.setDepositEnabled(true);

    await expect(p.depositAmountInput).toBeVisible();
    await expect(p.depositPercentageInput).toBeVisible();
  });

  // ── 9. Deposit Toggle: ปิด requireDeposit → ซ่อน deposit fields ──────────
  test('ปิด requireDeposit → ซ่อน depositAmount และ depositPercentage อีกครั้ง', async ({ page }) => {
    const p = new BookingSettingsPage(page);
    await p.goto();

    await p.setDepositEnabled(true);
    await expect(p.depositAmountInput).toBeVisible();

    await p.setDepositEnabled(false);
    await expect(p.depositAmountInput).not.toBeVisible();
    await expect(p.depositPercentageInput).not.toBeVisible();
  });

  // ── 10. Persistence: บันทึกตั้งค่าพื้นฐาน → reload → ข้อมูลครบ ──────────
  test('บันทึกตั้งค่าพื้นฐาน → reload → ข้อมูลครบถ้วน', async ({ page }) => {
    const p = new BookingSettingsPage(page);
    await p.goto();

    await p.setDepositEnabled(false);
    await p.fillForm(TEST_BOOKING);
    await p.save();
    await p.waitForSuccess();

    await page.reload();

    await expect(p.advanceBookingDaysInput).toHaveValue(String(TEST_BOOKING.advanceBookingDays));
    await expect(p.minimumAdvanceHoursInput).toHaveValue(String(TEST_BOOKING.minimumAdvanceHours));
    await expect(p.minBookingHoursInput).toHaveValue(String(TEST_BOOKING.minBookingHours));
    await expect(p.maxBookingHoursInput).toHaveValue(String(TEST_BOOKING.maxBookingHours));
    await expect(p.cancellationHoursInput).toHaveValue(String(TEST_BOOKING.cancellationHours));
    expect(await p.requireDepositCheckbox.isChecked()).toBe(false);
  });

  // ── 11. Persistence: บันทึก requireDeposit=true → reload → deposit fields ─
  test('บันทึกพร้อม requireDeposit=true → reload → deposit fields แสดงและมีค่าถูกต้อง', async ({ page }) => {
    const p = new BookingSettingsPage(page);
    await p.goto();

    await p.setDepositEnabled(true);
    await p.depositAmountInput.fill(String(TEST_DEPOSIT.depositAmount));
    await p.depositPercentageInput.fill(String(TEST_DEPOSIT.depositPercentage));
    await p.save();
    await p.waitForSuccess();

    await page.reload();

    expect(await p.requireDepositCheckbox.isChecked()).toBe(true);
    await expect(p.depositAmountInput).toBeVisible();
    await expect(p.depositAmountInput).toHaveValue(String(TEST_DEPOSIT.depositAmount));
    await expect(p.depositPercentageInput).toHaveValue(String(TEST_DEPOSIT.depositPercentage));
  });

  // ── 12. Cross-page: CustomerBookingPage → dateList ตาม advanceBookingDays ─
  test('Cross-Page — CustomerBookingPage → dateList มีจำนวนวันตาม advanceBookingDays', async ({ page }) => {
    // TEST_BOOKING.advanceBookingDays = 3 ถูกบันทึกใน test 10 แล้ว
    await page.goto('/booking');

    // รอ API resolve ก่อน count (text "วันนี้" ปรากฏใน date button แรก)
    await page.getByText('วันนี้').waitFor();

    const dateStrip = page.locator('div.overflow-x-auto');
    const dateButtons = dateStrip.locator('button.shrink-0');
    await expect(dateButtons).toHaveCount(TEST_BOOKING.advanceBookingDays);
  });
});
