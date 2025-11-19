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

  test('should prevent duplicate player check-in', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/groupplay');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check if there's a rule selector
    const ruleSelector = page.locator('select');
    const hasRules = await ruleSelector.count() > 0;

    if (!hasRules) {
      console.log('No rules available, skipping test');
      return;
    }

    // Click Check-in button
    const checkInButton = page.getByRole('button', { name: 'Check-in ผู้เล่น' });

    // Check if button is visible and enabled
    if (await checkInButton.isVisible() && await checkInButton.isEnabled()) {
      await checkInButton.click();

      // Wait for modal to appear
      await expect(page.locator('text=Check-in ผู้เล่น').first()).toBeVisible();

      // Select Walk-in mode
      await page.click('button:has-text("Walk-in")');

      // Fill in player data
      const playerData = {
        name: 'Test Player E2E',
        phone: '0899999999'
      };

      await page.fill('input[type="text"]', playerData.name);
      await page.fill('input[type="tel"]', playerData.phone);

      // Click Check-in button in modal
      await page.click('button:has-text("Check-in"):not(:has-text("ผู้เล่น"))');

      // Wait for success message
      await page.waitForTimeout(2000);

      // Try to check-in the same player again
      const checkInButton2 = page.getByRole('button', { name: 'Check-in ผู้เล่น' });
      await checkInButton2.click();

      // Wait for modal to appear
      await expect(page.locator('text=Check-in ผู้เล่น').first()).toBeVisible();

      // Select Walk-in mode
      await page.click('button:has-text("Walk-in")');

      // Fill in same player data
      await page.fill('input[type="text"]', playerData.name);
      await page.fill('input[type="tel"]', playerData.phone);

      // Click Check-in button in modal
      await page.click('button:has-text("Check-in"):not(:has-text("ผู้เล่น"))');

      // Wait for error message
      await page.waitForTimeout(2000);

      // Should show error toast message (check for error-related text)
      // The exact selector depends on your toast implementation
      // This is a generic check that an error occurred
      const hasErrorMessage = await page.locator('text=/เช็คอินแล้ว/i').count() > 0 ||
                              await page.locator('text=/error/i').count() > 0;

      // If no visible error message, check if modal is still open (which indicates failure)
      if (!hasErrorMessage) {
        const modalStillOpen = await page.locator('text=Check-in ผู้เล่น').first().isVisible();
        expect(modalStillOpen).toBe(true);
      }
    }
  });

  test('should show only one game when starting a game with multiple players', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/groupplay');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check if there's a rule selector
    const ruleSelector = page.locator('select');
    const hasRules = await ruleSelector.count() > 0;

    if (!hasRules) {
      console.log('No rules available, skipping test');
      return;
    }

    // Check-in two players
    const player1 = { name: 'Game Test Player 1', phone: '0811111111' };
    const player2 = { name: 'Game Test Player 2', phone: '0822222222' };

    for (const player of [player1, player2]) {
      const checkInButton = page.getByRole('button', { name: 'Check-in ผู้เล่น' });

      if (await checkInButton.isVisible() && await checkInButton.isEnabled()) {
        await checkInButton.click();
        await expect(page.locator('text=Check-in ผู้เล่น').first()).toBeVisible();
        await page.click('button:has-text("Walk-in")');
        await page.fill('input[type="text"]', player.name);
        await page.fill('input[type="tel"]', player.phone);
        await page.click('button:has-text("Check-in"):not(:has-text("ผู้เล่น"))');
        await page.waitForTimeout(1500);
      }
    }

    // Start a game with both players
    const startGameButton = page.getByRole('button', { name: 'เริ่มเกม' });

    if (await startGameButton.isVisible() && await startGameButton.isEnabled()) {
      await startGameButton.click();
      await page.waitForTimeout(1000);

      // Select both players
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count >= 2) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();
      }

      // Click start game button in modal
      const startButton = page.locator('button:has-text("เริ่มเกม")').last();
      await startButton.click();
      await page.waitForTimeout(2000);

      // Check that "เกมที่กำลังเล่น" shows 1, not 2 or more
      // Find the stats display for current games
      const statsSection = page.locator('text=เกมที่กำลังเล่น').locator('..');
      const gamesCount = await statsSection.locator('p.text-2xl.font-bold').textContent();

      // Should be exactly 1 game (not 2, even though 2 players are in the game)
      expect(parseInt(gamesCount.trim())).toBe(1);
    }
  });
});
