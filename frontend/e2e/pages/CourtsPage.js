export class CourtsPage {
  constructor(page) {
    this.page = page;
    this.addButton = page.getByRole('button', { name: 'เพิ่มสนามใหม่' });
    this.searchInput = page.getByPlaceholder('ค้นหาสนาม...');
    this.statusFilter = page.locator('select');
  }

  async goto() {
    await this.page.goto('/admin/settings/courts');
  }

  getCourtRow(courtNumber) {
    return this.page.locator('tr').filter({ hasText: courtNumber });
  }

  acceptDialog() {
    this.page.once('dialog', (d) => d.accept());
  }
}
