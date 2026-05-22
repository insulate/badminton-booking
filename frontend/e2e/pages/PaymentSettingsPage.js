export class PaymentSettingsPage {
  constructor(page) {
    this.page = page;
    this.acceptCashCheckbox      = page.locator('input[name="acceptCash"]');
    this.acceptTransferCheckbox  = page.locator('input[name="acceptTransfer"]');
    this.acceptPromptPayCheckbox = page.locator('input[name="acceptPromptPay"]');
    this.acceptQRCodeCheckbox    = page.locator('input[name="acceptQRCode"]');
    this.promptPayNumberInput    = page.locator('input[name="promptPayNumber"]');
    this.bankNameInput           = page.locator('input[name="bankName"]');
    this.accountNumberInput      = page.locator('input[name="accountNumber"]');
    this.accountNameInput        = page.locator('input[name="accountName"]');
    this.qrUploadLabel           = page.locator('label[for="qrcode-upload"]');
    this.saveButton              = page.getByRole('button', { name: 'บันทึกการตั้งค่า' });
  }

  async goto() {
    await this.page.goto('/admin/settings/payment');
  }

  async toggle(checkbox, enable) {
    const isChecked = await checkbox.isChecked();
    if (enable !== isChecked) await checkbox.click();
  }

  async save() {
    await this.saveButton.click();
  }

  async waitForSuccess() {
    await this.page.getByText('บันทึกการตั้งค่าการชำระเงินสำเร็จ').waitFor();
  }
}
