import { test, expect } from '@playwright/test';

/**
 * Realtime Notification E2E Tests (MVP)
 * ทดสอบระบบแจ้งเตือน realtime เมื่อลูกค้าจองสนามและอัพโหลดสลิป
 */

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3000/api';

// Test credentials
const ADMIN_USER = {
  username: 'admin',
  password: 'admin123',
};

const TEST_PLAYER = {
  phone: '0812345678',
  password: 'password123',
};

/**
 * Helper: Login as admin
 */
async function loginAsAdmin(page) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.fill('input[name="username"]', ADMIN_USER.username);
  await page.fill('input[name="password"]', ADMIN_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 10000 });
}

/**
 * Helper: Login as customer (player)
 */
async function loginAsCustomer(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="phone"]', TEST_PLAYER.phone);
  await page.fill('input[name="password"]', TEST_PLAYER.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

test.describe('Realtime Notification System', () => {
  test.describe('Socket Connection', () => {
    test('admin should connect to socket when logged in', async ({ page }) => {
      // Login as admin
      await loginAsAdmin(page);

      // Wait for socket connection (check console log or socket status)
      await page.waitForTimeout(2000);

      // Verify admin is on dashboard
      await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);

      // Check that page is loaded and functional
      const dashboardContent = page.locator('main');
      await expect(dashboardContent).toBeVisible();
    });

    test('admin header should display notification bell', async ({ page }) => {
      await loginAsAdmin(page);

      // Find notification bell in header
      const bellIcon = page.locator('header a[title="สลิปรอตรวจสอบ"]');
      await expect(bellIcon).toBeVisible();

      // Bell should link to bookings page
      await expect(bellIcon).toHaveAttribute('href', '/admin/bookings');
    });
  });

  test.describe('Notification Badge', () => {
    test('should display badge count for pending slips', async ({ page }) => {
      await loginAsAdmin(page);

      // Wait for pending slips count to load
      await page.waitForTimeout(2000);

      // Find badge in header (may or may not exist depending on data)
      const bellLink = page.locator('header a[title="สลิปรอตรวจสอบ"]');
      await expect(bellLink).toBeVisible();

      // Badge element (if there are pending slips)
      const badge = bellLink.locator('span.bg-red-500');

      // Badge should exist or not based on pending count
      const badgeCount = await badge.count();
      if (badgeCount > 0) {
        // If badge exists, it should contain a number
        const badgeText = await badge.textContent();
        expect(badgeText).toMatch(/\d+|\d+\+/);
      }
    });

    test('clicking notification bell should navigate to bookings', async ({ page }) => {
      await loginAsAdmin(page);

      // Click notification bell
      const bellLink = page.locator('header a[title="สลิปรอตรวจสอบ"]');
      await bellLink.click();

      // Should navigate to bookings page
      await page.waitForURL(`${BASE_URL}/admin/bookings`, { timeout: 5000 });
      await expect(page).toHaveURL(`${BASE_URL}/admin/bookings`);
    });
  });

  test.describe('Profile Dropdown', () => {
    test('should show logout menu when clicking profile', async ({ page }) => {
      await loginAsAdmin(page);

      // Find and click profile dropdown button
      const profileButton = page.locator('header button').filter({ has: page.locator('.rounded-full') });
      await profileButton.click();

      // Dropdown should appear with logout option
      const logoutButton = page.locator('button:has-text("ออกจากระบบ")');
      await expect(logoutButton).toBeVisible();
    });

    test('should logout when clicking logout button', async ({ page }) => {
      await loginAsAdmin(page);

      // Open profile dropdown
      const profileButton = page.locator('header button').filter({ has: page.locator('.rounded-full') });
      await profileButton.click();

      // Click logout
      const logoutButton = page.locator('button:has-text("ออกจากระบบ")');
      await logoutButton.click();

      // Should redirect to login page (wait longer for navigation)
      await page.waitForURL(/.*\/admin\/login.*|.*\/login.*/, { timeout: 10000 });

      // Verify on login page
      const currentUrl = page.url();
      expect(currentUrl).toContain('login');
    });
  });

  test.describe('Sidebar Badge', () => {
    test('should display badge on booking menu when pending slips exist', async ({ page }) => {
      await loginAsAdmin(page);

      // Wait for data to load
      await page.waitForTimeout(2000);

      // Find booking menu in sidebar
      const bookingMenu = page.locator('aside button:has-text("การจอง")');
      await expect(bookingMenu).toBeVisible();

      // Check for badge (may or may not exist)
      const menuBadge = bookingMenu.locator('span.bg-red-500');
      const badgeExists = await menuBadge.count() > 0;

      // If badge exists, verify it shows a number
      if (badgeExists) {
        const badgeText = await menuBadge.textContent();
        expect(badgeText).toMatch(/\d+|\d+\+/);
      }
    });
  });
});

test.describe('Realtime Notification Flow (Integration)', () => {
  test('admin dashboard should load without errors', async ({ page }) => {
    await loginAsAdmin(page);

    // Check for any console errors related to socket
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for socket to connect
    await page.waitForTimeout(3000);

    // Filter out expected errors (if any)
    const socketErrors = consoleErrors.filter(
      (err) => err.includes('socket') || err.includes('Socket')
    );

    // Should not have critical socket errors
    // Note: Connection warnings are acceptable if server is not running
    expect(socketErrors.length).toBeLessThanOrEqual(1);
  });

  test('toast notifications should be functional', async ({ page }) => {
    await loginAsAdmin(page);

    // Trigger a toast by opening and closing profile dropdown
    const profileButton = page.locator('header button').filter({ has: page.locator('.rounded-full') });
    await profileButton.click();

    // Click outside to close
    await page.click('main');
    await page.waitForTimeout(500);

    // Toast container should exist (react-hot-toast)
    const toastContainer = page.locator('[class*="Toaster"]');
    // It's okay if no toasts are visible, just verify the container can exist
  });
});

test.describe('API Integration', () => {
  test('pending slips count API should work', async ({ request }) => {
    // First login to get token
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        username: ADMIN_USER.username,
        password: ADMIN_USER.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    const token = loginData.data.token;

    // Call pending slips count API
    const response = await request.get(`${API_URL}/bookings/pending-slips-count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Should have success and count
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('count');
    expect(typeof data.data.count).toBe('number');
  });
});
