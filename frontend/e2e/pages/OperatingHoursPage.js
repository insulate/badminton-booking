export class OperatingHoursPage {
  constructor(page) {
    this.page           = page;
    this.openTimeInput  = page.locator('input[name="openTime"]');
    this.closeTimeInput = page.locator('input[name="closeTime"]');
    this.saveButton     = page.getByRole('button', { name: 'บันทึกการตั้งค่า' });
    this.selectAllBtn   = page.getByRole('button', { name: /เลือกทั้งหมด|ยกเลิกทั้งหมด/ });
  }

  async goto() {
    await this.page.goto('/admin/settings/operating');
  }

  async save() {
    await this.saveButton.click();
  }

  async waitForSuccess() {
    await this.page.getByText('บันทึกเวลาทำการสำเร็จ').waitFor();
  }

  async clickDay(thaiLabel) {
    await this.page.getByText(thaiLabel, { exact: true }).click();
  }

  async isDaySelected(thaiLabel) {
    const label = this.page.locator('label', {
      has: this.page.getByText(thaiLabel, { exact: true }),
    });
    const cls = await label.getAttribute('class');
    return cls?.includes('bg-green-50') ?? false;
  }

  // ทำให้ไม่มีวันถูกเลือก ไม่ว่าสถานะเริ่มต้นจะเป็นอะไร
  async deselectAll() {
    const text = await this.selectAllBtn.textContent();
    if (!text?.includes('ยกเลิกทั้งหมด')) {
      // มีวันถูกเลือกน้อยกว่า 7 วัน → คลิกเพื่อเลือกทั้งหมดก่อน
      await this.selectAllBtn.click();
      await this.page.getByRole('button', { name: 'ยกเลิกทั้งหมด' }).waitFor();
    }
    // ตอนนี้ครบ 7 วัน → คลิกเพื่อยกเลิกทั้งหมด
    await this.selectAllBtn.click();
  }
}
