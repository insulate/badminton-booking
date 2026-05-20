import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

const ADMIN_USER = process.env.TEST_ADMIN_USER ?? 'admin';
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? 'admin123';

test.describe('Admin Authentication', () => {
  test('login สำเร็จ redirect ไป dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_USER, ADMIN_PASS);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('password ผิด แสดง error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_USER, 'wrongpassword');
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).toContainText('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  });

  test('username ผิด แสดง error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('nonexistentuser', ADMIN_PASS);
    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).toContainText('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  });

  test('เข้า protected route โดยไม่ login redirect ไป login', async ({ page }) => {
    await page.goto('/admin/bookings');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('logout แล้ว redirect ไป login และ localStorage ถูกล้าง', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(ADMIN_USER, ADMIN_PASS);
    await page.waitForURL(/\/admin\/dashboard/);

    // เปิด profile dropdown แล้วกด logout
    await page.locator('button').filter({ has: page.locator('.rounded-full') }).click();
    await page.getByRole('button', { name: 'ออกจากระบบ' }).click();

    await expect(page).toHaveURL(/\/admin\/login/);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});
