import { test, expect, request as playwrightRequest } from '@playwright/test';
import { readFileSync } from 'fs';
import { ShiftPage } from '../pages/ShiftPage.js';

const BASE = 'http://localhost:3000';

async function waitForToast(page, text) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 8000 });
}

test.describe('Shift Page (/admin/shifts)', () => {
  test.describe.configure({ mode: 'serial' });

  let token;

  test.beforeAll(async () => {
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;
    if (!token) return;

    const ctx = await playwrightRequest.newContext();
    const headers = { Authorization: `Bearer ${token}` };

    // ปิด open shift ที่ค้างอยู่จาก run ก่อนหน้า
    const currentRes = await ctx.get(`${BASE}/api/shifts/current`, { headers });
    if (currentRes.ok()) {
      const data = await currentRes.json();
      if (data.hasOpenShift && data.data?._id) {
        await ctx.post(`${BASE}/api/shifts/${data.data._id}/close`, {
          headers,
          data: { actualCash: 0, actualNonCash: 0, note: 'cleanup by E2E beforeAll' },
        });
      }
    }

    await ctx.dispose();
  });

  test.afterAll(async () => {
    if (!token) return;
    const ctx = await playwrightRequest.newContext();
    const headers = { Authorization: `Bearer ${token}` };

    // ปิด shift ที่อาจค้างจากเทส (เช่น T3 เปิดสำเร็จ แต่ T9 ไม่ได้รัน)
    const currentRes = await ctx.get(`${BASE}/api/shifts/current`, { headers });
    if (currentRes.ok()) {
      const data = await currentRes.json();
      if (data.hasOpenShift && data.data?._id) {
        await ctx.post(`${BASE}/api/shifts/${data.data._id}/close`, {
          headers,
          data: { actualCash: 0, actualNonCash: 0, note: 'cleanup by E2E afterAll' },
        });
      }
    }

    await ctx.dispose();
  });

  test('T1 — Page แสดง "ยังไม่ได้เปิดกะ" เมื่อไม่มี open shift', async ({ page }) => {
    const p = new ShiftPage(page);
    await p.goto();

    await expect(p.noShiftMsg).toBeVisible();
    await expect(p.openShiftBtn).toBeVisible();
  });

  test('T2 — Validation: เปิดกะด้วยยอดติดลบ', async ({ page }) => {
    const p = new ShiftPage(page);
    await p.goto();

    await p.openShiftBtn.click();
    await p.openingCashInput.waitFor({ state: 'visible' });
    await p.openingCashInput.fill('-1');
    await p.confirmOpenBtn.click();

    await waitForToast(page, 'กรุณากรอกจำนวนเงินที่ถูกต้อง');
  });

  test('T3 — เปิดกะสำเร็จด้วย opening cash = 500', async ({ page }) => {
    const p = new ShiftPage(page);
    await p.goto();

    await p.openShiftBtn.click();
    await p.openingCashInput.waitFor({ state: 'visible' });
    await p.openingCashInput.fill('500');
    await p.confirmOpenBtn.click();

    await waitForToast(page, 'เปิดกะสำเร็จ');
    await expect(p.shiftStatusBadge).toBeVisible();
    await expect(p.shiftCodeBadge).toHaveText(/^SH/);
  });

  test('T4 — Summary card "เงินเปิดกะ" แสดง ฿500.00', async ({ page }) => {
    const p = new ShiftPage(page);
    await p.goto();

    await expect(p.openingCashCard.getByText('฿500.00')).toBeVisible();
  });

  test('T5 — Validation: เพิ่มรายจ่ายโดยไม่กรอก description', async ({ page }) => {
    const p = new ShiftPage(page);
    await p.goto();

    await p.addExpenseBtn.click();
    await p.expenseAmtInput.waitFor({ state: 'visible' });
    await p.expenseAmtInput.fill('50');
    // description ว่าง → validation ควรจับก่อน amount
    await p.confirmExpenseBtn.click();

    await waitForToast(page, 'กรุณากรอกรายละเอียด');
  });

  test('T6 — เพิ่มรายจ่ายสำเร็จ (ค่าน้ำแข็ง 50 บาท)', async ({ page }) => {
    const p = new ShiftPage(page);
    await p.goto();

    await p.addExpenseBtn.click();
    await p.expenseCatSelect.waitFor({ state: 'visible' });
    await p.expenseCatSelect.selectOption('ice');
    await p.expenseDescInput.fill('ซื้อน้ำแข็ง 2 ถุง');
    await p.expenseAmtInput.fill('50');
    await p.confirmExpenseBtn.click();

    await waitForToast(page, 'เพิ่มรายจ่ายสำเร็จ');
    await expect(p.expenseRowByDesc('ซื้อน้ำแข็ง 2 ถุง')).toBeVisible();
  });

  test('T7 — ลบรายจ่ายสำเร็จ', async ({ page }) => {
    const p = new ShiftPage(page);
    await p.goto();

    page.once('dialog', (d) => d.accept());
    await p.deleteExpenseBtn('ซื้อน้ำแข็ง 2 ถุง').click();

    await waitForToast(page, 'ลบรายจ่ายสำเร็จ');
    await expect(p.expenseRowByDesc('ซื้อน้ำแข็ง 2 ถุง')).not.toBeVisible();
  });

  test('T8 — Close shift modal แสดง "ส่วนต่าง" เมื่อกรอกยอดครบ', async ({ page }) => {
    const p = new ShiftPage(page);
    await p.goto();

    await p.closeShiftBtn.click();
    await p.actualCashInput.waitFor({ state: 'visible' });
    await p.actualCashInput.fill('500');
    await p.actualNonCashInput.fill('0');

    // section นี้แสดงเมื่อ actualCash && actualNonCash ทั้งคู่มีค่า
    await expect(page.getByText('ส่วนต่าง', { exact: true })).toBeVisible();

    // ปิด modal แล้วกลับไปหน้าหลัก
    await p.closeModalXBtn.click();
    await expect(p.closeShiftBtn).toBeVisible();
  });

  test('T9 — ปิดกะสำเร็จ', async ({ page }) => {
    const p = new ShiftPage(page);
    await p.goto();

    await p.closeShiftBtn.click();
    await p.actualCashInput.waitFor({ state: 'visible' });
    await p.actualCashInput.fill('500');
    await p.actualNonCashInput.fill('0');
    await p.confirmCloseBtn.click();

    await waitForToast(page, 'ปิดกะสำเร็จ');
    await expect(p.noShiftMsg).toBeVisible();
  });

  test('T10 — (Admin) History table แสดงกะที่ปิดแล้ว', async ({ page }) => {
    const p = new ShiftPage(page);
    await p.goto();

    // ใช้ .first() เพราะ filter คืน NodeList — toBeVisible() fail ถ้ามีหลาย elements
    await expect(p.historyTable.locator('tr').filter({ hasText: 'ปิดแล้ว' }).first()).toBeVisible();
  });

  test('T11 — (Admin) Filter status="ปิดแล้ว" แสดงเฉพาะ closed', async ({ page }) => {
    const p = new ShiftPage(page);
    await p.goto();

    await p.statusFilter.selectOption('closed');
    await p.searchBtn.click();
    await page.waitForLoadState('networkidle');

    await expect(p.historyTable.locator('tr').filter({ hasText: 'ปิดแล้ว' }).first()).toBeVisible();
    await expect(p.historyTable.locator('tr').filter({ hasText: 'เปิดอยู่' })).toHaveCount(0);
  });

  test('T12 (Cross-Page) — POSPage แสดง modal "กรุณาเปิดกะก่อน" เมื่อไม่มี open shift', async ({ page }) => {
    await page.goto('/admin/pos');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('กรุณาเปิดกะก่อน')).toBeVisible({ timeout: 8000 });
  });
});
