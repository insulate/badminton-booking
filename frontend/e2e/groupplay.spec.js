import { test, expect } from '@playwright/test';

test.describe('Group Play Feature Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard');
  });

  test('should navigate to Group Play page', async ({ page }) => {
    // Click on Group Play menu item
    await page.click('text=ระบบตีก๊วน');

    // Wait for navigation
    await page.waitForURL('**/admin/groupplay');

    // Check if page title exists
    await expect(page.locator('text=ระบบตีก๊วน (Group Play)')).toBeVisible();
  });

  test('should display main UI elements', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/groupplay');

    // Check for page title
    await expect(page.locator('text=ระบบตีก๊วน (Group Play)')).toBeVisible();

    // Check for main buttons
    await expect(page.getByRole('button', { name: 'สร้างกฎก๊วนใหม่' }).first()).toBeVisible();
    await expect(page.locator('text=รีเฟรช')).toBeVisible();

    // Check for rule selector section
    await expect(page.locator('text=เลือกกฎก๊วนสนาม')).toBeVisible();

    // Note: Action buttons (Check-in, เริ่มเกม, etc.) only appear when a rule is selected
  });

  test('should open Create Rule modal', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/groupplay');

    // Click create rule button
    await page.getByRole('button', { name: 'สร้างกฎก๊วนใหม่' }).first().click();

    // Check if modal is visible
    await expect(page.locator('text=สร้าง Session ใหม่').first()).toBeVisible();

    // Check form fields - ชื่อ Session input
    await expect(page.locator('input[type="text"]').first()).toBeVisible();

    // Check for court checkboxes section
    await expect(page.locator('text=สนาม * (เลือกได้หลายสนาม)')).toBeVisible();

    // Check for day of week checkboxes section
    await expect(page.locator('text=วันในสัปดาห์ * (เลือกได้หลายวัน)')).toBeVisible();

    // Close modal
    await page.click('button:has-text("ยกเลิก")');
  });
});
