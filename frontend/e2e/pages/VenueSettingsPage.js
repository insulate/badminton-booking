export class VenueSettingsPage {
  constructor(page) {
    this.page         = page;
    this.nameInput    = page.locator('input[name="name"]');
    this.addressInput = page.locator('textarea[name="address"]');
    this.phoneInput   = page.locator('input[name="phone"]');
    this.emailInput   = page.locator('input[name="email"]');
    this.lineIdInput  = page.locator('input[name="lineId"]');
    this.saveButton   = page.getByRole('button', { name: 'บันทึกการตั้งค่า' });
  }

  async goto() {
    await this.page.goto('/admin/settings/venue');
  }

  async fillForm({ name, address, phone, email, lineId }) {
    if (name    !== undefined) await this.nameInput.fill(name);
    if (address !== undefined) await this.addressInput.fill(address);
    if (phone   !== undefined) await this.phoneInput.fill(phone);
    if (email   !== undefined) await this.emailInput.fill(email);
    if (lineId  !== undefined) await this.lineIdInput.fill(lineId);
  }

  async save() {
    await this.saveButton.click();
  }

  async waitForSuccess() {
    await this.page.getByText('บันทึกข้อมูลสนามสำเร็จ').waitFor();
  }
}
