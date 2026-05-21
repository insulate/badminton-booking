export class TimeSlotsPage {
  constructor(page) {
    this.page = page;
    this.addButton = page.getByRole('button', { name: 'เพิ่มช่วงเวลาใหม่' });
    this.bulkUpdateButton = page.getByRole('button', { name: 'อัปเดตราคาทั้งหมด' });
    this.dayTypeFilter = page.locator('select').first();
    this.statusFilter = page.locator('select').nth(1);
  }

  async goto() {
    await this.page.goto('/admin/settings/timeslots');
  }

  getRow(startTime, endTime) {
    return this.page.locator('tr').filter({ hasText: `${startTime} - ${endTime}` });
  }

  acceptDialog() {
    this.page.once('dialog', (d) => d.accept());
  }
}
