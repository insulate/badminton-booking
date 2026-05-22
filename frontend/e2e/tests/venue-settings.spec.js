import { test, expect, request as playwrightRequest } from '@playwright/test';
import { VenueSettingsPage } from '../pages/VenueSettingsPage.js';
import { readFileSync } from 'fs';

// ── Test data ────────────────────────────────────────────────────────────────
const TEST_VENUE = {
  name:    'E2E Test Venue',
  address: '123 ถนนทดสอบ',
  phone:   '02-000-0000',
  email:   'e2e@test.com',
  lineId:  '@e2etest',
};

test.describe('การตั้งค่าสถานที่', () => {
  // cross-page tests อาศัยข้อมูลที่ test save ไว้ก่อนหน้า
  test.describe.configure({ mode: 'serial' });
  let originalVenue = {};

  // ── Backup: เก็บข้อมูล venue เดิมก่อนรัน test ────────────────────────────
  test.beforeAll(async () => {
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    const token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;
    if (!token) return;

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get('http://localhost:3000/api/settings/venue-info');
    if (res.ok()) {
      const data = await res.json();
      originalVenue = data.venue ?? {};
    }
    await ctx.dispose();
  });

  // ── Restore: คืนข้อมูล venue เดิมหลังรัน test ทุกตัวจบ ───────────────────
  test.afterAll(async () => {
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    const token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;
    if (!token || !originalVenue.name) return;

    const ctx = await playwrightRequest.newContext();
    await ctx.patch('http://localhost:3000/api/settings/venue', {
      headers: { Authorization: `Bearer ${token}` },
      data: originalVenue,
    });
    await ctx.dispose();
  });

  // ── 1. Form แสดงข้อมูลปัจจุบัน ───────────────────────────────────────────
  test('แสดง form ตั้งค่าสถานที่พร้อมข้อมูลปัจจุบัน', async ({ page }) => {
    const settingsPage = new VenueSettingsPage(page);
    await settingsPage.goto();

    await expect(settingsPage.nameInput).toBeVisible();
    await expect(settingsPage.addressInput).toBeVisible();
    await expect(settingsPage.phoneInput).toBeVisible();
    await expect(settingsPage.emailInput).toBeVisible();
    await expect(settingsPage.lineIdInput).toBeVisible();
    // ชื่อสนามต้องมีค่าอยู่แล้ว (ไม่ใช่ค่าว่าง)
    await expect(settingsPage.nameInput).not.toHaveValue('');
  });

  // ── 2. Validation: ชื่อสนามเป็น required ──────────────────────────────────
  test('ไม่กรอกชื่อสนาม → บันทึกไม่ได้', async ({ page }) => {
    const settingsPage = new VenueSettingsPage(page);
    await settingsPage.goto();

    await settingsPage.nameInput.fill('');
    await settingsPage.save();

    // form ไม่ควร submit → toast ไม่ปรากฏ
    await expect(page.getByText('บันทึกข้อมูลสนามสำเร็จ')).not.toBeVisible({ timeout: 2000 });
    // field อยู่ในสถานะ invalid (HTML5 required)
    const isInvalid = await settingsPage.nameInput.evaluate((el) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  // ── 3. Save & persist ──────────────────────────────────────────────────────
  test('บันทึกข้อมูลสนามสำเร็จ → reload แล้วข้อมูลยังคงอยู่', async ({ page }) => {
    const settingsPage = new VenueSettingsPage(page);
    await settingsPage.goto();

    await settingsPage.fillForm(TEST_VENUE);
    await settingsPage.save();
    await settingsPage.waitForSuccess();

    await page.reload();

    await expect(settingsPage.nameInput).toHaveValue(TEST_VENUE.name);
    await expect(settingsPage.phoneInput).toHaveValue(TEST_VENUE.phone);
    await expect(settingsPage.emailInput).toHaveValue(TEST_VENUE.email);
    await expect(settingsPage.lineIdInput).toHaveValue(TEST_VENUE.lineId);
  });

  // ── 4. Cross-page: HomePage ───────────────────────────────────────────────
  test('Cross-Page — HomePage → ชื่อ เบอร์ LINE แสดงถูกต้อง', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(TEST_VENUE.name, { exact: false })).toBeVisible();
    await expect(page.getByText(/TEL:.*02-000-0000/)).toBeVisible();
    await expect(page.getByText(/LINE:.*@e2etest/)).toBeVisible();
  });

  // ── 5. Cross-page: RulesPage ──────────────────────────────────────────────
  test('Cross-Page — RulesPage → ชื่อและเบอร์โทรแสดงถูกต้อง', async ({ page }) => {
    await page.goto('/rules');

    await expect(page.getByText(TEST_VENUE.name, { exact: false })).toBeVisible();
    await expect(page.getByText(TEST_VENUE.phone, { exact: false })).toBeVisible();
  });
});
