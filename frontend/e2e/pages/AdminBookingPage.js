export class AdminBookingPage {
  constructor(page) {
    this.page = page;
  }

  async goto(dateStr) {
    await this.page.goto('/admin/booking');
    await this.page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle');
    if (dateStr) {
      // ตั้งวันที่ผ่าน date input (BookingCalendar)
      const dateInput = this.page.locator('input[type="date"]').first();
      await dateInput.fill(dateStr);
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {});
    }
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  get heading() {
    return this.page.getByRole('heading', { name: 'จองสนาม' });
  }
  get refreshBtn() {
    return this.page.getByRole('button', { name: 'รีเฟรช' });
  }

  // ── CourtScheduleGrid ──────────────────────────────────────────────────────
  get scheduleTable() {
    return this.page.locator('table');
  }
  // div ที่มี title="คลิกเพื่อจอง HH:MM" คือ slot ว่าง (first half = :00)
  get firstAvailableSlot() {
    return this.page.locator('div[title*="คลิกเพื่อจอง"]').first();
  }
  async waitForScheduleLoaded() {
    await this.page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
    // รอ table มีแถว
    await this.page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  // ── Blocked Dates Section ──────────────────────────────────────────────────
  // input date แรก = date ใน BlockedDates section (input ที่ 2 ถ้ามี BookingCalendar อยู่ก่อน)
  get blockedDateInput() {
    // BookingCalendar มี input date แรก; blocked date section มี input date ถัดไป
    return this.page.locator('input[type="date"]').nth(1);
  }
  get blockedReasonInput() {
    return this.page.getByPlaceholder('เหตุผล (เช่น วันจัดแข่งขัน)');
  }
  get addBlockedDateBtn() {
    return this.page.getByRole('button', { name: 'เพิ่ม' });
  }
  blockedDateRow(reason) {
    return this.page.locator('div, li').filter({ hasText: reason });
  }

  // ── BookingModal ───────────────────────────────────────────────────────────
  get modalHeading() {
    return this.page.getByRole('heading', { name: 'สร้างการจองใหม่' });
  }
  get customerNameInput() {
    return this.page.locator('#customerName');
  }
  get customerPhoneInput() {
    return this.page.locator('#customerPhone');
  }
  get customerEmailInput() {
    return this.page.locator('#customerEmail');
  }
  get durationSelect() {
    return this.page.locator('#duration');
  }
  get paymentMethodSelect() {
    return this.page.locator('#paymentMethod');
  }
  get paidStatusBtn() {
    return this.page.getByRole('button', { name: 'ชำระแล้ว' });
  }
  get pendingStatusBtn() {
    return this.page.getByRole('button', { name: 'ยังไม่ชำระ' });
  }
  get confirmBookingBtn() {
    return this.page.getByRole('button', { name: 'ยืนยันการจอง' });
  }
  get cancelModalBtn() {
    return this.page.getByRole('button', { name: 'ยกเลิก' });
  }

  async openFirstAvailableSlot() {
    const slot = this.firstAvailableSlot;
    await slot.waitFor({ state: 'visible', timeout: 15000 });
    await slot.click();
    await this.modalHeading.waitFor({ state: 'visible', timeout: 8000 });
  }
}
