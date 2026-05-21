import { test, expect } from '@playwright/test';
import { CourtsPage } from '../pages/CourtsPage.js';
import { CourtsFormPage } from '../pages/CourtsFormPage.js';

const makeCourt = () => {
  const id = Math.random().toString(36).slice(2, 6).toUpperCase();
  return {
    courtNumber: `TCT${id}`,
    name: `Test Court ${id}`,
    status: 'available',
    description: 'Auto-generated test court',
  };
};

const makePlayer = () => {
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return {
    name: `Test Player ${suffix}`,
    phone: `089${suffix}`,   // 089XXXXXXX = 10 หลัก
    password: 'testpass123',
  };
};

async function waitForToastsToClear(page) {
  await page.waitForFunction(
    () => !document.querySelector('[data-rht-toaster]')?.firstElementChild,
    { timeout: 8000 }
  );
}

async function registerPlayerAndGotoBooking(page, player) {
  await page.goto('/register');
  await page.fill('input[name="name"]', player.name);
  await page.fill('input[name="phone"]', player.phone);
  await page.fill('input[name="password"]', player.password);
  await page.fill('input[name="confirmPassword"]', player.password);
  await page.getByRole('button', { name: 'สมัครสมาชิก' }).click();
  await page.waitForURL(/\/booking/);
}

async function createCourtViaUI(page, court) {
  const courtsPage = new CourtsPage(page);
  const formPage = new CourtsFormPage(page);

  await courtsPage.goto();
  await courtsPage.addButton.click();
  await page.waitForURL(/\/admin\/settings\/courts\/add/);
  await formPage.fill(court);
  await formPage.submitAdd();
  await page.getByText('เพิ่มสนามใหม่สำเร็จ').waitFor();
  await page.waitForURL(/\/admin\/settings\/courts(?!\/)/);
}

