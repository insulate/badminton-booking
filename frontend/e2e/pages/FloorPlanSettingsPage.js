export class FloorPlanSettingsPage {
  constructor(page) {
    this.page           = page;
    this.uploadButton   = page.getByRole('button', { name: 'อัพโหลดรูปใหม่' });
    this.deleteButton   = page.getByRole('button', { name: 'ลบรูปแผนผัง' });
    this.cancelButton   = page.getByRole('button', { name: 'ยกเลิก' });
    this.fileInput      = page.locator('input[type="file"]');
    this.emptyState     = page.getByText('ยังไม่มีรูปแผนผัง').first();
    this.currentImage   = page.getByAltText('Floor Plan');
    this.previewSection = page.getByText('ตัวอย่างรูปที่เลือก');
  }

  async goto() {
    await this.page.goto('/admin/settings/floor-plan');
  }

  async selectFile(filePayload) {
    await this.fileInput.setInputFiles(filePayload);
  }

  async upload() {
    await this.uploadButton.click();
  }

  async deleteFloorPlan() {
    this.page.once('dialog', (d) => d.accept());
    await this.deleteButton.click();
  }

  async waitForUploadSuccess() {
    await this.page.getByText('อัพโหลดรูปแผนผังสำเร็จ').waitFor();
  }

  async waitForDeleteSuccess() {
    await this.page.getByText('ลบรูปแผนผังสำเร็จ').waitFor();
  }
}
