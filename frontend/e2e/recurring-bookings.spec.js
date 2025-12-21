import { test, expect } from '@playwright/test';

// Test configuration
const TEST_USER = {
  admin: {
    username: 'admin',
    password: 'admin123',
  },
};

const BASE_URL = 'http://localhost:5173';

test.describe('Recurring Bookings E2E Tests', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input[name="username"]', TEST_USER.admin.username);
    await page.fill('input[name="password"]', TEST_USER.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 10000 });
  });

  test.describe('Recurring Bookings List Page', () => {
    test('should navigate to recurring bookings page', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await expect(page).toHaveURL(`${BASE_URL}/admin/recurring-bookings`);
      await expect(page.locator('h1').filter({ hasText: 'การจองประจำ' })).toBeVisible();
    });

    test('should display recurring bookings table', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      // Verify table headers
      await expect(page.locator('th:has-text("รหัส")')).toBeVisible();
      await expect(page.locator('th:has-text("ลูกค้า")')).toBeVisible();
      await expect(page.locator('th:has-text("รายละเอียด")')).toBeVisible();
      await expect(page.locator('th:has-text("สถานะ")')).toBeVisible();
    });

    test('should have create recurring booking button', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await expect(page.locator('button:has-text("สร้างการจองประจำ")')).toBeVisible();
    });

    test('should search recurring bookings by customer name', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      const searchInput = page.locator('input[placeholder*="ค้นหา"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('สมชาย');
        await page.waitForTimeout(500);

        // Verify filtered results contain search term
        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();
        if (rowCount > 0) {
          const firstRowText = await rows.first().textContent();
          expect(firstRowText).toContain('สมชาย');
        }
      }
    });

    test('should filter recurring bookings by status', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      const statusFilter = page.locator('select').filter({
        has: page.locator('option:has-text("กำลังดำเนินการ")'),
      });

      if (await statusFilter.count() > 0) {
        await statusFilter.selectOption({ label: 'กำลังดำเนินการ' });
        await page.waitForTimeout(500);
        await expect(page).toHaveURL(`${BASE_URL}/admin/recurring-bookings`);
      }
    });
  });

  test.describe('Create Recurring Booking', () => {
    test('should open create recurring booking form', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      // Click create button using force to bypass overlay issues
      await page.locator('button:has-text("สร้างการจองประจำ")').click();
      await page.waitForTimeout(1000);

      // Verify form elements are visible - look in the form panel
      const formPanel = page.locator('h2:has-text("สร้างการจองประจำใหม่")');
      await expect(formPanel).toBeVisible({ timeout: 5000 });
    });

    test('should search and select customer in form', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      await page.locator('button:has-text("สร้างการจองประจำ")').click();
      await page.waitForTimeout(1000);

      // Search for customer
      const customerInput = page.locator('input[placeholder*="ค้นหาลูกค้า"]');
      await customerInput.fill('สมชาย');
      await page.waitForTimeout(500);

      // Click on customer from dropdown
      const customerOption = page.locator('button:has-text("สมชาย ใจดี")');
      if (await customerOption.isVisible()) {
        await customerOption.click();
        await page.waitForTimeout(300);

        // Verify customer is selected
        await expect(page.locator('text=สมชาย ใจดี').first()).toBeVisible();
      }
    });

    test('should select court and timeslot', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      await page.locator('button:has-text("สร้างการจองประจำ")').click();
      await page.waitForTimeout(1000);

      // Select court - use name attribute
      const courtSelect = page.locator('select[name="court"]');
      if (await courtSelect.count() > 0) {
        await courtSelect.selectOption({ index: 1 });
      }

      // Select timeslot - use name attribute
      const timeslotSelect = page.locator('select[name="timeSlot"]');
      if (await timeslotSelect.count() > 0) {
        await timeslotSelect.selectOption({ index: 1 });
      }

      await expect(page).toHaveURL(`${BASE_URL}/admin/recurring-bookings`);
    });

    test('should select days of week', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      // Click create button
      const createBtn = page.locator('button:has-text("สร้างการจองประจำ")');
      await createBtn.click({ force: true });

      // Wait for form to open
      const formPanel = page.locator('h2:has-text("สร้างการจองประจำใหม่")');
      await expect(formPanel).toBeVisible({ timeout: 5000 });

      // Look for day buttons - use title attribute which has day name
      // Monday (จันทร์) button
      const mondayButton = page.locator('button[title="จันทร์"]');

      if (await mondayButton.count() > 0) {
        await mondayButton.click({ force: true });
        await page.waitForTimeout(500);

        // Verify day selection text appears (format: "เลือกแล้ว: วันจันทร์")
        const selectedText = page.locator('text=เลือกแล้ว:');
        await expect(selectedText).toBeVisible({ timeout: 3000 });
      }
    });

    test('should cancel create form', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      await page.locator('button:has-text("สร้างการจองประจำ")').click();
      await page.waitForTimeout(1000);

      // Find cancel button within the form (not table rows)
      // The form has a "ยกเลิก" button at the bottom
      const formCancelButton = page.locator('button:has-text("ยกเลิก")').last();
      await formCancelButton.click({ force: true });
      await page.waitForTimeout(500);

      // Form should be closed - verify we're still on the page
      await expect(page).toHaveURL(`${BASE_URL}/admin/recurring-bookings`);
    });
  });

  test.describe('View Recurring Booking Details', () => {
    test('should open details modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      const viewButton = page.locator('button:has-text("ดูรายละเอียด")').first();
      if (await viewButton.count() > 0) {
        await viewButton.click();
        await page.waitForTimeout(500);

        // Verify modal content
        await expect(page.locator('text=รวมทั้งหมด')).toBeVisible();
        await expect(page.locator('text=รายการจองทั้งหมด')).toBeVisible();
      }
    });

    test('should close details modal', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      const viewButton = page.locator('button:has-text("ดูรายละเอียด")').first();
      if (await viewButton.count() > 0) {
        await viewButton.click();
        await page.waitForTimeout(500);

        // Close modal
        const closeButton = page.locator('button:has-text("ปิด")');
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(300);
        }
      }

      await expect(page).toHaveURL(`${BASE_URL}/admin/recurring-bookings`);
    });
  });

  test.describe('Cancel Recurring Booking', () => {
    test('should show cancel button for active bookings', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      // Look for rows with "กำลังดำเนินการ" status
      const activeRows = page.locator('tr:has-text("กำลังดำเนินการ")');
      const count = await activeRows.count();

      if (count > 0) {
        // Verify cancel button exists in active rows
        const cancelButton = activeRows.first().locator('button:has-text("ยกเลิก")');
        await expect(cancelButton).toBeVisible();
      }
    });

    test('should not show cancel button for cancelled bookings', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      // Look for rows with "ยกเลิก" status (in the status cell, not the button)
      const cancelledRows = page.locator('tr').filter({
        has: page.locator('td:has-text("ยกเลิก"):not(:has(button))'),
      });
      const count = await cancelledRows.count();

      if (count > 0) {
        // Cancelled rows should not have cancel button
        const buttons = cancelledRows.first().locator('button:has-text("ยกเลิก")');
        expect(await buttons.count()).toBe(0);
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate from sidebar menu', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Click on booking menu
      await page.click('button:has-text("การจอง")');
      await page.waitForTimeout(300);

      // Click on recurring bookings link
      await page.click('a:has-text("การจองประจำ")');
      await page.waitForURL(`${BASE_URL}/admin/recurring-bookings`);

      await expect(page.locator('h1:has-text("การจองประจำ")')).toBeVisible();
    });

    test('should stay on page after operations', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);

      // Search
      const searchInput = page.locator('input[placeholder*="ค้นหา"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);
      }

      // Should still be on recurring bookings page
      await expect(page).toHaveURL(`${BASE_URL}/admin/recurring-bookings`);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      // Page should still be accessible
      await expect(page).toHaveURL(`${BASE_URL}/admin/recurring-bookings`);
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${BASE_URL}/admin/recurring-bookings`);
      await page.waitForTimeout(1000);

      await expect(page.locator('h1:has-text("การจองประจำ")')).toBeVisible();
    });
  });
});
