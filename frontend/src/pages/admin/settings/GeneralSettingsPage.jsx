import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon, Save } from 'lucide-react';
import { settingsAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../../../constants';

const GeneralSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    currency: 'THB',
    timezone: 'Asia/Bangkok',
    language: 'th',
  });

  const currencies = [
    { value: 'THB', label: 'บาท (THB)' },
    { value: 'USD', label: 'ดอลลาร์สหรัฐ (USD)' },
    { value: 'EUR', label: 'ยูโร (EUR)' },
  ];

  const timezones = [
    { value: 'Asia/Bangkok', label: 'เอเชีย/กรุงเทพ (GMT+7)' },
    { value: 'Asia/Singapore', label: 'เอเชีย/สิงคโปร์ (GMT+8)' },
    { value: 'Asia/Tokyo', label: 'เอเชีย/โตเกียว (GMT+9)' },
  ];

  const languages = [
    { value: 'th', label: 'ไทย' },
    { value: 'en', label: 'English' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.get();
      if (response.success && response.data.general) {
        setFormData(response.data.general);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await settingsAPI.updateGeneral(formData);

      if (response.success) {
        toast.success('บันทึกการตั้งค่าทั่วไปสำเร็จ');
      }
    } catch (error) {
      console.error('Error saving general settings:', error);
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
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(ROUTES.ADMIN.DASHBOARD)}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center">
          <SettingsIcon className="w-8 h-8 text-gray-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">การตั้งค่าทั่วไป</h1>
            <p className="text-gray-600 text-sm">กำหนดการตั้งค่าพื้นฐานของระบบ</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สกุลเงิน <span className="text-red-500">*</span>
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                {currencies.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                สกุลเงินที่ใช้แสดงในระบบ
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เขตเวลา <span className="text-red-500">*</span>
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                {timezones.map((timezone) => (
                  <option key={timezone.value} value={timezone.value}>
                    {timezone.label}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                เขตเวลาที่ใช้ในระบบสำหรับการแสดงเวลาและวันที่
              </p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ภาษา <span className="text-red-500">*</span>
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              >
                {languages.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                ภาษาหลักที่ใช้ในระบบ
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                    ⚠️ คำเตือน
                  </h4>
                  <p className="text-sm text-yellow-700">
                    การเปลี่ยนแปลงการตั้งค่าเหล่านี้อาจส่งผลต่อการแสดงผลของระบบทั้งหมด
                    กรุณาตรวจสอบให้แน่ใจก่อนบันทึก
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <button
              type="button"
              onClick={() => navigate(ROUTES.ADMIN.DASHBOARD)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึกการตั้งค่า
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneralSettingsPage;
