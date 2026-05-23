export class GroupPlayPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/admin/groupplay');
    await this.page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle');
  }

  // ── Rule section ───────────────────────────────────────────────────────────
  get createRuleBtn() {
    return this.page.getByRole('button', { name: 'สร้างกฎก๊วนใหม่' });
  }
  get editRuleBtn() {
    return this.page.getByRole('button', { name: 'แก้ไขกฎก๊วน' });
  }
  get toggleActiveBtn() {
    return this.page.getByRole('button', { name: /ปิดใช้งาน|เปิดใช้งาน/ });
  }
  get refreshBtn() {
    return this.page.getByRole('button', { name: 'รีเฟรช' });
  }

  // ── Player action buttons ──────────────────────────────────────────────────
  get checkInBtn() {
    return this.page.getByRole('button', { name: 'Check-in ผู้เล่น' });
  }
  get startGameBtn() {
    return this.page.getByRole('button', { name: 'เริ่มเกม' });
  }

  // ── Modal: Create / Edit session ──────────────────────────────────────────
  get sessionNameInput() {
    return this.page.getByPlaceholder('เช่น ก๊วนจันทร์-ศุกร์');
  }
  get entryFeeInput() {
    return this.page.locator('input[type="number"]').last();
  }
  get saveSessionBtn() {
    return this.page.getByRole('button', { name: /สร้างกฎก๊วน|บันทึก/ });
  }

  // ── Modal: Check-in ───────────────────────────────────────────────────────
  get walkInModeBtn() {
    return this.page.getByRole('button', { name: 'Walk-in' });
  }
  get walkInNameInput() {
    return this.page.getByPlaceholder('กรอกชื่อผู้เล่น');
  }
  get walkInPhoneInput() {
    return this.page.getByPlaceholder('0812345678');
  }
  get checkInSubmitBtn() {
    return this.page.getByRole('button', { name: 'Check-in', exact: true });
  }

  // ── Modal: Start game ──────────────────────────────────────────────────────
  get startGameSubmitBtn() {
    return this.page.getByRole('button', { name: 'เริ่มเกม' }).last();
  }

  // ── Modal: Finish game ─────────────────────────────────────────────────────
  get finishGameSubmitBtn() {
    return this.page.getByRole('button', { name: 'จบเกม' }).last();
  }

  // ── Modal: Checkout ────────────────────────────────────────────────────────
  get promptPayBtn() {
    return this.page.getByRole('button', { name: 'พร้อมเพย์' });
  }
  get confirmCheckoutBtn() {
    return this.page.getByRole('button', { name: 'ยืนยัน Check Out' });
  }

  // ── Table helpers ──────────────────────────────────────────────────────────
  get searchInput() {
    return this.page.getByPlaceholder('ค้นหาชื่อหรือเบอร์โทร...');
  }

  rowByName(name) {
    return this.page.locator('tbody tr').filter({ hasText: name });
  }

  detailBtnFor(name) {
    return this.rowByName(name).locator('[data-tooltip="ดูรายละเอียด"]');
  }

  addProductBtnFor(name) {
    return this.rowByName(name).locator('[data-tooltip="เพิ่มสินค้า"]');
  }

  checkoutBtnFor(name) {
    return this.rowByName(name).locator('[data-tooltip="Check Out คิดเงิน"]');
  }

  // ── Current games ──────────────────────────────────────────────────────────
  get finishGameBtnsInCurrentGames() {
    return this.page.getByRole('button', { name: 'จบเกม' });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  async waitForPlayerRow(name) {
    await this.rowByName(name).waitFor({ state: 'visible', timeout: 8000 });
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }
}
