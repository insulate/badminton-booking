import { test as setup } from '@playwright/test';

const ADMIN_AUTH_FILE = 'e2e/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/admin/login');

  await page.fill('#username', process.env.TEST_ADMIN_USER ?? 'admin');
  await page.fill('#password', process.env.TEST_ADMIN_PASS ?? 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/admin/dashboard');
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
