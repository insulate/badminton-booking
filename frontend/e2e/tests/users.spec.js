import { test, expect } from '@playwright/test';
import { UsersPage } from '../pages/UsersPage.js';
import { LoginPage } from '../pages/LoginPage.js';

// สร้าง user data ที่ unique ต่อการรัน เพื่อไม่ชนกันเมื่อรัน parallel
// ใช้ timestamp + random suffix เพื่อป้องกัน collision เมื่อ workers รันพร้อมกัน
const makeUser = () => {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    username: `testuser_${id}`,
    password: 'test123456',
    name: `Test User ${id}`,
  };
};

// รอให้ toast ทั้งหมดหายก่อนทำ action ถัดไป (toast บัง action buttons ด้านขวาบน)
async function waitForToastsToClear(page) {
  await page.waitForFunction(
    () => !document.querySelector('[data-rht-toaster]')?.firstElementChild,
    { timeout: 8000 }
  );
}

async function logoutAdmin(page) {
  await waitForToastsToClear(page);
  await page.locator('button').filter({ has: page.locator('.rounded-full') }).click();
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await page.waitForURL(/\/admin\/login/);
}

async function loginWith(page, username, password) {
  await page.goto('/admin/login');
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
}

test.describe('User Management', () => {
  test('เพิ่มผู้ใช้สำเร็จ', async ({ page }) => {
    const user = makeUser();
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    await usersPage.addUserButton.click();
    await usersPage.fillUserForm(user);
    await usersPage.submitForm('create');

    await expect(page.getByText('สร้างผู้ใช้สำเร็จ!')).toBeVisible();
    await expect(usersPage.modal).not.toBeVisible();
    await expect(usersPage.getUserRow(user.username)).toBeVisible();
  });

  test('แก้ไขผู้ใช้สำเร็จ และ password field ไม่ปรากฏ', async ({ page }) => {
    const user = makeUser();
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // สร้าง user ก่อน
    await usersPage.addUserButton.click();
    await usersPage.fillUserForm(user);
    await usersPage.submitForm('create');
    await page.getByText('สร้างผู้ใช้สำเร็จ!').waitFor();
    await waitForToastsToClear(page);

    // เปิด edit modal
    await usersPage.getUserRow(user.username).locator('[data-tooltip="แก้ไข"]').click();

    await expect(page.getByText('แก้ไขข้อมูลผู้ใช้')).toBeVisible();
    await expect(usersPage.modalPasswordInput).not.toBeAttached();

    const newName = `Updated ${Date.now()}`;
    await usersPage.modalNameInput.clear();
    await usersPage.modalNameInput.fill(newName);
    await usersPage.submitForm('edit');

    await expect(page.getByText('อัพเดทข้อมูลสำเร็จ!')).toBeVisible();
    await expect(usersPage.modal).not.toBeVisible();
    await expect(usersPage.getUserRow(user.username).getByText(newName)).toBeVisible();
  });

  test('ลบผู้ใช้ (soft delete) แสดงสถานะ "ถูกลบแล้ว"', async ({ page }) => {
    const user = makeUser();
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // สร้าง user
    await usersPage.addUserButton.click();
    await usersPage.fillUserForm(user);
    await usersPage.submitForm('create');
    await page.getByText('สร้างผู้ใช้สำเร็จ!').waitFor();

    // ลบ user
    await waitForToastsToClear(page);
    usersPage.acceptDialog();
    await usersPage.getUserRow(user.username).locator('[data-tooltip="ลบ"]').click();

    await expect(page.getByText('ลบผู้ใช้สำเร็จ')).toBeVisible();
    await waitForToastsToClear(page);

    // เปิด "แสดงผู้ใช้ที่ถูกลบ" เพื่อตรวจสอบสถานะ
    await usersPage.showDeletedCheckbox.check();
    const row = usersPage.getUserRow(user.username);
    await expect(row.getByText('ถูกลบแล้ว')).toBeVisible();
    await expect(row.locator('[data-tooltip="กู้คืนผู้ใช้"]')).toBeVisible();
    await expect(row.locator('[data-tooltip="แก้ไข"]')).not.toBeVisible();
  });

  test('กู้คืนผู้ใช้ที่ถูกลบ แสดงสถานะ "ใช้งานได้"', async ({ page }) => {
    const user = makeUser();
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // สร้างและลบ user
    await usersPage.addUserButton.click();
    await usersPage.fillUserForm(user);
    await usersPage.submitForm('create');
    await page.getByText('สร้างผู้ใช้สำเร็จ!').waitFor();
    await waitForToastsToClear(page);

    usersPage.acceptDialog();
    await usersPage.getUserRow(user.username).locator('[data-tooltip="ลบ"]').click();
    await page.getByText('ลบผู้ใช้สำเร็จ').waitFor();
    await waitForToastsToClear(page);

    // กู้คืน
    await usersPage.showDeletedCheckbox.check();
    usersPage.acceptDialog();
    await usersPage.getUserRow(user.username).locator('[data-tooltip="กู้คืนผู้ใช้"]').click();

    await expect(page.getByText('กู้คืนผู้ใช้สำเร็จ')).toBeVisible();
    await expect(usersPage.getUserRow(user.username).getByText('ใช้งานได้')).toBeVisible();
    await expect(usersPage.getUserRow(user.username).locator('[data-tooltip="แก้ไข"]')).toBeVisible();
  });

  test('admin ลบตัวเองไม่ได้ — เห็น "บัญชีของคุณ" แทนปุ่มลบ', async ({ page }) => {
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    const adminRow = usersPage.getUserRow('admin');
    await expect(adminRow.getByText('บัญชีของคุณ')).toBeVisible();
    await expect(adminRow.locator('[data-tooltip="ลบ"]')).not.toBeVisible();
  });

  // --- Login after action tests ---

  test('Login หลังสร้างผู้ใช้ → login สำเร็จ', async ({ page }) => {
    const user = makeUser();
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // สร้าง user
    await usersPage.addUserButton.click();
    await usersPage.fillUserForm(user);
    await usersPage.submitForm('create');
    await page.getByText('สร้างผู้ใช้สำเร็จ!').waitFor();

    // Logout และ login ด้วย user ใหม่
    await logoutAdmin(page);
    await loginWith(page, user.username, user.password);

    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('Login หลังลบผู้ใช้ → login ไม่ได้ แสดง error', async ({ page }) => {
    const user = makeUser();
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // สร้างและลบ user
    await usersPage.addUserButton.click();
    await usersPage.fillUserForm(user);
    await usersPage.submitForm('create');
    await page.getByText('สร้างผู้ใช้สำเร็จ!').waitFor();
    await waitForToastsToClear(page);

    usersPage.acceptDialog();
    await usersPage.getUserRow(user.username).locator('[data-tooltip="ลบ"]').click();
    await page.getByText('ลบผู้ใช้สำเร็จ').waitFor();

    // Logout และลอง login ด้วย user ที่ถูกลบ
    await logoutAdmin(page);
    await loginWith(page, user.username, user.password);

    const errorAlert = page.locator('.bg-red-50');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('บัญชีนี้ถูกระงับการใช้งาน');
  });

  test('Login หลังกู้คืนผู้ใช้ → login สำเร็จอีกครั้ง', async ({ page }) => {
    const user = makeUser();
    const usersPage = new UsersPage(page);
    await usersPage.goto();

    // สร้าง ลบ และกู้คืน user
    await usersPage.addUserButton.click();
    await usersPage.fillUserForm(user);
    await usersPage.submitForm('create');
    await page.getByText('สร้างผู้ใช้สำเร็จ!').waitFor();
    await waitForToastsToClear(page);

    usersPage.acceptDialog();
    await usersPage.getUserRow(user.username).locator('[data-tooltip="ลบ"]').click();
    await page.getByText('ลบผู้ใช้สำเร็จ').waitFor();
    await waitForToastsToClear(page);

    await usersPage.showDeletedCheckbox.check();
    usersPage.acceptDialog();
    await usersPage.getUserRow(user.username).locator('[data-tooltip="กู้คืนผู้ใช้"]').click();
    await page.getByText('กู้คืนผู้ใช้สำเร็จ').waitFor();

    // Logout และ login ด้วย user ที่กู้คืนแล้ว
    await logoutAdmin(page);
    await loginWith(page, user.username, user.password);

    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });
});
