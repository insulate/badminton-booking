export class UsersPage {
  constructor(page) {
    this.page = page;
    this.addUserButton = page.getByRole('button', { name: 'เพิ่มผู้ใช้' });
    this.showDeletedCheckbox = page.getByLabel('แสดงผู้ใช้ที่ถูกลบ');
    this.modal = page.locator('.fixed.inset-0');
    this.modalUsernameInput = this.modal.locator('input[placeholder="กรอกชื่อผู้ใช้"]');
    this.modalPasswordInput = this.modal.locator('input[placeholder*="รหัสผ่าน"]');
    this.modalNameInput = this.modal.locator('input[placeholder="กรอกชื่อ-นามสกุล"]');
    this.modalRoleSelect = this.modal.locator('select');
  }

  async goto() {
    await this.page.goto('/admin/users');
  }

  getUserRow(username) {
    return this.page.locator('tr').filter({ hasText: username });
  }

  async fillUserForm({ username, password, name, role = 'user' }) {
    await this.modalUsernameInput.fill(username);
    if (password) await this.modalPasswordInput.fill(password);
    await this.modalNameInput.fill(name);
    await this.modalRoleSelect.selectOption(role);
  }

  async submitForm(mode = 'create') {
    const label = mode === 'create' ? 'สร้างผู้ใช้' : 'บันทึก';
    await this.modal.getByRole('button', { name: label }).click();
  }

  // ต้องเรียกก่อน click ปุ่มที่จะ trigger dialog
  acceptDialog() {
    this.page.once('dialog', (d) => d.accept());
  }
}
