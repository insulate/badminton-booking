export class PlayersPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/admin/players');
    // รอให้ข้อมูลโหลดเสร็จ (spinner หาย)
    await this.page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {});
  }

  // ── Header & Buttons ───────────────────────────────────────────────────────
  get addButton() {
    return this.page.getByRole('button', { name: 'เพิ่มผู้เล่นใหม่' });
  }
  get refreshButton() {
    return this.page.getByRole('button', { name: 'รีเฟรช' });
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  get searchInput() {
    return this.page.getByPlaceholder('ค้นหาชื่อหรือเบอร์โทร...');
  }
  get levelSelect() {
    return this.page.locator('select').filter({ hasText: 'ทั้งหมด' });
  }
  get showDeletedToggle() {
    return this.page.locator('input[type="checkbox"]');
  }

  // ── PlayerForm Modal ───────────────────────────────────────────────────────
  get formModal() {
    return this.page.locator('.fixed.inset-0');
  }
  get nameInput() {
    return this.page.locator('#name');
  }
  get nicknameInput() {
    return this.page.locator('#nickname');
  }
  get phoneInput() {
    return this.page.locator('#phone');
  }
  get levelFormSelect() {
    return this.page.locator('#level');
  }
  get submitButton() {
    return this.page.getByRole('button', { name: /^(เพิ่มผู้เล่น|บันทึกการแก้ไข)$/ });
  }
  get cancelFormButton() {
    return this.page.getByRole('button', { name: 'ยกเลิก' }).first();
  }

  async waitForFormOpen() {
    await this.formModal.waitFor({ state: 'visible' });
    await this.nameInput.waitFor({ state: 'visible' });
  }

  // ── Table ──────────────────────────────────────────────────────────────────
  get tableRows() {
    return this.page.locator('tbody tr');
  }
  async rowCount() {
    return this.page.locator('tbody tr').count();
  }
  rowByName(name) {
    return this.page.locator('tbody tr').filter({ hasText: name });
  }

  // ── Confirm Dialog ─────────────────────────────────────────────────────────
  get confirmButton() {
    return this.page.getByRole('button', { name: 'ยืนยัน' });
  }
}
