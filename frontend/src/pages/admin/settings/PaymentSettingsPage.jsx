import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Save } from 'lucide-react';
import { settingsAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../../../constants';
import { PageContainer, Card, PageHeader, Button } from '../../../components/common';

const PaymentSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    acceptCash: true,
    acceptTransfer: true,
    acceptCreditCard: false,
    acceptPromptPay: true,
    promptPayNumber: '',
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
        setFormData(response.data.payment);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const hasAnyPaymentMethod =
      formData.acceptCash ||
      formData.acceptTransfer ||
      formData.acceptCreditCard ||
      formData.acceptPromptPay;

    if (!hasAnyPaymentMethod) {
      toast.error('กรุณาเลือกวิธีการชำระเงินอย่างน้อย 1 วิธี');
      return;
    }

    try {
      setSaving(true);
      const response = await settingsAPI.updatePayment(formData);

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
      {/* Header with Back Button */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(ROUTES.ADMIN.DASHBOARD)}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <PageHeader
          title="วิธีการชำระเงิน"
          subtitle="เลือกช่องทางการรับชำระเงิน"
          icon={CreditCard}
          iconColor="orange"
        />
      </div>

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
                  <span className="ml-3 text-gray-700 font-medium">💵 เงินสด (Cash)</span>
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
                  <span className="ml-3 text-gray-700 font-medium">🏦 โอนเงินผ่านธนาคาร</span>
                </label>

                {/* Credit Card */}
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="acceptCreditCard"
                    checked={formData.acceptCreditCard}
                    onChange={handleChange}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">💳 บัตรเครดิต/เดบิต</span>
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
                  <span className="ml-3 text-gray-700 font-medium">📱 พร้อมเพย์ (PromptPay)</span>
                </label>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* PromptPay Number */}
            {formData.acceptPromptPay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
    </PageContainer>
  );
};

export default PaymentSettingsPage;
