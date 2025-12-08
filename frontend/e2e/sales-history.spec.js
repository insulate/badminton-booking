import { test, expect } from '@playwright/test';

test.describe('Sales History Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should display sales history page with correct theme', async ({ page }) => {
    // Navigate to sales history
    await page.click('text=ขายสินค้า');
    await page.click('text=ประวัติการขาย');
    await page.waitForURL('/admin/sales');

    // Check gradient header exists
    const header = page.locator('h1:has-text("ประวัติการขาย")');
    await expect(header).toBeVisible();

    // Check if gradient background is applied
    const mainContainer = page.locator('div.bg-gradient-to-br');
    await expect(mainContainer).toBeVisible();
  });

  test('should have date pickers with default values', async ({ page }) => {
    await page.goto('/admin/sales');

    // Check for date inputs
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').nth(1);

    await expect(startDateInput).toBeVisible();
    await expect(endDateInput).toBeVisible();

    // Both should have values (today's date)
    const startValue = await startDateInput.inputValue();
    const endValue = await endDateInput.inputValue();

    expect(startValue).toBeTruthy();
    expect(endValue).toBeTruthy();
  });

  test('should display sales table or empty state', async ({ page }) => {
    await page.goto('/admin/sales');

    // Wait for loading to finish
    await page.waitForTimeout(1000);

    // Check for either table or empty state
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=ไม่พบรายการขาย').isVisible().catch(() => false);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('should open detail modal when clicking view details', async ({ page }) => {
    await page.goto('/admin/sales');

    // Wait for sales to load
    await page.waitForTimeout(1000);

    // Check if there are any sales
    const viewButton = page.locator('button:has-text("ดูรายละเอียด")').first();
    const isVisible = await viewButton.isVisible().catch(() => false);

    if (isVisible) {
      // Click view details button
      await viewButton.click();

      // Check modal appears
      await expect(page.locator('text=รายละเอียดการขาย')).toBeVisible();

      // Check for product images in table
      const productTable = page.locator('table').nth(1);
      await expect(productTable).toBeVisible();

      // Close modal
      await page.locator('button:has-text("ปิด")').click();
    }
  });

  test('should filter by payment method', async ({ page }) => {
    await page.goto('/admin/sales');

    // Select payment method filter
    const paymentSelect = page.locator('select').filter({ hasText: 'ทั้งหมด' }).first();
    await paymentSelect.selectOption('cash');

    // Wait for results to update
    await page.waitForTimeout(500);

    // Page should still be functional (no errors)
    await expect(page.locator('h1:has-text("ประวัติการขาย")')).toBeVisible();
  });

  test('should search by sale code', async ({ page }) => {
    await page.goto('/admin/sales');

    // Type in search box
    const searchInput = page.locator('input[placeholder="S-00001"]');
    await searchInput.fill('S-00001');

    // Click search button
    await page.locator('button:has(svg)').filter({ has: page.locator('svg') }).first().click();

    // Wait for results
    await page.waitForTimeout(500);

    // Page should still be functional
    await expect(page.locator('h1:has-text("ประวัติการขาย")')).toBeVisible();
  });

  test('should display summary statistics', async ({ page }) => {
    await page.goto('/admin/sales');

    // Check for summary cards
    await expect(page.locator('text=จำนวนรายการ')).toBeVisible();
    await expect(page.locator('text=ยอดขายรวม')).toBeVisible();
    await expect(page.locator('text=ค่าเฉลี่ยต่อรายการ')).toBeVisible();
  });
});
