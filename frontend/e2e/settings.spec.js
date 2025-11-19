import { test, expect } from '@playwright/test';

// Test configuration
const TEST_USER = {
  admin: {
    username: 'admin',
    password: 'admin123', // Must match backend password validation
  },
  regular: {
    username: 'testuser',
    password: 'User123!', // Must match backend password validation
  },
};

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3000';

test.describe('Settings System E2E Tests', () => {
  // Login as admin before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);

    // Fill in login credentials
    await page.fill('input[name="username"]', TEST_USER.admin.username);
    await page.fill('input[name="password"]', TEST_USER.admin.password);

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(`${BASE_URL}/admin/dashboard`);
    await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
  });

  test.describe('Venue Settings', () => {
    test('should navigate to venue settings page', async ({ page }) => {
      // Click on Settings menu to expand
      await page.click('button:has-text("ตั้งค่า")');

      // Click on Venue Settings
      await page.click('a:has-text("ข้อมูลสนาม")');

      // Verify URL
      await expect(page).toHaveURL(`${BASE_URL}/admin/settings/venue`);

      // Verify page heading
      await expect(page.locator('h1:has-text("ข้อมูลสนาม")')).toBeVisible();
    });

    test('should load and display venue data', async ({ page }) => {
      // Navigate to venue settings
      await page.goto(`${BASE_URL}/admin/settings/venue`);

      // Wait for data to load
      await page.waitForSelector('input[name="name"]');

      // Verify form fields are visible
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('textarea[name="address"]')).toBeVisible();
      await expect(page.locator('input[name="phone"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('should update venue information', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/venue`);

      // Wait for form to load
      await page.waitForSelector('input[name="name"]');

      // Update venue name
      const newName = `Test Court ${Date.now()}`;
      await page.fill('input[name="name"]', newName);

      // Save changes
      await page.click('button[type="submit"]');

      // Wait for success toast
      await expect(page.locator('text=บันทึกข้อมูลสนามสำเร็จ')).toBeVisible();

      // Reload page and verify data persists
      await page.reload();
      await page.waitForSelector('input[name="name"]');
      await expect(page.locator('input[name="name"]')).toHaveValue(newName);
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/venue`);
      await page.waitForSelector('input[name="name"]');

      // Clear name field
      await page.fill('input[name="name"]', '');

      // Blur to trigger validation
      await page.locator('input[name="name"]').blur();

      // Check if validation message appears or input is invalid
      const isInvalid = await page.locator('input[name="name"]').evaluate(el => {
        return !el.validity.valid;
      });
      expect(isInvalid).toBe(true);
    });
  });

  test.describe('Operating Hours Settings', () => {
    test('should navigate to operating hours page', async ({ page }) => {
      await page.click('button:has-text("ตั้งค่า")');
      await page.click('a:has-text("เวลาทำการ")');

      await expect(page).toHaveURL(`${BASE_URL}/admin/settings/operating`);
      await expect(page.locator('h1:has-text("เวลาทำการ")')).toBeVisible();
    });

    test('should update operating hours', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/operating`);
      await page.waitForSelector('input[name="openTime"]');

      // Update times
      await page.fill('input[name="openTime"]', '08:00');
      await page.fill('input[name="closeTime"]', '20:00');

      // Save changes
      await page.click('button[type="submit"]');

      // Verify success toast
      await expect(page.locator('text=บันทึกเวลาทำการสำเร็จ')).toBeVisible();
    });

    test('should toggle days of operation', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/operating`);
      await page.waitForSelector('input[name="openTime"]');

      // Count currently selected days
      const selectedDaysBefore = await page.locator('input[type="checkbox"]:checked').count();

      // Click select all/deselect all button
      await page.click('button:has-text("เลือกทั้งหมด"), button:has-text("ยกเลิกทั้งหมด")');

      // Verify days changed
      const selectedDaysAfter = await page.locator('input[type="checkbox"]:checked').count();
      expect(selectedDaysAfter).not.toBe(selectedDaysBefore);
    });

    test('should display preview of operating hours', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/operating`);
      await page.waitForSelector('input[name="openTime"]');

      // Ensure at least one day is selected
      const hasSelectedDays = await page.locator('input[type="checkbox"]:checked').count() > 0;
      if (!hasSelectedDays) {
        await page.click('label:has(input[type="checkbox"])');
      }

      // Verify preview section is visible
      await expect(page.locator('text=ตัวอย่างเวลาทำการ')).toBeVisible();
    });
  });

  test.describe('Booking Settings', () => {
    test('should navigate to booking settings page', async ({ page }) => {
      await page.click('button:has-text("ตั้งค่า")');
      await page.click('a:has-text("การตั้งค่าการจอง")');

      await expect(page).toHaveURL(`${BASE_URL}/admin/settings/booking`);
      await expect(page.locator('h1:has-text("การตั้งค่าการจอง")')).toBeVisible();
    });

    test('should update booking rules', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/booking`);
      await page.waitForSelector('input[name="advanceBookingDays"]');

      // Update booking settings
      await page.fill('input[name="advanceBookingDays"]', '10');
      await page.fill('input[name="minBookingHours"]', '1');
      await page.fill('input[name="maxBookingHours"]', '4');
      await page.fill('input[name="cancellationHours"]', '48');

      // Save changes
      await page.click('button[type="submit"]');

      // Verify success
      await expect(page.locator('text=บันทึกการตั้งค่าการจองสำเร็จ')).toBeVisible();
    });

    test('should toggle deposit requirement', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/booking`);
      await page.waitForSelector('input[name="advanceBookingDays"]');

      // Find deposit checkbox
      const depositCheckbox = page.locator('input[name="requireDeposit"]');

      // Get current state
      const isCheckedBefore = await depositCheckbox.isChecked();

      // Toggle checkbox
      await depositCheckbox.click();

      // Verify state changed
      const isCheckedAfter = await depositCheckbox.isChecked();
      expect(isCheckedAfter).toBe(!isCheckedBefore);

      // If enabled, verify deposit fields appear
      if (isCheckedAfter) {
        await expect(page.locator('input[name="depositAmount"]')).toBeVisible();
        await expect(page.locator('input[name="depositPercentage"]')).toBeVisible();
      }
    });
  });

  test.describe('Payment Settings', () => {
    test('should navigate to payment settings page', async ({ page }) => {
      await page.click('button:has-text("ตั้งค่า")');
      await page.click('a:has-text("วิธีการชำระเงิน")');

      await expect(page).toHaveURL(`${BASE_URL}/admin/settings/payment`);
      await expect(page.locator('h1:has-text("วิธีการชำระเงิน")')).toBeVisible();
    });

    test('should toggle payment methods', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/payment`);
      await page.waitForSelector('input[name="acceptCash"]');

      // Toggle cash payment
      const cashCheckbox = page.locator('input[name="acceptCash"]');
      await cashCheckbox.click();

      // Save changes
      await page.click('button[type="submit"]');

      // Verify success
      await expect(page.locator('text=บันทึกการตั้งค่าการชำระเงินสำเร็จ')).toBeVisible();
    });

    test('should show/hide PromptPay fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/payment`);
      await page.waitForSelector('input[name="acceptPromptPay"]');

      const promptPayCheckbox = page.locator('input[name="acceptPromptPay"]');

      // Uncheck PromptPay if checked
      if (await promptPayCheckbox.isChecked()) {
        await promptPayCheckbox.click();
        await expect(page.locator('input[name="promptPayNumber"]')).not.toBeVisible();
      }

      // Check PromptPay
      await promptPayCheckbox.click();
      await expect(page.locator('input[name="promptPayNumber"]')).toBeVisible();
    });

    test('should show/hide bank account fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/payment`);
      await page.waitForSelector('input[name="acceptTransfer"]');

      const transferCheckbox = page.locator('input[name="acceptTransfer"]');

      // Uncheck transfer if checked
      if (await transferCheckbox.isChecked()) {
        await transferCheckbox.click();
        // Wait for fields to disappear after React re-render
        await page.waitForSelector('input[name="bankName"]', { state: 'hidden', timeout: 3000 }).catch(() => {});
        await expect(page.locator('input[name="bankName"]')).not.toBeVisible();
      }

      // Check transfer
      await transferCheckbox.click();
      // Wait for fields to appear after React re-render
      await page.waitForSelector('input[name="bankName"]', { state: 'visible', timeout: 3000 });
      await expect(page.locator('input[name="bankName"]')).toBeVisible();
      await expect(page.locator('input[name="accountNumber"]')).toBeVisible();
      await expect(page.locator('input[name="accountName"]')).toBeVisible();
    });
  });

  test.describe('General Settings', () => {
    test('should navigate to general settings page', async ({ page }) => {
      await page.click('button:has-text("ตั้งค่า")');
      await page.click('a:has-text("การตั้งค่าทั่วไป")');

      await expect(page).toHaveURL(`${BASE_URL}/admin/settings/general`);
      await expect(page.locator('h1:has-text("การตั้งค่าทั่วไป")')).toBeVisible();
    });

    test('should update general settings', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/general`);
      await page.waitForSelector('select[name="currency"]');

      // Update settings
      await page.selectOption('select[name="currency"]', 'THB');
      await page.selectOption('select[name="timezone"]', 'Asia/Bangkok');
      await page.selectOption('select[name="language"]', 'th');

      // Save changes
      await page.click('button[type="submit"]');

      // Verify success
      await expect(page.locator('text=บันทึกการตั้งค่าทั่วไปสำเร็จ')).toBeVisible();
    });

    test('should display warning message', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/general`);
      await page.waitForSelector('select[name="currency"]');

      // Verify warning box is visible
      await expect(page.locator('text=คำเตือน')).toBeVisible();
      await expect(page.locator('text=การเปลี่ยนแปลงการตั้งค่าเหล่านี้อาจส่งผลต่อการแสดงผลของระบบทั้งหมด')).toBeVisible();
    });
  });

  test.describe('Navigation and UI', () => {
    test('should expand/collapse settings menu', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Settings menu should be collapsed initially (or expanded if active)
      const settingsButton = page.locator('button:has-text("ตั้งค่า")');
      await expect(settingsButton).toBeVisible();

      // Click to expand
      await settingsButton.click();

      // Verify submenu items are visible
      await expect(page.locator('a:has-text("ข้อมูลสนาม")')).toBeVisible();
      await expect(page.locator('a:has-text("เวลาทำการ")')).toBeVisible();
      await expect(page.locator('a:has-text("การตั้งค่าการจอง")')).toBeVisible();
      await expect(page.locator('a:has-text("วิธีการชำระเงิน")')).toBeVisible();
      await expect(page.locator('a:has-text("การตั้งค่าทั่วไป")')).toBeVisible();
    });

    test('should navigate back to dashboard from settings pages', async ({ page }) => {
      // Go to any settings page
      await page.goto(`${BASE_URL}/admin/settings/venue`);
      await page.waitForSelector('h1:has-text("ข้อมูลสนาม")');

      // Click cancel button to navigate back to dashboard
      await page.getByRole('button', { name: 'ยกเลิก' }).click();

      // Should navigate to dashboard
      await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
    });

    test('should cancel settings changes', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/venue`);
      await page.waitForSelector('input[name="name"]');

      // Get original value
      const originalValue = await page.inputValue('input[name="name"]');

      // Change value
      await page.fill('input[name="name"]', 'Changed Name');

      // Click cancel button
      await page.click('button:has-text("ยกเลิก")');

      // Should navigate back to dashboard
      await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);

      // Navigate back to verify data wasn't saved
      await page.goto(`${BASE_URL}/admin/settings/venue`);
      await page.waitForSelector('input[name="name"]');
      await expect(page.locator('input[name="name"]')).toHaveValue(originalValue);
    });
  });

  test.describe('Loading States', () => {
    test('should show loading spinner while fetching data', async ({ page }) => {
      // Slow down network to see loading state
      await page.route('**/api/settings', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.goto(`${BASE_URL}/admin/settings/venue`);

      // Should see loading spinner
      await expect(page.locator('.animate-spin')).toBeVisible();

      // Wait for data to load
      await page.waitForSelector('input[name="name"]', { timeout: 5000 });
    });

    test('should show saving state when submitting', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/settings/venue`);
      await page.waitForSelector('input[name="name"]');

      // Slow down the API call
      await page.route('**/api/settings/venue', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      // Submit form
      await page.click('button[type="submit"]');

      // Should show saving state
      await expect(page.locator('text=กำลังบันทึก')).toBeVisible();
    });
  });
});
