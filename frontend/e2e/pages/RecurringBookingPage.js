export class RecurringBookingPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/admin/recurring-bookings');
    await this.page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle');
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  get heading() {
    return this.page.getByRole('heading', { name: 'การจองประจำ' });
  }
  get createBtn() {
    return this.page.getByRole('button', { name: 'สร้างการจองประจำ' });
  }
  get searchInput() {
    return this.page.getByPlaceholder('ค้นหาชื่อ, เบอร์โทร, หรือรหัส...');
  }
  get statusFilterSelect() {
    return this.page.locator('select').first();
  }

  // ── Table ──────────────────────────────────────────────────────────────────
  get tableRows() {
    return this.page.locator('table tbody tr');
  }
  getGroupRow(codeOrName) {
    return this.page.locator('table tbody tr').filter({ hasText: codeOrName });
  }

  // ── Create Form Modal ──────────────────────────────────────────────────────
  get formModalHeading() {
    return this.page.getByRole('heading', { name: 'สร้างการจองประจำใหม่' });
  }

  // Customer section — search input หรือ "เพิ่มลูกค้าใหม่" button
  get customerSearchInput() {
    return this.page.getByPlaceholder('ค้นหาลูกค้า (ชื่อ, เบอร์โทร, อีเมล)...');
  }
  get addNewCustomerBtn() {
    return this.page.getByRole('button', { name: 'เพิ่มลูกค้าใหม่ (กรอกเอง)' });
  }
  // Field เมื่ออยู่ใน new customer mode
  get newCustomerNameInput() {
    return this.page.locator('input[name="customerName"]');
  }
  get newCustomerPhoneInput() {
    return this.page.locator('input[name="customerPhone"]');
  }

  // Court & TimeSlot dropdowns
  get courtSelect() {
    return this.page.locator('select[name="court"]');
  }
  get timeSlotSelect() {
    return this.page.locator('select[name="timeSlot"]');
  }
  get durationSelect() {
    return this.page.locator('select[name="duration"]');
  }

  // วันของสัปดาห์ — ปุ่มที่มี data-tooltip เป็นชื่อวัน (จันทร์, อังคาร, ...)
  dayBtn(fullDayName) {
    return this.page.locator(`button[data-tooltip="${fullDayName}"]`);
  }

  // Date range
  get startDateInput() {
    return this.page.locator('input[name="startDate"]');
  }
  get endDateInput() {
    return this.page.locator('input[name="endDate"]');
  }

  // Preview / Cancel buttons ใน form
  get previewBtn() {
    return this.page.getByRole('button', { name: 'ดูตัวอย่าง' });
  }
  get formCancelBtn() {
    return this.page.getByRole('button', { name: 'ยกเลิก' }).first();
  }

  // ── Preview Modal ──────────────────────────────────────────────────────────
  get previewModalConfirmBtn() {
    // ปุ่มยืนยันใน PreviewModal — อาจเป็น "ยืนยันสร้างการจอง" หรือ "ยืนยัน"
    return this.page.getByRole('button', { name: /ยืนยัน/ }).last();
  }

  // ── Detail Modal ───────────────────────────────────────────────────────────
  get detailModal() {
    return this.page.locator('.fixed.inset-0').last();
  }
  get detailModalCloseBtn() {
    return this.page.getByRole('button', { name: 'ปิด' });
  }
  get cancelAllBtn() {
    return this.page.getByRole('button', { name: 'ยกเลิกการจองทั้งหมด' });
  }
  get detailBookingsTable() {
    // ตารางรายการจองใน detail modal
    return this.page.locator('.fixed.inset-0').last().locator('table').last();
  }
  firstCancelSingleBtn() {
    // ปุ่ม "ยกเลิกครั้งนี้" บน session แรก (ที่ยัง confirmed + date >= today)
    return this.page.getByRole('button', { name: 'ยกเลิกครั้งนี้' }).first();
  }

  // dialog handler — ต้องเรียกก่อน action ที่ trigger window.confirm()
  acceptNextDialog() {
    this.page.once('dialog', (d) => d.accept());
  }
}
