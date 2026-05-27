export class AdminBookingsListPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/admin/bookings');
    await this.page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle');
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  get heading() {
    return this.page.getByRole('heading', { name: 'รายการจอง' });
  }
  get refreshBtn() {
    return this.page.getByRole('button', { name: 'รีเฟรช' });
  }

  // ── Filters ─────────────────────────────────────────────────────────────────
  get dateFromInput() {
    return this.page.locator('#dateFrom');
  }
  get dateToInput() {
    return this.page.locator('#dateTo');
  }
  get statusSelect() {
    return this.page.locator('#status');
  }
  get courtSelect() {
    return this.page.locator('#courtId');
  }
  get searchInput() {
    return this.page.locator('#search');
  }
  get applyFilterBtn() {
    return this.page.getByRole('button', { name: 'ค้นหา' });
  }
  get clearFilterBtn() {
    return this.page.getByRole('button', { name: 'ล้างฟิลเตอร์' });
  }

  async applyFilters() {
    await this.applyFilterBtn.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {});
  }

  async searchByCode(code) {
    await this.searchInput.fill(code);
    await this.applyFilters();
  }

  async clearFilters() {
    const clearBtn = this.clearFilterBtn;
    const isVisible = await clearBtn.isVisible().catch(() => false);
    if (isVisible) {
      await clearBtn.click();
      await this.page.waitForLoadState('networkidle');
    } else {
      // ไม่มีปุ่ม clear — reset ด้วยการตั้ง status=all และลบ search
      await this.statusSelect.selectOption('all');
      await this.searchInput.fill('');
      await this.applyFilters();
    }
  }

  // ── Table ──────────────────────────────────────────────────────────────────
  get tableBody() {
    return this.page.locator('table tbody');
  }
  get tableRows() {
    return this.page.locator('table tbody tr');
  }

  getBookingRow(code) {
    return this.page.locator('table tbody tr').filter({ hasText: code });
  }

  // ── Action Buttons (by data-tooltip) ──────────────────────────────────────
  viewDetailBtnInRow(row) {
    return row.locator('[data-tooltip="ดูรายละเอียด"]');
  }
  markAsPaidBtnInRow(row) {
    return row.locator('[data-tooltip="อัพเดตชำระเงินแล้ว"]');
  }
  checkinBtnInRow(row) {
    return row.locator('[data-tooltip="เช็คอิน"]');
  }
  cancelBtnInRow(row) {
    return row.locator('[data-tooltip="ยกเลิก"]');
  }

  // ── ConfirmDialog ──────────────────────────────────────────────────────────
  get confirmDialogConfirmBtn() {
    return this.page.getByRole('button', { name: 'ยืนยัน' });
  }
  get confirmDialogCancelBtn() {
    return this.page.getByRole('button', { name: 'ยกเลิก' }).last();
  }

  // ── BookingDetailModal ─────────────────────────────────────────────────────
  get detailModal() {
    return this.page.locator('.fixed.inset-0').filter({ has: this.page.locator('h2') });
  }
  get closeDetailModalBtn() {
    return this.page.getByRole('button', { name: 'ปิด' });
  }
}
