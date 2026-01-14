import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Save, Upload, X, Image } from 'lucide-react';
import { settingsAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../../../constants';
import { PageContainer, Card, PageHeader, Button } from '../../../components/common';

// ใช้ base URL สำหรับ static files (ไม่มี /api)
const STATIC_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

const PaymentSettingsPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    acceptCash: true,
    acceptTransfer: true,
    acceptPromptPay: true,
    acceptQRCode: true,
    promptPayNumber: '',
    qrCodeImage: '',
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountName: '',
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.get();
      if (response.success && response.data.payment) {
        setFormData({
          acceptCash: response.data.payment.acceptCash ?? true,
          acceptTransfer: response.data.payment.acceptTransfer ?? true,
          acceptPromptPay: response.data.payment.acceptPromptPay ?? true,
          acceptQRCode: response.data.payment.acceptQRCode ?? true,
          promptPayNumber: response.data.payment.promptPayNumber || '',
          qrCodeImage: response.data.payment.qrCodeImage || '',
          bankAccount: {
            bankName: response.data.payment.bankAccount?.bankName || '',
            accountNumber: response.data.payment.bankAccount?.accountNumber || '',
            accountName: response.data.payment.bankAccount?.accountName || '',
          },
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBankAccountChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      bankAccount: {
        ...prev.bankAccount,
        [name]: value,
      },
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('กรุณาเลือกไฟล์รูปภาพ (jpeg, jpg, png, gif, webp)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await settingsAPI.uploadQRCode(formDataUpload);
      if (response.success) {
        setFormData((prev) => ({
          ...prev,
          qrCodeImage: response.data.qrCodeImage,
        }));
        toast.success('อัพโหลด QR Code สำเร็จ');
      }
    } catch (error) {
      console.error('Error uploading QR Code:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพโหลด');
    } finally {
      setUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteQRCode = async () => {
    if (!formData.qrCodeImage) return;

    if (!window.confirm('ต้องการลบ QR Code นี้หรือไม่?')) return;

    try {
      setUploading(true);
      const response = await settingsAPI.deleteQRCode();
      if (response.success) {
        setFormData((prev) => ({
          ...prev,
          qrCodeImage: '',
        }));
        toast.success('ลบ QR Code สำเร็จ');
      }
    } catch (error) {
      console.error('Error deleting QR Code:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const hasAnyPaymentMethod =
      formData.acceptCash ||
      formData.acceptTransfer ||
      formData.acceptPromptPay ||
      formData.acceptQRCode;

    if (!hasAnyPaymentMethod) {
      toast.error('กรุณาเลือกวิธีการชำระเงินอย่างน้อย 1 วิธี');
      return;
    }

    try {
      setSaving(true);
      // Don't send qrCodeImage in form submit - it's handled separately
      const { qrCodeImage, ...dataToSave } = formData;
      const response = await settingsAPI.updatePayment(dataToSave);

      if (response.success) {
        toast.success('บันทึกการตั้งค่าการชำระเงินสำเร็จ');
      }
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PageContainer variant="form">
      <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="วิธีการชำระเงิน"
        subtitle="เลือกช่องทางการรับชำระเงิน"
        icon={Wallet}
        iconColor="orange"
      />

      {/* Form */}
      <Card padding="p-0">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Payment Methods */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                เลือกวิธีการชำระเงิน <span className="text-red-500">*</span>
              </label>

              <div className="space-y-3">
                {/* Cash */}
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="acceptCash"
                    checked={formData.acceptCash}
                    onChange={handleChange}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">เงินสด (Cash)</span>
                </label>

                {/* Bank Transfer */}
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="acceptTransfer"
                    checked={formData.acceptTransfer}
                    onChange={handleChange}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">โอนเงินผ่านธนาคาร</span>
                </label>

                {/* PromptPay */}
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="acceptPromptPay"
                    checked={formData.acceptPromptPay}
                    onChange={handleChange}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">พร้อมเพย์ (PromptPay)</span>
                </label>

                {/* QR Code */}
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="acceptQRCode"
                    checked={formData.acceptQRCode}
                    onChange={handleChange}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">QR Code</span>
                </label>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* PromptPay Section */}
            {formData.acceptPromptPay && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">ข้อมูลพร้อมเพย์</h3>

                {/* PromptPay Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    หมายเลขพร้อมเพย์
                  </label>
                  <input
                    type="text"
                    name="promptPayNumber"
                    value={formData.promptPayNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="เบอร์โทรศัพท์หรือเลขประจำตัวผู้เสียภาษี"
                  />
                </div>
              </div>
            )}

            {/* QR Code Section */}
            {formData.acceptQRCode && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">รูป QR Code สำหรับชำระเงิน</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    อัพโหลดรูป QR Code
                  </label>

                  {formData.qrCodeImage ? (
                    <div className="relative inline-block">
                      <img
                        src={`${STATIC_BASE_URL}${formData.qrCodeImage}`}
                        alt="QR Code"
                        className="w-48 h-48 object-contain border rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteQRCode}
                        disabled={uploading}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="qrcode-upload"
                      className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                      ) : (
                        <>
                          <Image className="w-10 h-10 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">คลิกเพื่ออัพโหลด</span>
                          <span className="text-xs text-gray-400 mt-1">QR Code</span>
                        </>
                      )}
                    </label>
                  )}

                  <input
                    id="qrcode-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    รองรับไฟล์ .jpg, .png, .gif, .webp ขนาดไม่เกิน 5MB
                  </p>
                </div>
              </div>
            )}

            {/* Bank Account Details */}
            {formData.acceptTransfer && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">ข้อมูลบัญชีธนาคาร</h3>

                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    ชื่อธนาคาร
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankAccount.bankName}
                    onChange={handleBankAccountChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="เช่น ธนาคารกสิกรไทย"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    เลขที่บัญชี
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.bankAccount.accountNumber}
                    onChange={handleBankAccountChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="เช่น 123-4-56789-0"
                  />
                </div>

                {/* Account Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    ชื่อบัญชี
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    value={formData.bankAccount.accountName}
                    onChange={handleBankAccountChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="ชื่อเจ้าของบัญชี"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer with Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(ROUTES.ADMIN.DASHBOARD)}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="orange"
              disabled={saving}
              icon={saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </Button>
          </div>
        </form>
      </Card>
      </div>
    </PageContainer>
  );
};

export default PaymentSettingsPage;
