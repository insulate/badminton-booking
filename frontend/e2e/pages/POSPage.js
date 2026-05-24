export class POSPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/admin/pos');
    await this.page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle');
  }

  // ── Product grid ──────────────────────────────────────────────────────────
  get searchInput() {
    return this.page.locator('input[placeholder*="ค้นหาสินค้า"]');
  }
  get allCategoryBtn() {
    return this.page.getByRole('button', { name: 'ทั้งหมด' });
  }
  categoryBtn(label) {
    return this.page.getByRole('button', { name: label });
  }
  productCard(name) {
    return this.page.getByText(name, { exact: false }).first();
  }

  // ── Cart ──────────────────────────────────────────────────────────────────
  get cartEmptyMsg() {
    return this.page.getByText('ตะกร้าว่างเปล่า');
  }
  get cartCountBadge() {
    // <div>รายการในตะกร้า</div> → parent → sibling .font-bold
    return this.page.getByText('รายการในตะกร้า').locator('..').locator('.font-bold');
  }
  get clearCartBtn() {
    return this.page.getByRole('button', { name: 'ล้างทั้งหมด' });
  }
  // Quantity controls row (bg-gray-50 rounded-lg inside a cart item)
  get qtyControl() {
    return this.page.locator('.bg-gray-50.rounded-lg').first();
  }
  get qtyMinusBtn() {
    return this.qtyControl.getByRole('button').first();
  }
  get qtyPlusBtn() {
    return this.qtyControl.getByRole('button').last();
  }
  get qtyDisplay() {
    // <span class="w-10 text-center font-bold text-lg">{quantity}</span>
    return this.qtyControl.locator('span').first();
  }
  get qtySubtotal() {
    // <div class="font-bold text-lg ...">฿{subtotal}</div> — last .font-bold in qty row
    return this.qtyControl.locator('.font-bold').last();
  }

  // ── Checkout section (total + checkout button) ────────────────────────────
  get checkoutSection() {
    return this.page.locator('.border-t-2.border-gray-200.pt-5');
  }
  get checkoutBtn() {
    return this.checkoutSection.getByRole('button').first();
  }

  // ── Payment modal ─────────────────────────────────────────────────────────
  get payBtn() {
    return this.page.getByRole('button', { name: 'ชำระเงิน' });
  }
  get paymentModal() {
    return this.page.locator('.fixed.inset-0').filter({ hasText: 'ยืนยันการชำระเงิน' });
  }
  get exactAmtBtn() {
    return this.paymentModal.getByRole('button', { name: /พอดี/ });
  }
  get receivedAmtInput() {
    return this.paymentModal.locator('input[placeholder="กรอกจำนวนเงินที่รับ"]');
  }
  get changeDisplay() {
    // container เงินทอน: mt-4 p-4 rounded-xl (bg-red-50 หรือ bg-green-50)
    // ต่างจาก ยอดรวมทั้งหมด ที่อยู่ใน border-t section
    return this.paymentModal.locator('.mt-4.p-4.rounded-xl').locator('.text-2xl.font-bold');
  }
  get confirmPayBtn() {
    return this.paymentModal.getByRole('button', { name: 'ยืนยันการชำระเงิน' });
  }
  get cancelPayModalBtn() {
    return this.paymentModal.getByRole('button', { name: 'ยกเลิก' });
  }
  paymentMethodBtn(label) {
    return this.paymentModal.getByRole('button', { name: label });
  }

  // ── Tab mode ──────────────────────────────────────────────────────────────
  get tabModeCheckbox() {
    return this.page.locator('input[type="checkbox"]');
  }
  get tabNewBtn() {
    return this.page.getByRole('button', { name: 'เปิดบิลใหม่' });
  }
  get tabExistingBtn() {
    return this.page.getByRole('button', { name: /เพิ่มเข้าบิลเดิม/ });
  }
  get tabCustomerInput() {
    return this.page.locator('input[placeholder="ชื่อลูกค้า..."]');
  }
  get pendingSaleSelect() {
    // แสดงเมื่อ tabAction === 'existing'
    return this.page.locator('select');
  }
}
