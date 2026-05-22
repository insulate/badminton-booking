import { test, expect, request as playwrightRequest } from '@playwright/test';
import { OperatingHoursPage } from '../pages/OperatingHoursPage.js';
import { readFileSync } from 'fs';

// ── Test data ────────────────────────────────────────────────────────────────
const TEST_OPERATING = {
  openTime: '08:00',
  closeTime: '21:00',
  daysOpen: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
};

const WEEKDAY_LABELS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];

test.describe('การตั้งค่าเวลาทำการ', () => {
  test.describe.configure({ mode: 'serial' });
  let originalOperating = {};

  // ── Backup: เก็บข้อมูล operating เดิมก่อนรัน test ─────────────────────────
  test.beforeAll(async () => {
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get('http://localhost:3000/api/settings/venue-info');
    if (res.ok()) {
      const data = await res.json();
      originalOperating = data.operating ?? {};
    }
    await ctx.dispose();
  });

  // ── Restore: คืนข้อมูล operating เดิมหลังรัน test ทุกตัวจบ ────────────────
  test.afterAll(async () => {
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    const token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;
    if (!token || !originalOperating.openTime) return;

    const ctx = await playwrightRequest.newContext();
    await ctx.patch('http://localhost:3000/api/settings/operating', {
      headers: { Authorization: `Bearer ${token}` },
      data: originalOperating,
    });
    await ctx.dispose();
  });

  // ── 1. Form แสดงข้อมูลปัจจุบัน ───────────────────────────────────────────
  test('แสดง form ตั้งค่าเวลาทำการพร้อมข้อมูลปัจจุบัน', async ({ page }) => {
    const p = new OperatingHoursPage(page);
    await p.goto();

    await expect(p.openTimeInput).toBeVisible();
    await expect(p.closeTimeInput).toBeVisible();
    await expect(p.openTimeInput).not.toHaveValue('');
    await expect(p.closeTimeInput).not.toHaveValue('');

    // มีวันถูกเลือกอย่างน้อย 1 วัน
    const selectedCount = await page.locator('label.bg-green-50').count();
    expect(selectedCount).toBeGreaterThan(0);
  });

  // ── 2. Validation: ไม่เลือกวัน ────────────────────────────────────────────
  test('ไม่เลือกวันทำการ → บันทึกไม่ได้', async ({ page }) => {
    const p = new OperatingHoursPage(page);
    await p.goto();

    await p.deselectAll();

    // inline error ปรากฏทันทีเมื่อไม่มีวันถูกเลือก
    await expect(page.getByText('กรุณาเลือกวันทำการอย่างน้อย 1 วัน')).toBeVisible();

    await p.save();

    // success toast ไม่ควรปรากฏ
    await expect(page.getByText('บันทึกเวลาทำการสำเร็จ')).not.toBeVisible({ timeout: 2000 });
  });

  // ── 3. Validation: เวลาปิด ≤ เวลาเปิด ────────────────────────────────────
  test('เวลาปิดน้อยกว่าเวลาเปิด → บันทึกไม่ได้', async ({ page }) => {
    const p = new OperatingHoursPage(page);
    await p.goto();

    await p.openTimeInput.fill('12:00');
    await p.closeTimeInput.fill('06:00');
    await p.save();

    await expect(page.getByText('เวลาเปิดต้องน้อยกว่าเวลาปิด')).toBeVisible();
  });

  // ── 4. Toggle เลือกทั้งหมด / ยกเลิกทั้งหมด ─────────────────────────────
  test('ปุ่ม เลือกทั้งหมด / ยกเลิกทั้งหมด toggle ได้', async ({ page }) => {
    const p = new OperatingHoursPage(page);
    await p.goto();

    // Normalize: ให้อยู่ใน state "ครบ 7 วัน" ก่อน
    const text = await p.selectAllBtn.textContent();
    if (!text?.includes('ยกเลิกทั้งหมด')) {
      await p.selectAllBtn.click();
    }
    await expect(p.selectAllBtn).toHaveText('ยกเลิกทั้งหมด');
    expect(await p.isDaySelected('จันทร์')).toBe(true);
    expect(await p.isDaySelected('อาทิตย์')).toBe(true);

    // คลิก "ยกเลิกทั้งหมด" → ไม่มีวันถูกเลือก
    await p.selectAllBtn.click();
    await expect(p.selectAllBtn).toHaveText('เลือกทั้งหมด');
    expect(await p.isDaySelected('จันทร์')).toBe(false);
    expect(await p.isDaySelected('อาทิตย์')).toBe(false);
  });

  // ── 5. Save & persist ──────────────────────────────────────────────────────
  test('บันทึกข้อมูลสำเร็จ → reload → ข้อมูลยังคงอยู่', async ({ page }) => {
    const p = new OperatingHoursPage(page);
    await p.goto();

    await p.openTimeInput.fill(TEST_OPERATING.openTime);
    await p.closeTimeInput.fill(TEST_OPERATING.closeTime);

    // เลือกเฉพาะวันจันทร์–ศุกร์
    await p.deselectAll();
    for (const label of WEEKDAY_LABELS) {
      await p.clickDay(label);
    }

    await p.save();
    await p.waitForSuccess();

    await page.reload();

    await expect(p.openTimeInput).toHaveValue(TEST_OPERATING.openTime);
    await expect(p.closeTimeInput).toHaveValue(TEST_OPERATING.closeTime);
    expect(await p.isDaySelected('จันทร์')).toBe(true);
    expect(await p.isDaySelected('ศุกร์')).toBe(true);
    expect(await p.isDaySelected('เสาร์')).toBe(false);
    expect(await p.isDaySelected('อาทิตย์')).toBe(false);
  });

  // ── 6. Cross-page: RulesPage ──────────────────────────────────────────────
  test('Cross-Page — RulesPage → เวลาและวันทำการแสดงถูกต้อง', async ({ page }) => {
    await page.goto('/rules');

    // เวลาทำการ: formatTime("08:00") = "08.00 น.", formatTime("21:00") = "21.00 น."
    await expect(page.getByText('08.00 น. - 21.00 น.')).toBeVisible();

    // วันทำการ: จันทร์–ศุกร์ = "จ., อ., พ., พฤ., ศ."
    await expect(page.getByText('จ., อ., พ., พฤ., ศ.')).toBeVisible();
  });
});
