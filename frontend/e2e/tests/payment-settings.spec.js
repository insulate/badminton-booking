import { test, expect, request as playwrightRequest } from '@playwright/test';
import { PaymentSettingsPage } from '../pages/PaymentSettingsPage.js';
import { readFileSync } from 'fs';

// ── Test data ────────────────────────────────────────────────────────────────
const TEST_PAYMENT = {
  acceptCash:      true,
  acceptTransfer:  false,
  acceptPromptPay: true,
  acceptQRCode:    false,
};

const TEST_BANK = {
  bankName:      'ธนาคารกสิกรไทย',
  accountNumber: '123-4-56789-0',
  accountName:   'ทดสอบ ระบบ',
};

const TEST_PROMPTPAY_NUMBER = '0812345678';

test.describe('การตั้งค่าการชำระเงิน', () => {
  test.describe.configure({ mode: 'serial' });

  let originalPayment = {};
  let token = null;

  // ── Backup: เก็บข้อมูล payment settings เดิมก่อนรัน test ──────────────────
  test.beforeAll(async () => {
    const authData = JSON.parse(readFileSync('e2e/.auth/admin.json', 'utf-8'));
    token = authData.origins?.[0]?.localStorage?.find((i) => i.name === 'token')?.value;
    if (!token) return;

    const ctx = await playwrightRequest.newContext();
    const res = await ctx.get('http://localhost:3000/api/settings', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok()) {
      const data = await res.json();
      originalPayment = data.data?.payment ?? {};
    }
    await ctx.dispose();
  });

  // ── Restore: คืนข้อมูล payment settings เดิมหลังรัน test ทุกตัวจบ ─────────
  test.afterAll(async () => {
    if (!token || originalPayment.acceptCash == null) return;

    const { qrCodeImage, ...paymentToRestore } = originalPayment;
    const ctx = await playwrightRequest.newContext();
    await ctx.patch('http://localhost:3000/api/settings/payment', {
      headers: { Authorization: `Bearer ${token}` },
      data: paymentToRestore,
    });
    await ctx.dispose();
  });

  // ── 1. UI: Form แสดง checkboxes และ save button ────────────────────────────
  test('แสดง form ตั้งค่าการชำระเงินพร้อม checkbox ทั้ง 4 ตัว', async ({ page }) => {
    const p = new PaymentSettingsPage(page);
    await p.goto();

    await expect(p.acceptCashCheckbox).toBeVisible();
    await expect(p.acceptTransferCheckbox).toBeVisible();
    await expect(p.acceptPromptPayCheckbox).toBeVisible();
    await expect(p.acceptQRCodeCheckbox).toBeVisible();
    await expect(p.saveButton).toBeVisible();
  });

  // ── 2. UI Toggle: acceptTransfer off → ซ่อน bank account section ───────────
  test('acceptTransfer unchecked → ซ่อน bank account fields', async ({ page }) => {
    const p = new PaymentSettingsPage(page);
    await p.goto();

    await p.toggle(p.acceptTransferCheckbox, false);

    await expect(p.bankNameInput).not.toBeVisible();
    await expect(p.accountNumberInput).not.toBeVisible();
    await expect(p.accountNameInput).not.toBeVisible();
  });

  // ── 3. UI Toggle: acceptTransfer on → แสดง bank account fields ─────────────
  test('acceptTransfer checked → แสดง bank account fields', async ({ page }) => {
    const p = new PaymentSettingsPage(page);
    await p.goto();

    await p.toggle(p.acceptTransferCheckbox, true);

    await expect(p.bankNameInput).toBeVisible();
    await expect(p.accountNumberInput).toBeVisible();
    await expect(p.accountNameInput).toBeVisible();
  });

  // ── 4. UI Toggle: acceptPromptPay off → ซ่อน promptPayNumber ───────────────
  test('acceptPromptPay unchecked → ซ่อน promptPayNumber', async ({ page }) => {
    const p = new PaymentSettingsPage(page);
    await p.goto();

    await p.toggle(p.acceptPromptPayCheckbox, false);

    await expect(p.promptPayNumberInput).not.toBeVisible();
  });

  // ── 5. UI Toggle: acceptPromptPay on → แสดง promptPayNumber ────────────────
  test('acceptPromptPay checked → แสดง promptPayNumber', async ({ page }) => {
    const p = new PaymentSettingsPage(page);
    await p.goto();

    await p.toggle(p.acceptPromptPayCheckbox, true);

    await expect(p.promptPayNumberInput).toBeVisible();
  });

  // ── 6. UI Toggle: acceptQRCode off → ซ่อน QR upload area ──────────────────
  test('acceptQRCode unchecked → ซ่อน QR upload area', async ({ page }) => {
    const p = new PaymentSettingsPage(page);
    await p.goto();

    await p.toggle(p.acceptQRCodeCheckbox, false);

    await expect(p.qrUploadLabel).not.toBeVisible();
  });

  // ── 7. UI Toggle: acceptQRCode on → แสดง QR upload area ───────────────────
  test('acceptQRCode checked → แสดง QR upload area', async ({ page }) => {
    const p = new PaymentSettingsPage(page);
    await p.goto();

    await p.toggle(p.acceptQRCodeCheckbox, true);

    await expect(page.getByText('รูป QR Code สำหรับชำระเงิน')).toBeVisible();
  });

  // ── 8. Validation: ปิดทุก checkbox → toast error ───────────────────────────
  test('ปิดทุก checkbox → toast error / ไม่บันทึก', async ({ page }) => {
    const p = new PaymentSettingsPage(page);
    await p.goto();

    await p.toggle(p.acceptCashCheckbox,      false);
    await p.toggle(p.acceptTransferCheckbox,  false);
    await p.toggle(p.acceptPromptPayCheckbox, false);
    await p.toggle(p.acceptQRCodeCheckbox,    false);
    await p.save();

    await expect(
      page.getByText('กรุณาเลือกวิธีการชำระเงินอย่างน้อย 1 วิธี')
    ).toBeVisible();

    await expect(
      page.getByText('บันทึกการตั้งค่าการชำระเงินสำเร็จ')
    ).not.toBeVisible({ timeout: 2000 });
  });

  // ── 9. Persistence: บันทึก payment method toggles → reload → ค่าตรงกัน ────
  test('บันทึก payment method toggles → reload → ค่าถูกต้อง', async ({ page }) => {
    const p = new PaymentSettingsPage(page);
    await p.goto();

    await p.toggle(p.acceptCashCheckbox,      TEST_PAYMENT.acceptCash);
    await p.toggle(p.acceptTransferCheckbox,  TEST_PAYMENT.acceptTransfer);
    await p.toggle(p.acceptPromptPayCheckbox, TEST_PAYMENT.acceptPromptPay);
    await p.toggle(p.acceptQRCodeCheckbox,    TEST_PAYMENT.acceptQRCode);
    await p.save();
    await p.waitForSuccess();

    await page.reload();

    expect(await p.acceptCashCheckbox.isChecked()).toBe(TEST_PAYMENT.acceptCash);
    expect(await p.acceptTransferCheckbox.isChecked()).toBe(TEST_PAYMENT.acceptTransfer);
    expect(await p.acceptPromptPayCheckbox.isChecked()).toBe(TEST_PAYMENT.acceptPromptPay);
    expect(await p.acceptQRCodeCheckbox.isChecked()).toBe(TEST_PAYMENT.acceptQRCode);
  });

  // ── 10. Persistence: บันทึก bank account → reload → ค่าถูกต้อง ─────────────
  test('บันทึก bank account details → reload → ค่าถูกต้อง', async ({ page }) => {
    const p = new PaymentSettingsPage(page);
    await p.goto();

    await p.toggle(p.acceptTransferCheckbox, true);
    await p.bankNameInput.fill(TEST_BANK.bankName);
    await p.accountNumberInput.fill(TEST_BANK.accountNumber);
    await p.accountNameInput.fill(TEST_BANK.accountName);
    await p.save();
    await p.waitForSuccess();

    await page.reload();

    await expect(p.bankNameInput).toHaveValue(TEST_BANK.bankName);
    await expect(p.accountNumberInput).toHaveValue(TEST_BANK.accountNumber);
    await expect(p.accountNameInput).toHaveValue(TEST_BANK.accountName);
  });

  // ── 11. Persistence: บันทึก promptPayNumber → reload → ค่าถูกต้อง ──────────
  test('บันทึก promptPayNumber → reload → ค่าถูกต้อง', async ({ page }) => {
    const p = new PaymentSettingsPage(page);
    await p.goto();

    await p.toggle(p.acceptPromptPayCheckbox, true);
    await p.promptPayNumberInput.fill(TEST_PROMPTPAY_NUMBER);
    await p.save();
    await p.waitForSuccess();

    await page.reload();

    await expect(p.promptPayNumberInput).toHaveValue(TEST_PROMPTPAY_NUMBER);
  });

  // ── 12. Cross-Page — PaymentPage ไม่แสดงส่วน QR Code เมื่อ acceptQRCode=false ─
  // TEST_PAYMENT.acceptQRCode = false ถูกบันทึกใน test 9 และไม่มี test ใดเปลี่ยนกลับ
  test('Cross-Page — PaymentPage ไม่แสดงส่วน QR Code เมื่อ acceptQRCode=false', async ({ page, request }) => {
    // หา court, timeslot และ advanceBookingDays สำหรับสร้าง booking ชั่วคราว
    const [courtsRes, slotsRes, settingsRes] = await Promise.all([
      request.get('http://localhost:3000/api/courts', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      request.get('http://localhost:3000/api/timeslots', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      request.get('http://localhost:3000/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const court = (await courtsRes.json()).data?.find((c) => !c.deletedAt);
    const slot  = (await slotsRes.json()).data?.[0];
    const advanceDays = (await settingsRes.json()).data?.booking?.advanceBookingDays ?? 7;

    // ใช้วันที่อยู่ในช่วงที่ advanceBookingDays อนุญาต (เลือก 1 วันก่อนถึง limit)
    const d = new Date();
    d.setDate(d.getDate() + Math.max(1, advanceDays - 1));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // สร้าง booking ชั่วคราว
    const bookingRes = await request.post('http://localhost:3000/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        court:    court._id,
        timeSlot: slot._id,
        date:     dateStr,
        customer: { name: 'Test CrossPage Payment', phone: '0800000001' },
        duration: 1,
      },
    });
    expect(bookingRes.ok()).toBe(true);

    const bookingId = (await bookingRes.json()).data?._id;
    expect(bookingId).toBeTruthy();

    // เปลี่ยนสถานะเป็น checked-in (confirmed → checked-in เป็น valid transition)
    // เพื่อให้ PaymentPage แสดง payment form (ไม่ใช่ success state ที่ triggered โดย 'confirmed')
    await request.patch(`http://localhost:3000/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { bookingStatus: 'checked-in' },
    });

    try {
      await page.goto(`/payment/${bookingId}`);

      // รอให้หน้าโหลดเสร็จ (heading "ช่องทางการชำระเงิน" ปรากฏ)
      await page.getByText('ช่องทางการชำระเงิน').waitFor();

      // ส่วน QR Code ต้องไม่ปรากฏ (acceptQRCode = false)
      await expect(page.getByText('QR Code')).not.toBeVisible();

    } finally {
      // ยกเลิก booking ชั่วคราว (ไม่มี DELETE route สำหรับ booking ใช้ cancel แทน)
      if (bookingId) {
        const ctx = await playwrightRequest.newContext();
        await ctx.patch(`http://localhost:3000/api/bookings/${bookingId}/cancel`, {
          headers: { Authorization: `Bearer ${token}` },
          data: {},
        });
        await ctx.dispose();
      }
    }
  });
});
