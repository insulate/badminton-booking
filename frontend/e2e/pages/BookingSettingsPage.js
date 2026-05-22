export class BookingSettingsPage {
  constructor(page) {
    this.page = page;
    this.advanceBookingDaysInput  = page.locator('input[name="advanceBookingDays"]');
    this.minimumAdvanceHoursInput = page.locator('input[name="minimumAdvanceHours"]');
    this.minBookingHoursInput     = page.locator('input[name="minBookingHours"]');
    this.maxBookingHoursInput     = page.locator('input[name="maxBookingHours"]');
    this.cancellationHoursInput   = page.locator('input[name="cancellationHours"]');
    this.requireDepositCheckbox   = page.locator('#requireDeposit');
    this.depositAmountInput       = page.locator('input[name="depositAmount"]');
    this.depositPercentageInput   = page.locator('input[name="depositPercentage"]');
    this.saveButton = page.getByRole('button', { name: 'บันทึกการตั้งค่า' });
  }

  async goto() {
    await this.page.goto('/admin/settings/booking');
  }

  async fillForm({ advanceBookingDays, minimumAdvanceHours, minBookingHours, maxBookingHours, cancellationHours }) {
    if (advanceBookingDays  != null) await this.advanceBookingDaysInput.fill(String(advanceBookingDays));
    if (minimumAdvanceHours != null) await this.minimumAdvanceHoursInput.fill(String(minimumAdvanceHours));
    if (minBookingHours     != null) await this.minBookingHoursInput.fill(String(minBookingHours));
    if (maxBookingHours     != null) await this.maxBookingHoursInput.fill(String(maxBookingHours));
    if (cancellationHours   != null) await this.cancellationHoursInput.fill(String(cancellationHours));
  }

  async setDepositEnabled(enable) {
    const isChecked = await this.requireDepositCheckbox.isChecked();
    if (enable !== isChecked) await this.requireDepositCheckbox.click();
  }

  async save() {
    await this.saveButton.click();
  }

  async waitForSuccess() {
    await this.page.getByText('บันทึกการตั้งค่าการจองสำเร็จ').waitFor();
  }
}
