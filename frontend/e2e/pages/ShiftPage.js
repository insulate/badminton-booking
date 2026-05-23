export class ShiftPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/admin/shifts');
    await this.page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle');
  }

  // ── No-shift state ─────────────────────────────────────────────────────────
  get noShiftMsg() { return this.page.getByText('ยังไม่ได้เปิดกะ'); }
  get openShiftBtn() { return this.page.getByRole('button', { name: 'เปิดกะ' }).first(); }

  // ── Open shift modal ───────────────────────────────────────────────────────
  get openingCashInput() { return this.page.locator('.fixed.inset-0 input[type="number"]'); }
  // scoped to modal — ไม่ชนกับปุ่มบน no-shift card ที่อยู่เบื้องหลัง overlay
  get confirmOpenBtn() { return this.page.locator('.fixed.inset-0').getByRole('button', { name: 'เปิดกะ' }); }

  // ── Open shift dashboard ───────────────────────────────────────────────────
  get shiftStatusBadge() { return this.page.getByText('กำลังเปิด'); }
  // span.text-2xl.font-bold แสดง shiftCode เช่น SH2026xxxxx
  get shiftCodeBadge() { return this.page.locator('span.text-2xl.font-bold'); }
  get closeShiftBtn() { return this.page.getByRole('button', { name: 'ปิดกะ' }); }
  // เงินเปิดกะ card: getByText อยู่ใน <span> → '..' = flex row → '../..' = card div (bg-blue-50)
  get openingCashCard() { return this.page.getByText('เงินเปิดกะ').locator('../..'); }

  // ── Add expense ────────────────────────────────────────────────────────────
  get addExpenseBtn() { return this.page.getByRole('button', { name: 'เพิ่มรายจ่าย' }); }
  // scoped ไป modal เพื่อหลีกเลี่ยงชนกับ filter selects (พนักงาน/สถานะ) ใน admin section
  get expenseCatSelect() { return this.page.locator('.fixed.inset-0 select'); }
  get expenseDescInput() { return this.page.getByPlaceholder('เช่น ซื้อน้ำแข็ง 2 ถุง'); }
  get expenseAmtInput() { return this.page.locator('.fixed.inset-0 input[type="number"]'); }
  get confirmExpenseBtn() { return this.page.locator('.fixed.inset-0').getByRole('button', { name: 'เพิ่มรายจ่าย' }); }

  // ── Close shift modal ──────────────────────────────────────────────────────
  get actualCashInput() { return this.page.locator('.fixed.inset-0 input[type="number"]').first(); }
  get actualNonCashInput() { return this.page.locator('.fixed.inset-0 input[type="number"]').last(); }
  // X button อยู่ที่ button แรกใน modal header
  get closeModalXBtn() { return this.page.locator('.fixed.inset-0 button').first(); }
  get confirmCloseBtn() { return this.page.locator('.fixed.inset-0').getByRole('button', { name: 'ปิดกะ' }); }

  // ── History table (admin) ──────────────────────────────────────────────────
  get historyTable() { return this.page.locator('table tbody'); }
  // select สุดท้ายใน filter section = status filter (พนักงาน อยู่ก่อน)
  get statusFilter() { return this.page.locator('select').last(); }
  get searchBtn() { return this.page.getByRole('button', { name: 'ค้นหา' }); }

  // ── Expense list helpers ───────────────────────────────────────────────────
  expenseRowByDesc(desc) {
    return this.page.locator('div.divide-y > div').filter({ hasText: desc });
  }
  deleteExpenseBtn(desc) {
    return this.expenseRowByDesc(desc).getByTitle('ลบ');
  }
}
