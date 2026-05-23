import { test, expect, request as playwrightRequest } from '@playwright/test';
import { PlayersPage } from '../pages/PlayersPage.js';
import { readFileSync } from 'fs';

// ── Test data ──────────────────────────────────────────────────────────────────
const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
const TEST_PLAYER = {
  name: `Test Player ${uid}`,
  phone: `08${Date.now().toString().slice(-8)}`,
  nickname: 'TP',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
async function waitForToastsToClear(page) {
  await page.waitForFunction(
    () => !document.querySelector('[data-rht-toaster]')?.firstElementChild,
    { timeout: 8000 }
  );
}

test.describe('หน้าข้อมูลลูกค้า (PlayersPage)', () => {
  test.describe.configure({ mode: 'serial' });

  let token = null;
  let originalPlayerCount = 0;
  let createdSessionId = null;   // group play session ที่สร้างเพื่อ cross-page test
  let openedShiftId = null;      // shift ที่เปิดเพื่อ POS cross-page test

  // ── beforeAll: อ่าน token + เตรียม cross-page prerequisites ─────────────────
  test.beforeAll(async () => {
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;

    const ctx = await playwrightRequest.newContext();
    const headers = { Authorization: `Bearer ${token}` };

    // 1. เก็บ totalPlayers เดิมสำหรับ cross-page Dashboard test
    const dashRes = await ctx.get('http://localhost:3000/api/reports/dashboard', { headers });
    if (dashRes.ok()) {
      const body = await dashRes.json();
      originalPlayerCount = body.data?.stats?.totalPlayers ?? 0;
    }

    // 2. ตรวจว่ามี group play session หรือยัง — ถ้าไม่มีให้สร้าง
    const sessionsRes = await ctx.get('http://localhost:3000/api/groupplay', { headers });
    if (sessionsRes.ok()) {
      const sessBody = await sessionsRes.json();
      if ((sessBody.data ?? []).length === 0) {
        // ดึง court ตัวแรก
        const courtsRes = await ctx.get('http://localhost:3000/api/courts', { headers });
        if (courtsRes.ok()) {
          const courts = (await courtsRes.json()).data ?? [];
          const firstCourtId = courts.find((c) => !c.deletedAt)?._id;
          if (firstCourtId) {
            const createRes = await ctx.post('http://localhost:3000/api/groupplay', {
              headers,
              data: {
                sessionName: 'Test E2E Group Play',
                courts: [firstCourtId],
                daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                startTime: '09:00',
                endTime: '21:00',
                entryFee: 50,
              },
            });
            if (createRes.ok()) {
              createdSessionId = (await createRes.json()).data?._id;
            }
          }
        }
      }
    }

    // 3. ตรวจว่ามี shift เปิดอยู่หรือเปล่า — ถ้าไม่มีให้เปิด (สำหรับ POS test)
    const shiftRes = await ctx.get('http://localhost:3000/api/shifts/current', { headers });
    if (shiftRes.ok()) {
      const shiftBody = await shiftRes.json();
      if (!shiftBody.data) {
        const openRes = await ctx.post('http://localhost:3000/api/shifts/open', {
          headers,
          data: { openingCash: 0 },
        });
        if (openRes.ok()) {
          openedShiftId = (await openRes.json()).data?._id;
        }
      }
    }

    await ctx.dispose();
  });

  // ── afterAll: ปิด shift ที่เราเปิดไว้ ──────────────────────────────────────
  test.afterAll(async () => {
    if (!token || !openedShiftId) return;

    const ctx = await playwrightRequest.newContext();
    await ctx.post(`http://localhost:3000/api/shifts/${openedShiftId}/close`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { expenses: [], notes: '' },
    });
    await ctx.dispose();
  });

  // ── 1. UI: แสดง elements ครบ ──────────────────────────────────────────────
  test('UI — แสดง header, filter, table columns และปุ่มครบ', async ({ page }) => {
    const p = new PlayersPage(page);
    await p.goto();

    await expect(page.getByRole('heading', { name: 'ข้อมูลลูกค้า' })).toBeVisible();
    await expect(p.addButton).toBeVisible();
    await expect(p.refreshButton).toBeVisible();
    await expect(p.searchInput).toBeVisible();
    await expect(p.levelSelect).toBeVisible();
    await expect(p.showDeletedToggle).toBeVisible();

    // ใช้ thead เพื่อหลีกเลี่ยง strict mode (label filter มีคำว่า 'ระดับมือ' ซ้ำ)
    await expect(page.locator('thead').getByText('ผู้เล่น')).toBeVisible();
    await expect(page.locator('thead').getByText('ระดับมือ')).toBeVisible();
    await expect(page.locator('thead').getByText('สถิติ')).toBeVisible();
    await expect(page.locator('thead').getByText('จัดการ')).toBeVisible();
  });

  // ── 2. Create: เพิ่มผู้เล่นใหม่ (happy path) ───────────────────────────────
  test('Create — เพิ่มผู้เล่นใหม่สำเร็จ', async ({ page }) => {
    const p = new PlayersPage(page);
    await p.goto();

    await p.addButton.click();
    await p.waitForFormOpen();

    await p.nameInput.fill(TEST_PLAYER.name);
    await p.nicknameInput.fill(TEST_PLAYER.nickname);
    await p.phoneInput.fill(TEST_PLAYER.phone);
    await p.submitButton.click();

    await expect(page.getByText('เพิ่มผู้เล่นสำเร็จ')).toBeVisible();
    await expect(p.formModal).not.toBeVisible();
    await expect(p.rowByName(TEST_PLAYER.name)).toBeVisible();
  });

  // ── 3. Validation: ชื่อว่าง → error ข้างใต้ field ────────────────────────
  test('Validation — ชื่อว่าง → แสดง error / ไม่บันทึก', async ({ page }) => {
    const p = new PlayersPage(page);
    await p.goto();

    await p.addButton.click();
    await p.waitForFormOpen();

    // กรอกเบอร์ แต่ปล่อยชื่อว่าง
    await p.phoneInput.fill('0899999991');
    await p.submitButton.click();

    await expect(page.getByText('กรุณากรอกชื่อผู้เล่น')).toBeVisible();
    await expect(p.formModal).toBeVisible();
    await expect(page.getByText('เพิ่มผู้เล่นสำเร็จ')).not.toBeVisible({ timeout: 2000 });
  });

  // ── 4. Validation: เบอร์โทรผิดรูปแบบ → error ────────────────────────────
  test('Validation — เบอร์โทรผิดรูปแบบ → แสดง error / ไม่บันทึก', async ({ page }) => {
    const p = new PlayersPage(page);
    await p.goto();

    await p.addButton.click();
    await p.waitForFormOpen();

    await p.nameInput.fill('Test Validation');
    await p.phoneInput.fill('1234');
    await p.submitButton.click();

    await expect(
      page.getByText('เบอร์โทรศัพท์ต้องเป็นเลข 10 หลักและเริ่มต้นด้วย 0')
    ).toBeVisible();
    await expect(p.formModal).toBeVisible();
  });

  // ── 5. Validation: เบอร์โทรซ้ำ → toast error จาก backend ─────────────────
  test('Validation — เบอร์โทรซ้ำ → toast error / form ยังเปิด', async ({ page }) => {
    const p = new PlayersPage(page);
    await p.goto();

    await p.addButton.click();
    await p.waitForFormOpen();

    await p.nameInput.fill('Duplicate Phone Test');
    await p.phoneInput.fill(TEST_PLAYER.phone); // เบอร์เดิมจาก test 2
    await p.submitButton.click();

    // backend คืน error เบอร์ซ้ำ → toast error แสดง
    await expect(
      page.getByText('มีผู้เล่นที่ใช้เบอร์โทรนี้แล้ว')
    ).toBeVisible({ timeout: 8000 });
    await expect(p.formModal).toBeVisible();
  });

  // ── 6. Edit: แก้ไขข้อมูลผู้เล่น ──────────────────────────────────────────
  test('Edit — แก้ไข nickname สำเร็จ', async ({ page }) => {
    const p = new PlayersPage(page);
    await p.goto();

    // กดปุ่ม edit ของ Test Player
    const row = p.rowByName(TEST_PLAYER.name);
    await row.locator('[data-tooltip="แก้ไข"]').click();
    await p.waitForFormOpen();

    // ตรวจ pre-filled
    await expect(p.nameInput).toHaveValue(TEST_PLAYER.name);
    await expect(p.phoneInput).toHaveValue(TEST_PLAYER.phone);

    // แก้ nickname — ใช้ keyboard เพื่อ trigger React onChange บน controlled input
    await p.nicknameInput.click();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await p.nicknameInput.pressSequentially('Edited');
    // ตรวจ value ก่อน submit
    await expect(p.nicknameInput).toHaveValue('Edited');
    await p.submitButton.click();

    await expect(page.getByText('อัปเดตข้อมูลผู้เล่นสำเร็จ')).toBeVisible();
    await expect(p.formModal).not.toBeVisible();

    // ตรวจข้อมูลถูกบันทึกโดยเปิด form ซ้ำ (reliable กว่า check row text)
    await waitForToastsToClear(page);
    await p.rowByName(TEST_PLAYER.name).locator('[data-tooltip="แก้ไข"]').click();
    await p.waitForFormOpen();
    await expect(p.nicknameInput).toHaveValue('Edited');
    await p.cancelFormButton.click();
    await expect(p.formModal).not.toBeVisible();
  });

  // ── 7. Search: ค้นหาด้วยชื่อ ──────────────────────────────────────────────
  test('Search — ค้นหาด้วยชื่อกรอง table ถูกต้อง', async ({ page }) => {
    const p = new PlayersPage(page);
    await p.goto();

    // ค้นหาด้วยชื่อบางส่วน
    const partialName = TEST_PLAYER.name.slice(0, 12); // "Test Player "
    await p.searchInput.fill(partialName);

    // ตารางต้องแสดง Test Player
    await expect(p.rowByName(TEST_PLAYER.name)).toBeVisible();

    // ล้าง search → คืนสภาพ
    await p.searchInput.clear();
  });

  // ── 8. Search: ค้นหาด้วยเบอร์โทร ─────────────────────────────────────────
  test('Search — ค้นหาด้วยเบอร์โทรกรอง table ถูกต้อง', async ({ page }) => {
    const p = new PlayersPage(page);
    await p.goto();

    // ค้นหาด้วยเบอร์ 4 ตัวท้าย
    const partialPhone = TEST_PLAYER.phone.slice(-4);
    await p.searchInput.fill(partialPhone);

    await expect(p.rowByName(TEST_PLAYER.name)).toBeVisible();

    await p.searchInput.clear();
  });

  // ── Cross-Page 1: Dashboard — totalPlayers เพิ่ม 1 ────────────────────────
  // ขึ้นอยู่กับ test 2 (create) ที่ยังไม่ได้ลบ
  test('Cross-Page — Dashboard แสดงจำนวนลูกค้าเพิ่มขึ้น 1', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // รอ stat card โหลด
    await expect(page.getByText('ลูกค้าทั้งหมด')).toBeVisible();

    const expectedCount = (originalPlayerCount + 1).toLocaleString('th-TH');
    const statCard = page.locator('.rounded-xl, .rounded-2xl').filter({ hasText: 'ลูกค้าทั้งหมด' });
    await expect(statCard).toContainText(expectedCount);
  });

  // ── 9. Delete: ลบผู้เล่น ────────────────────────────────────────────────────
  test('Delete — ลบผู้เล่นสำเร็จ / หายจากตาราง', async ({ page }) => {
    const p = new PlayersPage(page);
    await p.goto();

    const row = p.rowByName(TEST_PLAYER.name);
    await row.locator('[data-tooltip="ลบ"]').click();

    // ConfirmDialog ปรากฏ
    await expect(p.confirmButton).toBeVisible();

    await p.confirmButton.click();

    await expect(page.getByText('ลบผู้เล่นสำเร็จ')).toBeVisible();
    await expect(p.rowByName(TEST_PLAYER.name)).not.toBeVisible();
  });

  // ── 10. Restore: กู้คืนผู้เล่น ──────────────────────────────────────────────
  test('Restore — เปิด showDeleted → กู้คืน → ผู้เล่นกลับมา', async ({ page }) => {
    const p = new PlayersPage(page);
    await p.goto();

    // กรอก search ก่อนเพื่อ filter เฉพาะ player นี้ (ป้องกัน pagination ถ้า DB มี deleted players สะสมจาก runs เก่า)
    await p.searchInput.fill(TEST_PLAYER.name);
    await page.waitForTimeout(200);

    // เปิด toggle แสดงผู้เล่นที่ถูกลบ พร้อมรอ API response ที่มี includeDeleted
    const [,] = await Promise.all([
      p.showDeletedToggle.check(),
      page.waitForResponse(
        (r) => r.url().includes('/api/players') && r.url().includes('includeDeleted=true'),
        { timeout: 8000 }
      ),
    ]);

    // รอ table reload — search + showDeleted filter ควรเหลือแค่ player นี้
    const row = p.rowByName(TEST_PLAYER.name);
    await expect(row).toBeVisible({ timeout: 8000 });
    await expect(row.getByText('ถูกลบ')).toBeVisible();

    await row.getByRole('button', { name: 'กู้คืน' }).click();

    await expect(p.confirmButton).toBeVisible();
    await p.confirmButton.click();

    await expect(page.getByText('กู้คืนข้อมูลผู้เล่นสำเร็จ')).toBeVisible();

    // ปิด toggle → player ปรากฏในรายการปกติ
    await waitForToastsToClear(page);
    await p.showDeletedToggle.uncheck();
    await expect(p.rowByName(TEST_PLAYER.name)).toBeVisible({ timeout: 5000 });
  });

  // ── Cross-Page 2: GroupPlayPage — player ปรากฏใน PlayerCheckInModal ─────────
  // ขึ้นอยู่กับ test 10 (restore) — player ต้องอยู่ในระบบ
  test('Cross-Page — GroupPlayPage พบ player ใน check-in modal', async ({ page }) => {
    await page.goto('/admin/groupplay');
    // รอหน้าโหลด
    await page.waitForLoadState('networkidle');

    // ถ้าไม่มี session ให้ข้ามอย่างสง่างาม
    const checkInBtn = page.getByRole('button', { name: /Check-in ผู้เล่น/ });
    if (!(await checkInBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await checkInBtn.click();

    // Modal เปิด → ค้นหา Test Player (ต้องพิมพ์ >= 2 ตัวอักษร)
    const searchInput = page.getByPlaceholder('พิมพ์เพื่อค้นหา...');
    await expect(searchInput).toBeVisible();

    const searchTerm = TEST_PLAYER.name.slice(0, 8); // "Test Pla"
    await searchInput.fill(searchTerm);

    // รอผลลัพธ์
    await expect(page.getByText(TEST_PLAYER.name)).toBeVisible({ timeout: 5000 });
  });

  // ── Cross-Page 3: POSPage — player ปรากฏใน customer search ─────────────────
  test('Cross-Page — POSPage พบ player ใน customer search', async ({ page }) => {
    await page.goto('/admin/pos');

    // รอ shift API response ก่อน เพื่อรู้ว่า shift เปิดอยู่หรือเปล่า
    await page.waitForResponse(
      (r) => r.url().includes('/api/shifts/current'),
      { timeout: 10000 }
    );
    await page.waitForLoadState('networkidle');

    // ถ้ามี no-shift overlay → ไม่มี shift เปิด → skip test อย่างสง่างาม
    const noShiftOverlay = page.locator('.fixed.inset-0.bg-black\\/60');
    if (await noShiftOverlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      test.skip();
      return;
    }

    // คลิก checkbox ผ่าน page.evaluate เพื่อหลีกเลี่ยง actionability issues ระหว่าง re-render
    await page.evaluate(() => {
      const inputs = [...document.querySelectorAll('input[type="checkbox"]')];
      const tabInput = inputs.find((el) =>
        el.closest('label')?.textContent?.includes('เปิดบิล (Tab)')
      );
      if (tabInput) tabInput.click();
    });

    // รอ tabMode state update + "เลือกลูกค้าเดิม" ปรากฏ
    await expect(page.getByRole('button', { name: 'เลือกลูกค้าเดิม' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'เลือกลูกค้าเดิม' }).click();

    // พิมพ์ชื่อ Test Player ในช่องค้นหา
    const playerSearchInput = page.getByPlaceholder('ค้นหาชื่อ หรือ เบอร์โทร...');
    await expect(playerSearchInput).toBeVisible();
    await playerSearchInput.fill(TEST_PLAYER.name.slice(0, 8));

    // รอ debounce 300ms + API response
    await page.waitForResponse(
      (r) => r.url().includes('/api/players') && r.url().includes('search='),
      { timeout: 5000 }
    );

    await expect(page.getByText(TEST_PLAYER.name)).toBeVisible({ timeout: 5000 });
  });

  // ── Cross-Page 4: RecurringBookingForm — player ปรากฏใน customer dropdown ──
  test('Cross-Page — RecurringBookingForm พบ player ใน customer search', async ({ page }) => {
    await page.goto('/admin/recurring-bookings');
    await page.waitForLoadState('networkidle');

    // เปิด form
    await page.getByRole('button', { name: 'สร้างการจองประจำ' }).click();

    // รอ form modal
    await expect(page.getByText('สร้างการจองประจำใหม่')).toBeVisible();

    // ค้นหา Test Player ในช่อง customer
    const customerSearch = page.getByPlaceholder('ค้นหาลูกค้า (ชื่อ, เบอร์โทร, อีเมล)...');
    await expect(customerSearch).toBeVisible({ timeout: 5000 });

    await customerSearch.fill(TEST_PLAYER.name.slice(0, 8));

    // filter เป็น client-side → ผลปรากฏทันที
    await expect(page.getByText(TEST_PLAYER.name)).toBeVisible({ timeout: 5000 });
  });
});
