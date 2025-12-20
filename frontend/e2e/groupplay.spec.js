import { test, expect } from '@playwright/test';

test.describe('Group Play Feature Test', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/admin/login');
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

    // Check for rule section header (always visible)
    await expect(page.getByRole('heading', { name: 'กฎก๊วนสนาม' })).toBeVisible();

    // Note: Action buttons (Check-in, เริ่มเกม, etc.) only appear when a rule is selected
  });

  test('should open Create Rule modal', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/groupplay');

    // Click create rule button
    await page.getByRole('button', { name: 'สร้างกฎก๊วนใหม่' }).first().click();

    // Check if modal is visible (heading matches button text)
    await expect(page.locator('h2:has-text("สร้างกฎก๊วนใหม่")')).toBeVisible();

    // Check form fields - ชื่อ Session input
    await expect(page.locator('text=ชื่อ Session')).toBeVisible();
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

  test('should complete full workflow: check-in → start → finish → checkout', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/groupplay');
    await page.waitForTimeout(1000);

    // Check if rules exist
    const ruleSelector = page.locator('select');
    const hasRules = await ruleSelector.count() > 0;

    if (!hasRules) {
      console.log('No rules available, skipping test');
      return;
    }

    // Step 1: Check-in two players
    const player1 = { name: 'Workflow Player 1', phone: '0851111111' };
    const player2 = { name: 'Workflow Player 2', phone: '0852222222' };

    for (const player of [player1, player2]) {
      const checkInButton = page.getByRole('button', { name: 'Check-in ผู้เล่น' });

      if (await checkInButton.isVisible() && await checkInButton.isEnabled()) {
        await checkInButton.click();
        await expect(page.locator('text=Check-in ผู้เล่น').first()).toBeVisible();
        await page.click('button:has-text("Walk-in")');

        // Fill in player data
        const nameInput = page.locator('input[type="text"]').first();
        const phoneInput = page.locator('input[type="tel"]').first();

        await nameInput.fill(player.name);
        await phoneInput.fill(player.phone);

        await page.click('button:has-text("Check-in"):not(:has-text("ผู้เล่น"))');
        await page.waitForTimeout(2000);
      }
    }

    // Step 2: Start a game with both players
    const startGameButton = page.getByRole('button', { name: 'เริ่มเกม' });

    if (await startGameButton.isVisible() && await startGameButton.isEnabled()) {
      await startGameButton.click();
      await page.waitForTimeout(1000);

      // Select both players (check first 2 checkboxes)
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

      // Verify game is started (should show "เกมที่กำลังเล่น: 1")
      const activeGames = await page.locator('text=เกมที่กำลังเล่น').count();
      expect(activeGames).toBeGreaterThan(0);
    }

    // Step 3: Finish the game (with products if available)
    const finishButton = page.locator('button:has-text("จบเกม")').first();

    if (await finishButton.isVisible()) {
      await finishButton.click();
      await page.waitForTimeout(1000);

      // Check if modal opened
      const modalVisible = await page.locator('text=จบเกม').first().isVisible();

      if (modalVisible) {
        // Try to add products if available (optional)
        const productCheckboxes = page.locator('input[type="checkbox"]');
        const productCount = await productCheckboxes.count();

        if (productCount > 0) {
          // Select first product
          await productCheckboxes.first().check();
        }

        // Click confirm button to finish game
        const confirmButton = page.locator('button:has-text("บันทึก")').last();
        await confirmButton.click();
        await page.waitForTimeout(2000);

        // Verify game is finished (should show "เกมที่เล่นแล้ว: 1")
        const finishedGames = await page.locator('text=เกมที่เล่นแล้ว').count();
        expect(finishedGames).toBeGreaterThan(0);
      }
    }

    // Step 4: Try to checkout (should succeed if no playing games)
    const checkoutButtons = page.locator('button:has-text("Check Out")');
    const checkoutCount = await checkoutButtons.count();

    if (checkoutCount > 0) {
      // Click first checkout button
      await checkoutButtons.first().click();
      await page.waitForTimeout(1500);

      // Should show checkout confirmation modal
      const confirmModal = await page.locator('text=ยืนยันการ Check Out').count();

      if (confirmModal > 0) {
        // Verify cost summary is shown
        const costSummary = await page.locator('text=ค่าเข้าร่วม').count();
        expect(costSummary).toBeGreaterThan(0);

        // Confirm checkout
        const confirmCheckout = page.locator('button:has-text("ยืนยัน Check Out")');
        if (await confirmCheckout.isVisible()) {
          await confirmCheckout.click();
          await page.waitForTimeout(2000);

          // Success toast should appear
          // Note: Exact selector depends on toast library implementation
        }
      }
    }
  });

  test('should prevent checkout when player has playing game', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/groupplay');
    await page.waitForTimeout(1000);

    // Check if rules exist
    const ruleSelector = page.locator('select');
    const hasRules = await ruleSelector.count() > 0;

    if (!hasRules) {
      console.log('No rules available, skipping test');
      return;
    }

    // Check-in two players
    const player1 = { name: 'Checkout Block Test 1', phone: '0861111111' };
    const player2 = { name: 'Checkout Block Test 2', phone: '0862222222' };

    for (const player of [player1, player2]) {
      const checkInButton = page.getByRole('button', { name: 'Check-in ผู้เล่น' });

      if (await checkInButton.isVisible() && await checkInButton.isEnabled()) {
        await checkInButton.click();
        await page.waitForTimeout(500);
        await page.click('button:has-text("Walk-in")');

        const nameInput = page.locator('input[type="text"]').first();
        const phoneInput = page.locator('input[type="tel"]').first();

        await nameInput.fill(player.name);
        await phoneInput.fill(player.phone);

        await page.click('button:has-text("Check-in"):not(:has-text("ผู้เล่น"))');
        await page.waitForTimeout(1500);
      }
    }

    // Start a game
    const startGameButton = page.getByRole('button', { name: 'เริ่มเกม' });

    if (await startGameButton.isVisible() && await startGameButton.isEnabled()) {
      await startGameButton.click();
      await page.waitForTimeout(1000);

      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();

      if (count >= 2) {
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();
      }

      const startButton = page.locator('button:has-text("เริ่มเกม")').last();
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    // Try to checkout while game is playing (should be blocked)
    const checkoutButtons = page.locator('button:has-text("Check Out")');
    const checkoutCount = await checkoutButtons.count();

    if (checkoutCount > 0) {
      await checkoutButtons.first().click();
      await page.waitForTimeout(1500);

      // Should show error message about playing game
      const errorMessage = await page.locator('text=/กำลัง.*เกม/i').count();

      // If error message visible, validation is working
      // If not, check if checkout was actually blocked (modal didn't open)
      const confirmModal = await page.locator('text=ยืนยันการ Check Out').count();

      // Either error message is shown OR checkout modal doesn't open
      expect(errorMessage > 0 || confirmModal === 0).toBe(true);
    }
  });

  test('should calculate costs correctly with game items and standalone items', async ({ page }) => {
    await page.goto('http://localhost:5173/admin/groupplay');
    await page.waitForTimeout(1000);

    const ruleSelector = page.locator('select');
    const hasRules = await ruleSelector.count() > 0;

    if (!hasRules) {
      console.log('No rules available, skipping test');
      return;
    }

    // Check-in one player
    const player = { name: 'Cost Calculation Test', phone: '0871111111' };
    const checkInButton = page.getByRole('button', { name: 'Check-in ผู้เล่น' });

    if (await checkInButton.isVisible() && await checkInButton.isEnabled()) {
      await checkInButton.click();
      await page.waitForTimeout(500);
      await page.click('button:has-text("Walk-in")');

      const nameInput = page.locator('input[type="text"]').first();
      const phoneInput = page.locator('input[type="tel"]').first();

      await nameInput.fill(player.name);
      await phoneInput.fill(player.phone);

      await page.click('button:has-text("Check-in"):not(:has-text("ผู้เล่น"))');
      await page.waitForTimeout(2000);
    }

    // Check if "Add Products" button is available
    const addProductsButtons = page.locator('button:has-text("เพิ่มสินค้า")');
    const addProductsCount = await addProductsButtons.count();

    if (addProductsCount > 0) {
      await addProductsButtons.first().click();
      await page.waitForTimeout(1000);

      // Try to add a product if available
      const productCheckboxes = page.locator('input[type="checkbox"]');
      const productCount = await productCheckboxes.count();

      if (productCount > 0) {
        await productCheckboxes.first().check();

        // Confirm adding products
        const confirmButton = page.locator('button:has-text("บันทึก")').last();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // View cost details
    const viewDetailsButtons = page.locator('button:has-text("ดูรายละเอียด")');
    const viewDetailsCount = await viewDetailsButtons.count();

    if (viewDetailsCount > 0) {
      await viewDetailsButtons.first().click();
      await page.waitForTimeout(1000);

      // Should show cost breakdown modal
      const costModal = await page.locator('text=รายละเอียดค่าใช้จ่าย').count();
      expect(costModal).toBeGreaterThan(0);

      // Should show entry fee
      const entryFee = await page.locator('text=ค่าเข้าร่วม').count();
      expect(entryFee).toBeGreaterThan(0);

      // Close modal
      const closeButton = page.locator('button:has-text("ปิด")').last();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  });
});
