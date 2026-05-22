import { test, expect, request as playwrightRequest } from '@playwright/test';
import { PlayerLevelsSettingsPage } from '../pages/PlayerLevelsSettingsPage.js';
import { readFileSync } from 'fs';

const TEST_LEVEL = {
  name: 'Test E2E Level',
  nameEn: 'TEST_E2E',
  description: 'สำหรับ test',
};

test.describe('การตั้งค่าระดับมือผู้เล่น', () => {
  test.describe.configure({ mode: 'serial' });

  let originalLevels = [];
  let token = null;

  // ── Backup: เก็บ player levels เดิมก่อนรัน test ────────────────────────────
  test.beforeAll(async () => {
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get('http://localhost:3000/api/settings/player-levels');
    if (res.ok()) {
      const data = await res.json();
      originalLevels = data.data ?? [];
    }
    await ctx.dispose();
  });

  // ── Restore: คืน player levels เดิมหลังรัน test ทุกตัวจบ ──────────────────
  test.afterAll(async () => {
    if (!token || originalLevels.length === 0) return;

    const ctx = await playwrightRequest.newContext();
    await ctx.patch('http://localhost:3000/api/settings/player-levels', {
      headers: { Authorization: `Bearer ${token}` },
      data: { levels: originalLevels },
    });
    await ctx.dispose();
  });

  // ── 1. UI: แสดง table columns และปุ่มครบ ──────────────────────────────────
  test('แสดง table columns และปุ่มครบ', async ({ page }) => {
    const p = new PlayerLevelsSettingsPage(page);
    await p.goto();

    await expect(page.getByText('ชื่อ (ไทย)')).toBeVisible();
    await expect(page.getByText('ชื่อ (อังกฤษ)')).toBeVisible();
    await expect(page.getByText('คำอธิบาย')).toBeVisible();
    await expect(page.getByText('สี', { exact: true })).toBeVisible();
    await expect(page.getByText('ตัวอย่าง', { exact: true })).toBeVisible();
    await expect(p.saveButton).toBeVisible();
    await expect(p.addButton).toBeVisible();
  });

  // ── 2. UI: preview badge อัปเดต real-time ─────────────────────────────────
  test('preview badge อัปเดตตาม name ที่กรอก', async ({ page }) => {
    const p = new PlayerLevelsSettingsPage(page);
    await p.goto();

    await p.nameInput(0).fill('ทดสอบ Preview');
    await expect(p.previewBadge(0)).toHaveText('ทดสอบ Preview');
  });

  // ── 3. UI: กด "เพิ่มระดับใหม่" → row เพิ่ม ────────────────────────────────
  test('กด "เพิ่มระดับใหม่" → จำนวน row เพิ่มขึ้น 1', async ({ page }) => {
    const p = new PlayerLevelsSettingsPage(page);
    await p.goto();

    const before = await p.rowCount();
    await p.addButton.click();
    expect(await p.rowCount()).toBe(before + 1);
  });

  // ── 4. Validation: name ว่าง (เว้นวรรค) → toast error ───────────────────
  // ใช้ whitespace-only แทน empty string เพราะ HTML5 required ไม่บล็อก whitespace
  // แต่ React trim() จะตรวจจับและแสดง toast error
  test('name เป็น whitespace → toast error / ไม่บันทึก', async ({ page }) => {
    const p = new PlayerLevelsSettingsPage(page);
    await p.goto();

    await p.addButton.click();
    const last = (await p.rowCount()) - 1;
    await p.nameInput(last).fill('   ');
    await p.save();

    await expect(
      page.getByText('กรุณากรอกชื่อระดับให้ครบทุกรายการ')
    ).toBeVisible();
    await expect(
      page.getByText('บันทึกระดับมือสำเร็จ')
    ).not.toBeVisible({ timeout: 2000 });
  });

  // ── 5. Validation: ชื่อซ้ำ → toast error ─────────────────────────────────
  test('ชื่อ level ซ้ำกัน → toast error / ไม่บันทึก', async ({ page }) => {
    const p = new PlayerLevelsSettingsPage(page);
    await p.goto();

    // ดึง name ของ row 0 แล้วใส่ซ้ำใน row 1
    const firstName = await p.nameInput(0).inputValue();
    await p.nameInput(1).fill(firstName);
    await p.save();

    await expect(page.getByText('ชื่อระดับซ้ำ:')).toBeVisible();
    await expect(
      page.getByText('บันทึกระดับมือสำเร็จ')
    ).not.toBeVisible({ timeout: 2000 });
  });

  // ── 6. Validation: เหลือ 1 level → ลบไม่ได้ ─────────────────────────────
  test('เหลือ 1 level → กด delete → toast error ไม่ลบ', async ({ page }) => {
    const p = new PlayerLevelsSettingsPage(page);

    // ตั้ง levels เหลือ 1 ผ่าน API ก่อน
    const ctx = await playwrightRequest.newContext();
    await ctx.patch('http://localhost:3000/api/settings/player-levels', {
      headers: { Authorization: `Bearer ${token}` },
      data: { levels: [{ value: '0', name: 'ระดับเดียว', nameEn: 'SOLO', description: '', color: '#94a3b8' }] },
    });
    await ctx.dispose();

    await p.goto();
    await p.deleteButton(0).click();

    await expect(page.getByText('ต้องมีอย่างน้อย 1 ระดับ')).toBeVisible();
    expect(await p.rowCount()).toBe(1);
  });

  // ── 7. Persistence: เพิ่ม level ใหม่ → save → reload → ยังอยู่ ────────────
  test('เพิ่ม level ใหม่ → save → reload → row ยังอยู่', async ({ page }) => {
    const p = new PlayerLevelsSettingsPage(page);
    await p.goto();

    await p.addButton.click();
    const last = (await p.rowCount()) - 1;
    await p.nameInput(last).fill(TEST_LEVEL.name);
    await p.nameEnInput(last).fill(TEST_LEVEL.nameEn);
    await p.descriptionInput(last).fill(TEST_LEVEL.description);

    await p.save();
    await p.waitForSuccess();

    await page.reload();
    await p.saveButton.waitFor();

    const names = await page.locator('tbody tr').evaluateAll((rows) =>
      rows.map((r) => r.querySelectorAll('input[type="text"]')[0]?.value ?? '')
    );
    expect(names).toContain(TEST_LEVEL.name);
  });

  // ── 8. Persistence: แก้ไข nameEn → save → reload → ค่าถูกต้อง ─────────────
  test('แก้ไข nameEn → save → reload → ค่าถูกต้อง', async ({ page }) => {
    const p = new PlayerLevelsSettingsPage(page);
    await p.goto();

    await p.nameEnInput(0).fill('UPDATED_EN');
    await p.save();
    await p.waitForSuccess();

    await page.reload();

    await expect(p.nameEnInput(0)).toHaveValue('UPDATED_EN');
  });

  // ── 9. Persistence: ลบ level (มี > 1) → save → reload → หายไป ────────────
  test('ลบ level → save → reload → จำนวน row ลดลง 1', async ({ page }) => {
    const p = new PlayerLevelsSettingsPage(page);
    await p.goto();

    const countBefore = await p.rowCount();
    // ลบ row 0 (ไม่ใช่ row สุดท้ายที่เป็น 'Test E2E Level' ซึ่ง test 10/11 ต้องการ)
    await p.deleteButton(0).click();
    await p.save();
    await p.waitForSuccess();

    await page.reload();
    await p.saveButton.waitFor();

    expect(await p.rowCount()).toBe(countBefore - 1);
  });

  // ── 10. Cross-Page: PlayersPage filter แสดง level ใหม่ ────────────────────
  // ขึ้นอยู่กับ test 7 ที่บันทึก TEST_LEVEL.name ไว้
  test('Cross-Page — PlayersPage level filter แสดง level ใหม่', async ({ page }) => {
    await page.goto('/admin/players');

    const levelSelect = page.locator('select').filter({ hasText: 'ทั้งหมด' });
    await expect(levelSelect).toBeVisible();
    await expect(levelSelect.locator(`option:text("${TEST_LEVEL.name}")`)).toBeAttached();
  });

  // ── 11. Cross-Page: PlayerForm level select แสดง level ใหม่ ──────────────
  test('Cross-Page — PlayerForm level select แสดง level ใหม่', async ({ page }) => {
    await page.goto('/admin/players');

    // กด "เพิ่มผู้เล่น" เพื่อเปิด modal
    await page.getByRole('button', { name: 'เพิ่มผู้เล่น' }).click();
    await page.locator('#level').waitFor();

    await expect(
      page.locator('#level').locator(`option:text("${TEST_LEVEL.name}")`)
    ).toBeAttached();
  });
});
