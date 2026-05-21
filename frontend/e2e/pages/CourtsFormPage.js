export class CourtsFormPage {
  constructor(page) {
    this.page = page;
    this.courtNumberInput = page.locator('input[name="courtNumber"]');
    this.nameInput = page.locator('input[name="name"]');
    this.statusSelect = page.locator('select[name="status"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
  }

  async fill({ courtNumber, name, status, description } = {}) {
    if (courtNumber !== undefined) await this.courtNumberInput.fill(courtNumber);
    if (name !== undefined) await this.nameInput.fill(name);
    if (status !== undefined) await this.statusSelect.selectOption(status);
    if (description !== undefined) await this.descriptionInput.fill(description);
  }

  async submitAdd() {
    await this.page.getByRole('button', { name: 'บันทึกสนาม' }).click();
  }

  async submitEdit() {
    await this.page.getByRole('button', { name: 'บันทึกการแก้ไข' }).click();
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'ยกเลิก' }).click();
  }
}
