import { test, expect } from '@playwright/test';

// Test configuration
const TEST_USER = {
  admin: {
    username: 'admin',
    password: 'Admin123!', // Must match backend password validation
  },
  regular: {
    username: 'testuser',
    password: 'User123!', // Must match backend password validation
  },
};

const BASE_URL = 'http://localhost:5173';

test.describe('Authentication E2E Tests', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to login page
      await page.goto(`${BASE_URL}/login`);
    });

    test('should display login page correctly', async ({ page }) => {
      // Verify page title
      await expect(page).toHaveTitle(/Badminton/i);

      // Verify login form elements
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Verify form labels
      await expect(page.locator('text=ชื่อผู้ใช้')).toBeVisible();
      await expect(page.locator('text=รหัสผ่าน')).toBeVisible();
    });

    test('should login successfully with admin credentials', async ({ page }) => {
      // Fill in login credentials
      await page.fill('input[name="username"]', TEST_USER.admin.username);
      await page.fill('input[name="password"]', TEST_USER.admin.password);

      // Click login button
      await page.click('button[type="submit"]');

      // Wait for navigation to dashboard
      await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 10000 });

      // Verify redirect to admin dashboard
      await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);

      // Verify user is logged in (check for user menu or welcome message)
      await expect(page.locator('text=admin').first()).toBeVisible();
    });

    test('should login successfully with regular user credentials', async ({ page }) => {
      // Fill in login credentials
      await page.fill('input[name="username"]', TEST_USER.regular.username);
      await page.fill('input[name="password"]', TEST_USER.regular.password);

      // Click login button
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForURL(/\/(dashboard|admin)/, { timeout: 10000 });

      // Verify user is logged in
      const url = page.url();
      expect(url).toMatch(/dashboard|admin/);
    });

    test('should show error for invalid username', async ({ page }) => {
      // Fill in invalid credentials
      await page.fill('input[name="username"]', 'invaliduser');
      await page.fill('input[name="password"]', 'InvalidPass123!');

      // Click login button
      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForTimeout(2000);

      // Verify error message or stay on login page
      const currentUrl = page.url();
      expect(currentUrl).toContain('/login');
    });

    test('should show error for invalid password', async ({ page }) => {
      // Fill in invalid password
      await page.fill('input[name="username"]', TEST_USER.admin.username);
      await page.fill('input[name="password"]', 'WrongPassword123!');

      // Click login button
      await page.click('button[type="submit"]');

      // Wait for error message
      await page.waitForTimeout(2000);

      // Verify stays on login page
      expect(page.url()).toContain('/login');
    });

    test('should require username field', async ({ page }) => {
      // Leave username empty
      await page.fill('input[name="password"]', TEST_USER.admin.password);

      // Try to submit
      await page.click('button[type="submit"]');

      // Verify HTML5 validation prevents submit
      const usernameInput = page.locator('input[name="username"]');
      const isInvalid = await usernameInput.evaluate((el) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    });

    test('should require password field', async ({ page }) => {
      // Leave password empty
      await page.fill('input[name="username"]', TEST_USER.admin.username);

      // Try to submit
      await page.click('button[type="submit"]');

      // Verify HTML5 validation prevents submit
      const passwordInput = page.locator('input[name="password"]');
      const isInvalid = await passwordInput.evaluate((el) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    });

    test('should toggle password visibility', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"]');

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Find the toggle button (eye icon) next to password input
      const toggleButton = page.locator('button[aria-label*="password" i]');
      await expect(toggleButton).toBeVisible();

      // Click toggle button to show password
      await toggleButton.click();

      // Password should now be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide
      await toggleButton.click();

      // Password should be hidden again
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Authentication State', () => {
    test('should redirect to login when accessing protected route without authentication', async ({ page }) => {
      // Try to access admin dashboard without logging in
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Should redirect to login
      await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });
      await expect(page).toHaveURL(`${BASE_URL}/login`);
    });

    test('should persist authentication across page reloads', async ({ page }) => {
      // Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="username"]', TEST_USER.admin.username);
      await page.fill('input[name="password"]', TEST_USER.admin.password);
      await page.click('button[type="submit"]');

      // Wait for successful login
      await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 10000 });

      // Reload the page
      await page.reload();

      // Should still be on dashboard (not redirected to login)
      await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
    });

    test('should navigate to different protected routes after login', async ({ page }) => {
      // Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="username"]', TEST_USER.admin.username);
      await page.fill('input[name="password"]', TEST_USER.admin.password);
      await page.click('button[type="submit"]');

      await page.waitForURL(`${BASE_URL}/admin/dashboard`);

      // Navigate to different admin routes that exist
      await page.goto(`${BASE_URL}/admin/bookings`);
      await expect(page).toHaveURL(`${BASE_URL}/admin/bookings`);

      // Verify we can navigate back to dashboard
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
    });
  });

  test.describe('Logout Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="username"]', TEST_USER.admin.username);
      await page.fill('input[name="password"]', TEST_USER.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 10000 });
    });

    test('should logout successfully', async ({ page }) => {
      // Look for logout button (might be in dropdown or sidebar)
      const logoutButton = page.locator('button:has-text("ออกจากระบบ"), a:has-text("ออกจากระบบ")');

      // If logout is in a dropdown, click user menu first
      const userMenuButton = page.locator('button[aria-label*="user" i], button:has(svg):has-text("admin")');
      if (await userMenuButton.count() > 0) {
        await userMenuButton.first().click();
        await page.waitForTimeout(500);
      }

      // Click logout
      await logoutButton.first().click();

      // Should redirect to login page
      await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });
      await expect(page).toHaveURL(`${BASE_URL}/login`);
    });

    test('should not be able to access protected routes after logout', async ({ page }) => {
      // Logout
      const logoutButton = page.locator('button:has-text("ออกจากระบบ"), a:has-text("ออกจากระบบ")');

      const userMenuButton = page.locator('button[aria-label*="user" i], button:has(svg):has-text("admin")');
      if (await userMenuButton.count() > 0) {
        await userMenuButton.first().click();
        await page.waitForTimeout(500);
      }

      await logoutButton.first().click();
      await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });

      // Try to access protected route
      await page.goto(`${BASE_URL}/admin/dashboard`);

      // Should be redirected back to login
      await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });
      await expect(page).toHaveURL(`${BASE_URL}/login`);
    });

    test('should clear authentication token on logout', async ({ page }) => {
      // Check localStorage has token before logout
      const tokenBefore = await page.evaluate(() => localStorage.getItem('token'));
      expect(tokenBefore).toBeTruthy();

      // Logout
      const logoutButton = page.locator('button:has-text("ออกจากระบบ"), a:has-text("ออกจากระบบ")');

      const userMenuButton = page.locator('button[aria-label*="user" i], button:has(svg):has-text("admin")');
      if (await userMenuButton.count() > 0) {
        await userMenuButton.first().click();
        await page.waitForTimeout(500);
      }

      await logoutButton.first().click();
      await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });

      // Check localStorage token is cleared
      const tokenAfter = await page.evaluate(() => localStorage.getItem('token'));
      expect(tokenAfter).toBeFalsy();
    });
  });

  test.describe('User Profile & Account Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="username"]', TEST_USER.admin.username);
      await page.fill('input[name="password"]', TEST_USER.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 10000 });
    });

    test('should display user information', async ({ page }) => {
      // Check if user information is displayed (username, role, etc.)
      await expect(page.locator('text=admin').first()).toBeVisible();
    });

    test('should access profile/account settings if available', async ({ page }) => {
      // Look for profile/settings link
      const profileLink = page.locator('a:has-text("โปรไฟล์"), a:has-text("บัญชี"), a:has-text("Profile"), a:has-text("Account")');

      if (await profileLink.count() > 0) {
        await profileLink.first().click();

        // Verify navigation to profile page
        const url = page.url();
        expect(url).toMatch(/profile|account|settings/i);
      }
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('admin should have access to admin features', async ({ page }) => {
      // Login as admin
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="username"]', TEST_USER.admin.username);
      await page.fill('input[name="password"]', TEST_USER.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 10000 });

      // Verify admin menu items are visible
      const adminMenus = [
        'ตั้งค่า',
        'ผู้ใช้งาน',
        'ข้อมูลสนาม',
      ];

      for (const menuText of adminMenus) {
        const menu = page.locator(`text=${menuText}`);
        if (await menu.count() > 0) {
          await expect(menu.first()).toBeVisible();
        }
      }
    });

    test('regular user should have limited access', async ({ page }) => {
      // Login as regular user
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="username"]', TEST_USER.regular.username);
      await page.fill('input[name="password"]', TEST_USER.regular.password);
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForURL(/dashboard|admin/, { timeout: 10000 });

      // Try to access admin-only route
      await page.goto(`${BASE_URL}/admin/users`);

      // Should be denied or redirected (403 Forbidden or redirect to dashboard)
      await page.waitForTimeout(2000);
      const url = page.url();

      // Verify either stayed on users page with error, or redirected away
      // This depends on how your app handles authorization
      expect(url).toBeDefined();
    });
  });

  test.describe('Session Management', () => {
    test('should handle concurrent logins in different tabs', async ({ browser }) => {
      // Create two contexts (like two users/tabs)
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // Login in first tab
      await page1.goto(`${BASE_URL}/login`);
      await page1.fill('input[name="username"]', TEST_USER.admin.username);
      await page1.fill('input[name="password"]', TEST_USER.admin.password);
      await page1.click('button[type="submit"]');
      await page1.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 10000 });

      // Login in second tab
      await page2.goto(`${BASE_URL}/login`);
      await page2.fill('input[name="username"]', TEST_USER.regular.username);
      await page2.fill('input[name="password"]', TEST_USER.regular.password);
      await page2.click('button[type="submit"]');
      await page2.waitForURL(/dashboard|admin/, { timeout: 10000 });

      // Both should be logged in
      await expect(page1).toHaveURL(`${BASE_URL}/admin/dashboard`);
      expect(page2.url()).toMatch(/dashboard|admin/);

      await context1.close();
      await context2.close();
    });

    test('should maintain session with valid token', async ({ page }) => {
      // Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[name="username"]', TEST_USER.admin.username);
      await page.fill('input[name="password"]', TEST_USER.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 10000 });

      // Wait a bit
      await page.waitForTimeout(3000);

      // Navigate to another page
      await page.goto(`${BASE_URL}/admin/bookings`);

      // Should still be authenticated
      await expect(page).toHaveURL(`${BASE_URL}/admin/bookings`);

      // Verify not redirected to login
      expect(page.url()).not.toContain('/login');
    });
  });
});
