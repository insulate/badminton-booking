export class PlayerLevelsSettingsPage {
  constructor(page) {
    this.page = page;
    this.saveButton = page.getByRole('button', { name: 'บันทึกการตั้งค่า' });
    this.addButton  = page.getByText('เพิ่มระดับใหม่');
  }

  async goto() {
    await this.page.goto('/admin/settings/player-levels');
    await this.saveButton.waitFor();
  }

  row(index) {
    return this.page.locator('tbody tr').nth(index);
  }

  nameInput(index) {
    return this.row(index).locator('input[type="text"]').nth(0);
  }

  nameEnInput(index) {
    return this.row(index).locator('input[type="text"]').nth(1);
  }

  descriptionInput(index) {
    return this.row(index).locator('input[type="text"]').nth(2);
  }

  deleteButton(index) {
    return this.row(index).locator('button[title="ลบระดับนี้"]');
  }

  previewBadge(index) {
    return this.row(index).locator('span.rounded-full');
  }

  async rowCount() {
    return this.page.locator('tbody tr').count();
  }

  async save() {
    await this.saveButton.click();
  }

  async waitForSuccess() {
    await this.page.getByText('บันทึกระดับมือสำเร็จ').waitFor();
  }
}
