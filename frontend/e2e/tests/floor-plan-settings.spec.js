import { test, expect, request as playwrightRequest } from '@playwright/test';
import { FloorPlanSettingsPage } from '../pages/FloorPlanSettingsPage.js';
import { readFileSync } from 'fs';

// ── Test fixtures ─────────────────────────────────────────────────────────────
// ใช้ 1×1 pixel PNG แบบ inline ไม่ต้องสร้างไฟล์ fixture บน disk
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);
const TEST_IMAGE   = { name: 'test-floor-plan.png', mimeType: 'image/png',  buffer: TINY_PNG };
const INVALID_FILE = { name: 'test.txt',            mimeType: 'text/plain', buffer: Buffer.from('hello') };

test.describe('ตั้งค่ารูปแผนผังสนาม', () => {
  test.describe.configure({ mode: 'serial' });

  let originalImagePath = '';
  let token = null;

  // ── Backup: เก็บ path รูปปัจจุบันก่อนรัน tests ───────────────────────────
  test.beforeAll(async () => {
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;

    // GET floor plan เป็น public endpoint ไม่ต้องใช้ token
    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get('http://localhost:3000/api/settings/floor-plan');
    if (res.ok()) {
      const data = await res.json();
      originalImagePath = data.data?.floorPlanImage ?? '';
    }
    await ctx.dispose();
  });

  // ── Restore: cleanup กรณี test พัง midway ────────────────────────────────
  // ข้อจำกัด: ถ้า originalImagePath !== '' (มีรูปต้นฉบับ) backend จะลบไฟล์เก่า
  // ออกอัตโนมัติเมื่อ upload ใหม่ ทำให้ไม่สามารถ restore ไฟล์ต้นฉบับได้
  // afterAll นี้จึงจัดการเฉพาะกรณีที่ original state เป็น empty
  test.afterAll(async () => {
    if (!token || originalImagePath) return;

    // ตอนแรก empty → ลบรูป test ที่อาจหลงเหลือ (เช่น tests พังก่อน delete step)
    const ctx = await playwrightRequest.newContext();
    const checkRes = await ctx.get('http://localhost:3000/api/settings/floor-plan');
    if (checkRes.ok()) {
      const checkData = await checkRes.json();
      if (checkData.data?.floorPlanImage) {
        await ctx.delete('http://localhost:3000/api/settings/floor-plan', {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
    await ctx.dispose();
  });

  // ── 1. UI: แสดงหน้าครบ ────────────────────────────────────────────────────
  test('แสดงหน้า floor plan settings พร้อม UI ครบถ้วน', async ({ page }) => {
    const p = new FloorPlanSettingsPage(page);
    await p.goto();

    await expect(page.getByRole('heading', { name: 'รูปแผนผังสนาม' })).toBeVisible();
    await expect(page.getByText('รูปแผนผังปัจจุบัน')).toBeVisible();
    await expect(page.getByText('อัพโหลดรูปใหม่').first()).toBeVisible();
    await expect(
      page.getByText('ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์')
    ).toBeVisible();
    // ปุ่ม upload ต้อง disabled เพราะยังไม่ได้เลือกไฟล์
    await expect(p.uploadButton).toBeDisabled();
  });

  // ── 2. Upload: อัพโหลดรูปสำเร็จ ─────────────────────────────────────────
  test('อัพโหลดรูปแผนผังสำเร็จ → แสดงรูปใน current image section', async ({ page }) => {
    const p = new FloorPlanSettingsPage(page);
    await p.goto();

    await p.selectFile(TEST_IMAGE);

    // หลังเลือกไฟล์: preview ปรากฏ, upload button เปิดใช้งาน
    await expect(p.previewSection).toBeVisible();
    await expect(p.uploadButton).toBeEnabled();

    await p.upload();
    await p.waitForUploadSuccess();

    // หลัง upload: รูปปรากฏใน current section, empty state หายไป
    await expect(p.currentImage).toBeVisible();
    await expect(p.emptyState).not.toBeVisible();
  });

  // ── 3. Cross-Page: HomePage แสดงรูปหลัง upload ───────────────────────────
  test('Cross-Page — HomePage แสดงรูปแผนผังหลังอัพโหลด', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByAltText('Floor Plan')).toBeVisible();
    await expect(page.getByText('ยังไม่มีรูปแผนผัง')).not.toBeVisible();
  });

  // ── 4. Validation: ไฟล์ผิดประเภท ─────────────────────────────────────────
  test('เลือกไฟล์ผิดประเภท → แสดง error / ไม่ upload', async ({ page }) => {
    const p = new FloorPlanSettingsPage(page);
    await p.goto();

    await p.selectFile(INVALID_FILE);

    // component ตรวจ mimeType แล้ว reject ทันที → toast error ปรากฏ
    await expect(
      page.getByText('รองรับเฉพาะไฟล์ JPG, PNG, WebP เท่านั้น')
    ).toBeVisible();

    // selectedFile ไม่ถูก set → ปุ่ม upload ยัง disabled, preview ไม่ปรากฏ
    await expect(p.uploadButton).toBeDisabled();
    await expect(p.previewSection).not.toBeVisible();
  });

  // ── 5. Delete: ลบรูปแผนผังสำเร็จ ─────────────────────────────────────────
  test('ลบรูปแผนผังสำเร็จ → empty state กลับมา', async ({ page }) => {
    const p = new FloorPlanSettingsPage(page);
    await p.goto();

    // มีรูปอยู่จาก test 2 → delete button ต้องปรากฏ
    await expect(p.deleteButton).toBeVisible();

    await p.deleteFloorPlan();
    await p.waitForDeleteSuccess();

    // หลังลบ: empty state กลับมา, delete button หายไป
    await expect(p.emptyState).toBeVisible();
    await expect(p.deleteButton).not.toBeVisible();
  });

  // ── 6. Cross-Page: HomePage แสดง placeholder หลัง delete ────────────────
  test('Cross-Page — HomePage แสดง placeholder หลังลบรูปแผนผัง', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('ยังไม่มีรูปแผนผัง')).toBeVisible();
    await expect(page.getByAltText('Floor Plan')).not.toBeVisible();
  });
});