test.describe('Court Management', () => {
  // ── CRUD ────────────────────────────────────────────────────────────────

  test('เพิ่มสนามใหม่สำเร็จ', async ({ page }) => {
    const court = makeCourt();
    const courtsPage = new CourtsPage(page);
    const formPage = new CourtsFormPage(page);

    await courtsPage.goto();
    await courtsPage.addButton.click();
    await page.waitForURL(/\/admin\/settings\/courts\/add/);

    await formPage.fill(court);
    await formPage.submitAdd();

    await expect(page.getByText('เพิ่มสนามใหม่สำเร็จ')).toBeVisible();
    await page.waitForURL(/\/admin\/settings\/courts(?!\/)/);
    await expect(courtsPage.getCourtRow(court.courtNumber)).toBeVisible();
    await expect(courtsPage.getCourtRow(court.courtNumber)).toContainText(court.name);
    await expect(courtsPage.getCourtRow(court.courtNumber)).toContainText('พร้อมใช้งาน');
  });

  test('แก้ไขชื่อและสถานะสนามสำเร็จ', async ({ page }) => {
    const court = makeCourt();
    const courtsPage = new CourtsPage(page);
    const formPage = new CourtsFormPage(page);

    await createCourtViaUI(page, court);
    await waitForToastsToClear(page);

    await courtsPage.getCourtRow(court.courtNumber).locator('[data-tooltip="แก้ไข"]').click();
    await page.waitForURL(/\/admin\/settings\/courts\/edit\//);

    // ตรวจว่าหน้า edit โหลดข้อมูลเดิมมาถูกต้อง
    await expect(formPage.courtNumberInput).toHaveValue(court.courtNumber);
    await expect(formPage.nameInput).toHaveValue(court.name);

    const newName = `Updated Court ${Date.now()}`;
    await formPage.nameInput.clear();
    await formPage.nameInput.fill(newName);
    await formPage.statusSelect.selectOption('maintenance');
    await formPage.submitEdit();

    await expect(page.getByText('แก้ไขข้อมูลสนามสำเร็จ')).toBeVisible();
    await page.waitForURL(/\/admin\/settings\/courts(?!\/)/);
    await expect(courtsPage.getCourtRow(court.courtNumber)).toContainText(newName);
    await expect(courtsPage.getCourtRow(court.courtNumber)).toContainText('ปิดปรับปรุง');
  });

  test('ลบสนามสำเร็จ (soft-delete) → ไม่ปรากฏในรายการ', async ({ page }) => {
    const court = makeCourt();
    const courtsPage = new CourtsPage(page);

    await createCourtViaUI(page, court);
    await waitForToastsToClear(page);

    courtsPage.acceptDialog();
    await courtsPage.getCourtRow(court.courtNumber).locator('[data-tooltip="ลบ"]').click();

    await expect(page.getByText('ลบสนามสำเร็จ')).toBeVisible();
    await expect(courtsPage.getCourtRow(court.courtNumber)).not.toBeVisible();
  });

  // ── Cancel / ยกเลิก ──────────────────────────────────────────────────────

  test('กด ยกเลิก บนหน้า Add → กลับหน้า list ไม่บันทึก', async ({ page }) => {
    const court = makeCourt();
    const courtsPage = new CourtsPage(page);
    const formPage = new CourtsFormPage(page);

    await courtsPage.goto();
    await courtsPage.addButton.click();
    await page.waitForURL(/\/admin\/settings\/courts\/add/);

    // กรอกข้อมูลก่อนยกเลิก
    await formPage.fill(court);
    await formPage.cancel();

    await expect(page).toHaveURL(/\/admin\/settings\/courts(?!\/)/);
    // สนามไม่ถูกบันทึก
    await expect(courtsPage.getCourtRow(court.courtNumber)).not.toBeVisible();
  });

  test('กด ยกเลิก บนหน้า Edit → กลับหน้า list ไม่บันทึก', async ({ page }) => {
    const court = makeCourt();
    const courtsPage = new CourtsPage(page);
    const formPage = new CourtsFormPage(page);

    await createCourtViaUI(page, court);
    await waitForToastsToClear(page);

    await courtsPage.getCourtRow(court.courtNumber).locator('[data-tooltip="แก้ไข"]').click();
    await page.waitForURL(/\/admin\/settings\/courts\/edit\//);

    // แก้ไขชื่อแต่กด ยกเลิก
    await formPage.nameInput.clear();
    await formPage.nameInput.fill('Should Not Save');
    await formPage.cancel();

    await expect(page).toHaveURL(/\/admin\/settings\/courts(?!\/)/);
    // ชื่อเดิมยังอยู่
    await expect(courtsPage.getCourtRow(court.courtNumber)).toContainText(court.name);
  });

  // ── Search & Filter ─────────────────────────────────────────────────────

  test('ค้นหาสนามด้วย courtNumber — กรองผลถูกต้อง', async ({ page }) => {
    const court = makeCourt();
    const courtsPage = new CourtsPage(page);

    await createCourtViaUI(page, court);

    // ค้นหา courtNumber ที่ไม่ตรงกับสนามอื่น
    await courtsPage.searchInput.fill(court.courtNumber);
    await expect(courtsPage.getCourtRow(court.courtNumber)).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(1);

    // ค้นหาคำที่ไม่มี → empty state
    await courtsPage.searchInput.fill('XYZNOTEXIST999');
    await expect(page.getByText('ไม่พบข้อมูลสนามที่ตรงกับเงื่อนไขการค้นหา')).toBeVisible();
  });

  test('กรองตามสถานะ maintenance — แสดงเฉพาะสนามที่ตรง', async ({ page }) => {
    const court = makeCourt();
    const courtsPage = new CourtsPage(page);

    // สร้าง court สถานะ maintenance
    await createCourtViaUI(page, { ...court, status: 'maintenance' });
    await waitForToastsToClear(page);

    // กรอง maintenance → เห็น court นี้ ไม่เห็น badge "พร้อมใช้งาน"
    await courtsPage.statusFilter.selectOption('maintenance');
    await expect(courtsPage.getCourtRow(court.courtNumber)).toBeVisible();
    await expect(courtsPage.getCourtRow(court.courtNumber)).toContainText('ปิดปรับปรุง');
    await expect(page.locator('tbody').getByText('พร้อมใช้งาน')).not.toBeVisible();

    // กรอง inactive → ไม่เห็น court นี้ (มันเป็น maintenance ไม่ใช่ inactive)
    await courtsPage.statusFilter.selectOption('inactive');
    await expect(courtsPage.getCourtRow(court.courtNumber)).not.toBeVisible();
  });

  // ── Validation ──────────────────────────────────────────────────────────

  test('Submit ไม่กรอก courtNumber → error toast', async ({ page }) => {
    const courtsPage = new CourtsPage(page);
    const formPage = new CourtsFormPage(page);

    await courtsPage.goto();
    await courtsPage.addButton.click();
    await page.waitForURL(/\/admin\/settings\/courts\/add/);

    // กรอก courtNumber เป็น whitespace เพื่อผ่าน browser required แต่ fail JS trim()
    await formPage.fill({ courtNumber: '   ', name: 'Test Court' });
    await formPage.submitAdd();

    await expect(page.getByText('กรุณาระบุรหัสสนาม')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/settings\/courts\/add/);
  });

  test('Submit ไม่กรอก name → error toast', async ({ page }) => {
    const courtsPage = new CourtsPage(page);
    const formPage = new CourtsFormPage(page);

    await courtsPage.goto();
    await courtsPage.addButton.click();
    await page.waitForURL(/\/admin\/settings\/courts\/add/);

    // กรอก name เป็น whitespace เพื่อผ่าน browser required แต่ fail JS trim()
    await formPage.fill({ courtNumber: 'TCT00', name: '   ' });
    await formPage.submitAdd();

    await expect(page.getByText('กรุณาระบุชื่อสนาม')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/settings\/courts\/add/);
  });

  // ── Cross-Page Impact ───────────────────────────────────────────────────

  test.describe('Cross-Page — Admin BookingPage', () => {
    test('สร้างสนามใหม่ → ปรากฏใน CourtScheduleGrid', async ({ page }) => {
      const court = makeCourt();
      await createCourtViaUI(page, court);

      await page.goto('/admin/booking');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(court.courtNumber)).toBeVisible();
      await expect(page.getByText(court.name)).toBeVisible();
    });

    test('ลบสนาม → หายออกจาก CourtScheduleGrid', async ({ page }) => {
      const court = makeCourt();
      const courtsPage = new CourtsPage(page);

      await createCourtViaUI(page, court);

      // ยืนยันว่าปรากฏใน BookingPage ก่อน
      await page.goto('/admin/booking');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(court.courtNumber)).toBeVisible();

      // กลับไปลบ
      await courtsPage.goto();
      await waitForToastsToClear(page);
      courtsPage.acceptDialog();
      await courtsPage.getCourtRow(court.courtNumber).locator('[data-tooltip="ลบ"]').click();
      await page.getByText('ลบสนามสำเร็จ').waitFor();

      // ยืนยันว่าหายจาก BookingPage
      await page.goto('/admin/booking');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(court.courtNumber)).not.toBeVisible();
    });
  });

  test.describe('Cross-Page — CustomerBookingPage', () => {
    test('สร้างสนามใหม่ → ปรากฏใน CustomerBookingPage (UI full flow)', async ({ page }) => {
      const court = makeCourt();
      const player = makePlayer();

      // Step 1: สร้าง court ผ่าน admin UI
      await createCourtViaUI(page, court);

      // Step 2: สมัครสมาชิก player → auto-login → redirect /booking
      await registerPlayerAndGotoBooking(page, player);

      // Step 3: รอให้ timeslots โหลดเสร็จ — รอ Step 2 heading หรือ "วันนี้ปิด"
      await Promise.race([
        page.getByText('เลือกเวลาและระยะเวลา').waitFor({ timeout: 15000 }),
        page.getByText('ไม่เปิดให้จองในวันนี้').waitFor({ timeout: 15000 }),
      ]);

      // ถ้าวันนี้ปิด — skip การตรวจ court card
      const isBlocked = await page.getByText('ไม่เปิดให้จองในวันนี้').isVisible();
      if (isBlocked) return;

      // หา timeslot แรกที่ว่าง (button ไม่ disabled ภายใน Step 2 grid)
      const firstSlot = page
        .getByText('เลือกเวลาและระยะเวลา')
        .locator('../../..')
        .locator('button:not([disabled])')
        .first();
      if (!(await firstSlot.isVisible())) return; // ไม่มีช่วงเวลาว่าง

      // Step 4: คลิก timeslot แรกที่ว่าง
      await firstSlot.click();

      // Step 5: รอ Step 3 (เลือกสนาม) ปรากฏ
      await expect(page.getByText('เลือกสนาม', { exact: true })).toBeVisible();
      // รอ skeleton หาย
      await page.waitForFunction(() => !document.querySelector('.animate-pulse'));

      // Step 6: ตรวจว่า court card ปรากฏพร้อมสถานะ "ว่าง"
      const courtCard = page.locator('button').filter({ hasText: court.name });
      await expect(courtCard).toBeVisible();
      await expect(courtCard).toContainText('ว่าง');
    });
  });
});
