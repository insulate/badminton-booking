import { test, expect, request as playwrightRequest } from '@playwright/test';
import { readFileSync } from 'fs';
import { POSPage } from '../pages/POSPage.js';

const BASE = 'http://localhost:3000';

async function waitForToast(page, text) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 8000 });
}

test.describe('POS Page (/admin/pos)', () => {
  test.describe.configure({ mode: 'serial' });

  let token;
  let shiftId;
  let testProduct;         // active product ชิ้นแรกจาก API
  let testCategoryLabel;   // label ของ category ของ testProduct
  let lastSaleCode;        // saleCode จาก T10 ใช้ใน T15 (cross-page)
  let pendingSaleId;       // pending sale จาก T13 → void ใน afterAll

  test.beforeAll(async () => {
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;
    if (!token) return;

    const ctx = await playwrightRequest.newContext();
    const headers = { Authorization: `Bearer ${token}` };

    // 1. ปิด shift ที่ค้างอยู่จาก run ก่อนหน้า
    const currentRes = await ctx.get(`${BASE}/api/shifts/current`, { headers });
    if (currentRes.ok()) {
      const data = await currentRes.json();
      if (data.hasOpenShift && data.data?._id) {
        await ctx.post(`${BASE}/api/shifts/${data.data._id}/close`, {
          headers,
          data: { actualCash: 0, actualNonCash: 0, note: 'POS E2E cleanup beforeAll' },
        });
      }
    }

    // 2. เปิด shift ใหม่ (POS ต้องการ open shift ก่อนขาย)
    const openRes = await ctx.post(`${BASE}/api/shifts/open`, {
      headers,
      data: { openingCash: 500 },
    });
    if (openRes.ok()) {
      const openData = await openRes.json();
      shiftId = openData.data?._id;
    }

    // 3. ดึง active product ชิ้นแรกเพื่อใช้ใน tests
    const productsRes = await ctx.get(`${BASE}/api/products?status=active`, { headers });
    if (productsRes.ok()) {
      const productsData = await productsRes.json();
      testProduct = productsData.data?.[0] ?? null;
    }

    // 4. ดึง category label ของ testProduct (ปุ่มในหน้า POS ใช้ label ไม่ใช่ name)
    if (testProduct?.category) {
      const catsRes = await ctx.get(`${BASE}/api/categories?isActive=true`, { headers });
      if (catsRes.ok()) {
        const catsData = await catsRes.json();
        const cat = catsData.data?.find((c) => c.name === testProduct.category);
        testCategoryLabel = cat?.label ?? null;
      }
    }

    await ctx.dispose();
  });

  test.afterAll(async () => {
    if (!token) return;
    const ctx = await playwrightRequest.newContext();
    const headers = { Authorization: `Bearer ${token}` };

    // void pending sale ที่สร้างระหว่าง test (T13)
    if (pendingSaleId) {
      await ctx.patch(`${BASE}/api/sales/${pendingSaleId}/void`, { headers }).catch(() => {});
    }

    // ปิด shift ที่เปิดไว้
    const currentRes = await ctx.get(`${BASE}/api/shifts/current`, { headers });
    if (currentRes.ok()) {
      const data = await currentRes.json();
      if (data.hasOpenShift && data.data?._id) {
        await ctx.post(`${BASE}/api/shifts/${data.data._id}/close`, {
          headers,
          data: { actualCash: 0, actualNonCash: 0, note: 'POS E2E cleanup afterAll' },
        });
      }
    }

    await ctx.dispose();
  });

  // ── T1: Page โหลด ─────────────────────────────────────────────────────────
  test('T1 — Page โหลดสำเร็จ แสดง products, category buttons, cart ว่าง', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    await expect(p.cartEmptyMsg).toBeVisible();
    await expect(p.productCard(testProduct.name)).toBeVisible();
    await expect(p.allCategoryBtn).toBeVisible();
    await expect(p.searchInput).toBeVisible();
  });

  // ── T2: ค้นหาสินค้า ───────────────────────────────────────────────────────
  test('T2 — ค้นหาสินค้าด้วยชื่อ → product ที่ตรงปรากฏ', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    const keyword = testProduct.name.slice(0, 3);
    await p.searchInput.fill(keyword);
    await expect(p.productCard(testProduct.name)).toBeVisible();
  });

  // ── T3: กรอง Category ─────────────────────────────────────────────────────
  test('T3 — Category filter: click category → product visible; ทั้งหมด resets', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    if (testCategoryLabel) {
      await p.categoryBtn(testCategoryLabel).click();
      await expect(p.productCard(testProduct.name)).toBeVisible();
    }

    await p.allCategoryBtn.click();
    await expect(p.productCard(testProduct.name)).toBeVisible();
  });

  // ── T4: เพิ่มสินค้าลงตะกร้า ──────────────────────────────────────────────
  test('T4 — เพิ่มสินค้าลงตะกร้า → toast + cart count = 1', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    await p.productCard(testProduct.name).click();
    await waitForToast(page, `เพิ่ม ${testProduct.name} ลงตะกร้า`);
    await expect(p.cartCountBadge).toHaveText('1');
  });

  // ── T5: เพิ่ม quantity (+) ────────────────────────────────────────────────
  test('T5 — click (+) → qty = 2, subtotal อัปเดต', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    await p.productCard(testProduct.name).click();
    await p.qtyPlusBtn.click();

    await expect(p.qtyDisplay).toHaveText('2');
    const expectedSubtotal = `฿${(testProduct.price * 2).toFixed(2)}`;
    await expect(p.qtySubtotal).toContainText(expectedSubtotal);
  });

  // ── T6: ลด quantity จนถึง 0 → ลบออกจาก cart ──────────────────────────────
  test('T6 — click (−) เมื่อ qty = 1 → สินค้าหายออกจาก cart', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    await p.productCard(testProduct.name).click();
    await p.qtyMinusBtn.click(); // qty 1 → 0 → removeFromCart

    await expect(p.cartEmptyMsg).toBeVisible({ timeout: 5000 });
  });

  // ── T7: ล้างตะกร้า ────────────────────────────────────────────────────────
  test('T7 — ล้างทั้งหมด → cart กลับสู่ว่าง', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    await p.productCard(testProduct.name).click();
    await p.qtyPlusBtn.click(); // qty 1 → 2
    await p.clearCartBtn.click();

    await expect(p.cartEmptyMsg).toBeVisible({ timeout: 5000 });
  });

  // ── T8: Payment Modal เปิด-ปิด ───────────────────────────────────────────
  test('T8 — Payment Modal: เปิดได้และปิดด้วยปุ่ม ยกเลิก', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    await p.productCard(testProduct.name).click();
    await p.payBtn.click();
    await p.paymentModal.waitFor({ state: 'visible' });
    await expect(p.paymentModal).toBeVisible();

    await p.cancelPayModalBtn.click();
    await expect(p.paymentModal).not.toBeVisible({ timeout: 5000 });
  });

  // ── T9: ชำระเงินสด — เงินไม่พอ ───────────────────────────────────────────
  test('T9 — ชำระเงินสด: receivedAmount น้อยกว่า total → "เงินไม่พอ" + disabled', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    await p.productCard(testProduct.name).click();
    await p.payBtn.click();
    await p.paymentModal.waitFor({ state: 'visible' });

    await p.receivedAmtInput.fill('1'); // น้อยกว่า total เสมอ (สินค้าราคา > ฿1)
    await expect(p.changeDisplay).toHaveText('เงินไม่พอ');
    await expect(p.confirmPayBtn).toBeDisabled();

    await p.cancelPayModalBtn.click();
  });

  // ── T10: ชำระเงินสด — พอดี → success ─────────────────────────────────────
  test('T10 — ชำระเงินสด: กด "พอดี" → toast success, cart ว่าง', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    await p.productCard(testProduct.name).click();
    await p.payBtn.click();
    await p.paymentModal.waitFor({ state: 'visible' });

    await p.exactAmtBtn.click();
    await expect(p.changeDisplay).toContainText('฿0.00');
    await expect(p.confirmPayBtn).toBeEnabled();

    await p.confirmPayBtn.click();
    await waitForToast(page, 'บันทึกการขายสำเร็จ');
    await expect(p.cartEmptyMsg).toBeVisible({ timeout: 5000 });

    // บันทึก saleCode ล่าสุดสำหรับ T15 (cross-page)
    lastSaleCode = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/sales?limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.data?.[0]?.saleCode ?? null;
    });
  });

  // ── T11: ชำระเงินโอน ─────────────────────────────────────────────────────
  test('T11 — ชำระเงินโอน (transfer) → toast success', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    await p.productCard(testProduct.name).click();
    await p.payBtn.click();
    await p.paymentModal.waitFor({ state: 'visible' });

    await p.paymentMethodBtn('โอนเงิน (Mobile Banking)').click();
    await p.confirmPayBtn.click();
    await waitForToast(page, 'บันทึกการขายสำเร็จ');
    await expect(p.cartEmptyMsg).toBeVisible({ timeout: 5000 });
  });

  // ── T12: Tab Mode — validation ────────────────────────────────────────────
  test('T12 — Tab Mode: ไม่กรอกชื่อลูกค้า → ปุ่ม checkout disabled', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    await p.productCard(testProduct.name).click();
    await p.tabModeCheckbox.check();

    // tabAction='new', customerMode='new' (default) — ไม่กรอกชื่อ
    await expect(p.checkoutBtn).toBeDisabled();
    await expect(p.checkoutBtn).toContainText('กรุณากรอกชื่อลูกค้า');
  });

  // ── T13: Tab Mode — เปิดบิลใหม่ walk-in ─────────────────────────────────
  test('T13 — Tab Mode: เปิดบิลใหม่ walk-in → toast เปิดบิลสำเร็จ', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');

    const p = new POSPage(page);
    await p.goto();

    await p.productCard(testProduct.name).click();
    await p.tabModeCheckbox.check();
    await p.tabCustomerInput.fill('Test Tab Customer');

    await expect(p.checkoutBtn).toBeEnabled();
    await p.checkoutBtn.click();
    await waitForToast(page, 'เปิดบิลสำเร็จ');
    await expect(p.cartEmptyMsg).toBeVisible({ timeout: 5000 });

    // บันทึก pendingSaleId สำหรับ afterAll cleanup
    pendingSaleId = await page.evaluate(async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/sales?paymentStatus=pending&limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.data?.[0]?._id ?? null;
    });
  });

  // ── T14: Tab Mode — เพิ่มเข้าบิลเดิม ────────────────────────────────────
  test('T14 — Tab Mode: เพิ่มสินค้าเข้าบิลที่มีอยู่ → toast success', async ({ page }) => {
    if (!testProduct) test.skip(true, 'ไม่มี active product ในระบบ');
    if (!pendingSaleId) test.skip(true, 'ไม่มี pending sale จาก T13');

    const p = new POSPage(page);
    await p.goto();

    await p.productCard(testProduct.name).click();
    await p.tabModeCheckbox.check();
    await page.waitForLoadState('networkidle'); // รอ fetchPendingSales เสร็จ

    await p.tabExistingBtn.click();
    await p.pendingSaleSelect.waitFor({ state: 'visible' });
    await p.pendingSaleSelect.selectOption(pendingSaleId);

    await expect(p.checkoutBtn).toBeEnabled();
    await p.checkoutBtn.click();
    await waitForToast(page, 'เพิ่มสินค้าเข้าบิล');
    await expect(p.cartEmptyMsg).toBeVisible({ timeout: 5000 });
  });

  // ── T15 (Cross-Page): SalesHistoryPage แสดง sale จาก T10 ─────────────────
  test('T15 (Cross-Page) — SalesHistoryPage แสดงรายการที่ขายจาก POS', async ({ page }) => {
    if (!lastSaleCode) test.skip(true, 'ไม่มี lastSaleCode จาก T10');

    await page.goto('/admin/sales');
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('networkidle');

    // ค้นหาด้วย saleCode ที่ได้จาก T10
    await page.locator('input[placeholder="S-00001"]').fill(lastSaleCode);
    await page.locator('input[placeholder="S-00001"]').press('Enter');
    await page.waitForLoadState('networkidle');

    const saleRow = page.locator('table tbody tr').filter({ hasText: lastSaleCode });
    await expect(saleRow).toBeVisible({ timeout: 8000 });
    await expect(saleRow.getByText('ชำระแล้ว')).toBeVisible();
  });
});
