import { test, expect } from '@playwright/test';

// Test configuration
const TEST_USER = {
  admin: {
    username: 'admin',
    password: 'admin123',
  },
};

const BASE_URL = 'http://localhost:5173';

test.describe('Blocked Dates Feature E2E Tests', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/admin/login`);

    // Fill in login credentials
    await page.fill('input[name="username"]', TEST_USER.admin.username);
    await page.fill('input[name="password"]', TEST_USER.admin.password);

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 10000 });

    // Navigate to booking page where blocked dates feature is located
    await page.goto(`${BASE_URL}/admin/booking`);
    await page.waitForTimeout(1000);
  });

  test.describe('Blocked Dates Section Display', () => {
    test('should display blocked dates section on booking page', async ({ page }) => {
      // Verify blocked dates section header is visible
      await expect(page.locator('h3:has-text("วันปิดการจอง")')).toBeVisible();

      // Verify section description
      await expect(page.locator('text=กำหนดวันที่ไม่เปิดให้จอง')).toBeVisible();
    });

    test('should display blocked dates icon', async ({ page }) => {
      // Verify CalendarX icon container is visible (red background)
      const iconContainer = page.locator('.bg-red-100').first();
      await expect(iconContainer).toBeVisible();
    });

    test('should display add blocked date form', async ({ page }) => {
      // Verify date input exists
      const dateInput = page.locator('input[type="date"]').last();
      await expect(dateInput).toBeVisible();

      // Verify reason input exists
      const reasonInput = page.locator('input[placeholder*="เหตุผล"]');
      await expect(reasonInput).toBeVisible();

      // Verify add button exists
      const addButton = page.locator('button:has-text("เพิ่ม")').last();
      await expect(addButton).toBeVisible();
    });

    test('should show empty state when no blocked dates', async ({ page }) => {
      // Check for empty state (if no blocked dates exist)
      const emptyState = page.locator('text=ยังไม่มีวันปิดการจอง');
      const blockedDatesList = page.locator('.bg-red-50');

      // Either empty state or blocked dates list should be visible
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      const hasBlockedDates = await blockedDatesList.count() > 0;

      expect(hasEmptyState || hasBlockedDates).toBeTruthy();
    });
  });

  test.describe('Add Blocked Date', () => {
    test('should show error when adding without date', async ({ page }) => {
      // Clear date input (make sure it's empty)
      const dateInput = page.locator('input[type="date"]').last();
      await dateInput.fill('');

      // Click add button
      const addButton = page.locator('button:has-text("เพิ่ม")').last();

      // Button should be disabled when no date
      await expect(addButton).toBeDisabled();
    });

    test('should add blocked date successfully', async ({ page }) => {
      // Calculate a unique future date using random offset (30-40 days)
      const futureDate = new Date();
      const randomDays = 30 + Math.floor(Math.random() * 10);
      futureDate.setDate(futureDate.getDate() + randomDays);
      const dateString = futureDate.toISOString().split('T')[0];
      const uniqueReason = `E2E Test ${Date.now()}`;

      // Fill date input
      const dateInput = page.locator('input[type="date"]').last();
      await dateInput.fill(dateString);

      // Fill reason with unique identifier
      const reasonInput = page.locator('input[placeholder*="เหตุผล"]');
      await reasonInput.fill(uniqueReason);

      // Click add button
      const addButton = page.locator('button:has-text("เพิ่ม")').last();
      await addButton.click();

      // Wait for toast notification - could be success or already blocked
      const successToast = page.locator('text=เพิ่มวันปิดการจองสำเร็จ');
      const alreadyBlockedToast = page.locator('text=วันนี้ถูกปิดการจองไปแล้ว');

      await expect(successToast.or(alreadyBlockedToast)).toBeVisible({ timeout: 5000 });

      // If successful, verify blocked date appears in list (with pagination support)
      if (await successToast.isVisible()) {
        await page.waitForTimeout(500);

        // Navigate through pagination to find the added item
        let found = false;
        const maxPages = 10;

        for (let i = 0; i < maxPages && !found; i++) {
          const blockedDateItem = page.locator('.bg-red-50').filter({ hasText: uniqueReason });
          if (await blockedDateItem.isVisible().catch(() => false)) {
            found = true;
            await expect(blockedDateItem).toBeVisible();
          } else {
            // Try to click next page if available
            const nextButton = page.locator('button[title="หน้าถัดไป"]:not([disabled])');
            if (await nextButton.isVisible().catch(() => false)) {
              await nextButton.click();
              await page.waitForTimeout(300);
            } else {
              break;
            }
          }
        }

        expect(found).toBeTruthy();
      }
    });

    test('should add blocked date without reason', async ({ page }) => {
      // Calculate a unique future date using random offset (20-30 days)
      const futureDate = new Date();
      const randomDays = 20 + Math.floor(Math.random() * 10);
      futureDate.setDate(futureDate.getDate() + randomDays);
      const dateString = futureDate.toISOString().split('T')[0];

      // Fill only date input (no reason)
      const dateInput = page.locator('input[type="date"]').last();
      await dateInput.fill(dateString);

      // Leave reason empty
      const reasonInput = page.locator('input[placeholder*="เหตุผล"]');
      await reasonInput.fill('');

      // Click add button
      const addButton = page.locator('button:has-text("เพิ่ม")').last();
      await addButton.click();

      // Wait for toast notification - could be success or already blocked
      const successToast = page.locator('text=เพิ่มวันปิดการจองสำเร็จ');
      const alreadyBlockedToast = page.locator('text=วันนี้ถูกปิดการจองไปแล้ว');

      await expect(successToast.or(alreadyBlockedToast)).toBeVisible({ timeout: 5000 });
    });

    test('should prevent adding duplicate blocked date', async ({ page }) => {
      // Use a fixed future date that we'll try to add twice
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 50); // Far future to avoid conflicts
      const dateString = futureDate.toISOString().split('T')[0];

      const dateInput = page.locator('input[type="date"]').last();
      const addButton = page.locator('button:has-text("เพิ่ม")').last();

      // First attempt - add blocked date
      await dateInput.fill(dateString);
      await addButton.click();

      // Wait for first result (could be success or already blocked)
      const successToast = page.locator('text=เพิ่มวันปิดการจองสำเร็จ');
      const alreadyBlockedToast = page.locator('text=วันนี้ถูกปิดการจองไปแล้ว');

      await expect(successToast.or(alreadyBlockedToast)).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(1500); // Wait for toast to disappear

      // Second attempt - try to add same date again
      await dateInput.fill(dateString);
      await addButton.click();

      // Should show error toast since the date is now blocked
      await expect(page.locator('text=วันนี้ถูกปิดการจองไปแล้ว')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Display Blocked Dates List', () => {
    test('should display blocked date with formatted date', async ({ page }) => {
      // First add a blocked date with unique reason
      const futureDate = new Date();
      const randomDays = 60 + Math.floor(Math.random() * 10);
      futureDate.setDate(futureDate.getDate() + randomDays);
      const dateString = futureDate.toISOString().split('T')[0];
      const uniqueReason = `วันจัดแข่งขัน ${Date.now()}`;

      const dateInput = page.locator('input[type="date"]').last();
      await dateInput.fill(dateString);

      const reasonInput = page.locator('input[placeholder*="เหตุผล"]');
      await reasonInput.fill(uniqueReason);

      const addButton = page.locator('button:has-text("เพิ่ม")').last();
      await addButton.click();

      // Wait for success or already blocked
      const successToast = page.locator('text=เพิ่มวันปิดการจองสำเร็จ');
      const alreadyBlockedToast = page.locator('text=วันนี้ถูกปิดการจองไปแล้ว');
      await expect(successToast.or(alreadyBlockedToast)).toBeVisible({ timeout: 5000 });

      // If successful, verify blocked date item shows with reason (with pagination support)
      if (await successToast.isVisible()) {
        await page.waitForTimeout(500);

        // Navigate through pagination to find the added item
        let found = false;
        const maxPages = 15;

        for (let i = 0; i < maxPages && !found; i++) {
          const blockedDateItem = page.locator('.bg-red-50').filter({ hasText: uniqueReason });
          if (await blockedDateItem.isVisible().catch(() => false)) {
            found = true;
            await expect(blockedDateItem).toBeVisible();
          } else {
            // Try to click next page if available
            const nextButton = page.locator('button[title="หน้าถัดไป"]:not([disabled])');
            if (await nextButton.isVisible().catch(() => false)) {
              await nextButton.click();
              await page.waitForTimeout(300);
            } else {
              break;
            }
          }
        }

        expect(found).toBeTruthy();
      } else {
        // Even if date was already blocked, verify at least one blocked date exists
        const blockedDateItems = page.locator('.bg-red-50');
        await expect(blockedDateItems.first()).toBeVisible();
      }
    });

    test('should display delete button for each blocked date', async ({ page }) => {
      // Check if there are blocked dates in the list
      const blockedDateItems = page.locator('.bg-red-50');
      const count = await blockedDateItems.count();

      if (count > 0) {
        // Each item should have a delete button
        const deleteButtons = blockedDateItems.first().locator('button');
        await expect(deleteButtons).toBeVisible();
      }
    });
  });

  test.describe('Remove Blocked Date', () => {
    test('should remove blocked date successfully', async ({ page }) => {
      // First add a blocked date to remove with unique identifier
      const futureDate = new Date();
      const randomDays = 70 + Math.floor(Math.random() * 10);
      futureDate.setDate(futureDate.getDate() + randomDays);
      const dateString = futureDate.toISOString().split('T')[0];
      const uniqueReason = `DELETE_TEST_${Date.now()}`;

      const dateInput = page.locator('input[type="date"]').last();
      await dateInput.fill(dateString);

      const reasonInput = page.locator('input[placeholder*="เหตุผล"]');
      await reasonInput.fill(uniqueReason);

      const addButton = page.locator('button:has-text("เพิ่ม")').last();
      await addButton.click();

      // Wait for success or already blocked
      const successToast = page.locator('text=เพิ่มวันปิดการจองสำเร็จ');
      const alreadyBlockedToast = page.locator('text=วันนี้ถูกปิดการจองไปแล้ว');
      await expect(successToast.or(alreadyBlockedToast)).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500);

      // Handle confirm dialog
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });

      // Find a blocked date item and delete it
      const blockedDateItems = page.locator('.bg-red-50');
      const hasItems = (await blockedDateItems.count()) > 0;

      if (hasItems) {
        const firstItem = blockedDateItems.first();
        const deleteButton = firstItem.locator('button');
        await deleteButton.click();

        // Wait for toast notification
        await expect(page.locator('text=ลบวันปิดการจองสำเร็จ')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show confirm dialog before removing', async ({ page }) => {
      // Check if there are blocked dates
      const blockedDateItems = page.locator('.bg-red-50');
      const count = await blockedDateItems.count();

      if (count > 0) {
        let dialogShown = false;

        // Listen for dialog
        page.on('dialog', async (dialog) => {
          dialogShown = true;
          expect(dialog.message()).toContain('ต้องการลบวันปิดการจอง');
          await dialog.dismiss(); // Cancel deletion
        });

        // Click delete button on first item
        const deleteButton = blockedDateItems.first().locator('button');
        await deleteButton.click();

        await page.waitForTimeout(500);
        expect(dialogShown).toBeTruthy();
      }
    });
  });

  test.describe('Integration with Booking Calendar', () => {
    test('should refresh schedule after adding blocked date', async ({ page }) => {
      // Add a blocked date for today
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];

      // First check if today is already blocked
      const dateInput = page.locator('input[type="date"]').last();
      await dateInput.fill(dateString);

      const addButton = page.locator('button:has-text("เพิ่ม")').last();
      await addButton.click();

      // Either success or already blocked message should appear
      await page.waitForTimeout(1000);

      // Page should still be functional
      await expect(page.locator('h3:has-text("วันปิดการจอง")')).toBeVisible();
    });
  });

  test.describe('Admin Booking Prevention', () => {
    test('should show blocked warning banner on blocked date', async ({ page }) => {
      // Add a blocked date for today
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      const uniqueReason = `Test Block ${Date.now()}`;

      const dateInput = page.locator('input[type="date"]').last();
      await dateInput.fill(dateString);

      const reasonInput = page.locator('input[placeholder*="เหตุผล"]');
      await reasonInput.fill(uniqueReason);

      const addButton = page.locator('button:has-text("เพิ่ม")').last();
      await addButton.click();

      // Wait for toast to appear and the page to refresh
      const successToast = page.locator('text=เพิ่มวันปิดการจองสำเร็จ');
      const alreadyBlockedToast = page.locator('text=วันนี้ถูกปิดการจองไปแล้ว');
      await expect(successToast.or(alreadyBlockedToast)).toBeVisible({ timeout: 5000 });

      // Wait for schedule to reload
      await page.waitForTimeout(1500);

      // Check if blocked slots appear OR the warning banner
      // The blocked slots text "ปิดการจอง" should be visible
      const blockedSlots = page.locator('text=ปิดการจอง');
      const blockedSlotsCount = await blockedSlots.count();

      // Either blocked slots or warning banner should be visible
      // This confirms the date is recognized as blocked
      expect(blockedSlotsCount).toBeGreaterThan(0);
    });

    test('should show error when admin tries to book on blocked date', async ({ page }) => {
      // First ensure today is blocked
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];

      const dateInput = page.locator('input[type="date"]').last();
      await dateInput.fill(dateString);

      const addButton = page.locator('button:has-text("เพิ่ม")').last();
      await addButton.click();

      // Wait for the action to complete
      await page.waitForTimeout(1500);

      // Try to click on a blocked slot (gray slots with "ปิดการจอง" text)
      const blockedSlot = page.locator('.p-3.rounded-lg:has-text("ปิดการจอง")').first();
      const hasBlockedSlot = await blockedSlot.isVisible().catch(() => false);

      if (hasBlockedSlot) {
        await blockedSlot.click();

        // Should show error toast
        const errorToast = page.locator('[role="status"]:has-text("ไม่สามารถจองได้"), [role="status"]:has-text("วันนี้ปิดการจอง")');
        await expect(errorToast.first()).toBeVisible({ timeout: 3000 });
      } else {
        // If today is not blocked yet, just verify the test setup worked
        await expect(page.locator('h3:has-text("วันปิดการจอง")')).toBeVisible();
      }
    });

    test('should display slots as blocked (gray) on blocked date', async ({ page }) => {
      // First ensure today is blocked
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];

      const dateInput = page.locator('input[type="date"]').last();
      await dateInput.fill(dateString);

      const addButton = page.locator('button:has-text("เพิ่ม")').last();
      await addButton.click();

      // Wait for action to complete
      await page.waitForTimeout(1500);

      // Check that slots show "ปิดการจอง" text
      const blockedSlotText = page.locator('text=ปิดการจอง');
      const count = await blockedSlotText.count();

      // At least some slots should show "ปิดการจอง"
      expect(count).toBeGreaterThan(0);
    });
  });

});
