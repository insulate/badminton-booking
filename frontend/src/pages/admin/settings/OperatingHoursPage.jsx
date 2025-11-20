import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Save } from 'lucide-react';
import { settingsAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../../../constants';
import { PageContainer, Card, PageHeader, Button } from '../../../components/common';

const OperatingHoursPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    openTime: '06:00',
    closeTime: '22:00',
    daysOpen: [],
  });

  const daysOfWeek = [
    { value: 'monday', label: 'จันทร์' },
    { value: 'tuesday', label: 'อังคาร' },
    { value: 'wednesday', label: 'พุธ' },
    { value: 'thursday', label: 'พฤหัสบดี' },
    { value: 'friday', label: 'ศุกร์' },
    { value: 'saturday', label: 'เสาร์' },
    { value: 'sunday', label: 'อาทิตย์' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.get();
      if (response.success && response.data.operating) {
        setFormData(response.data.operating);
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

  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const daysOpen = prev.daysOpen.includes(day)
        ? prev.daysOpen.filter((d) => d !== day)
        : [...prev.daysOpen, day];
      return { ...prev, daysOpen };
    });
  };

  const handleSelectAll = () => {
    const allDays = daysOfWeek.map((d) => d.value);
    setFormData((prev) => ({
      ...prev,
      daysOpen: prev.daysOpen.length === 7 ? [] : allDays,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.daysOpen.length === 0) {
      toast.error('กรุณาเลือกวันทำการอย่างน้อย 1 วัน');
      return;
    }

    // Validate time range (support 24:00 for midnight)
    const openHour = parseInt(formData.openTime.split(':')[0]);
    const openMin = parseInt(formData.openTime.split(':')[1]);
    let closeHour = parseInt(formData.closeTime.split(':')[0]);
    const closeMin = parseInt(formData.closeTime.split(':')[1]);

    const openTimeInMin = openHour * 60 + openMin;
    // Treat 24:00 as end of day
    const closeTimeInMin = closeHour === 24 ? 1440 : closeHour * 60 + closeMin;

    if (closeTimeInMin <= openTimeInMin) {
      toast.error('เวลาเปิดต้องน้อยกว่าเวลาปิด');
      return;
    }

    try {
      setSaving(true);
      const response = await settingsAPI.updateOperating(formData);

      if (response.success) {
        toast.success('บันทึกเวลาทำการสำเร็จ');
      }
    } catch (error) {
      console.error('Error saving operating hours:', error);
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
        title="เวลาทำการ"
        subtitle="กำหนดเวลาเปิด-ปิดและวันทำการ"
        icon={Clock}
        iconColor="green"
      />

      {/* Form */}
      <Card padding="p-0">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Operating Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Open Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เวลาเปิด <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="openTime"
                  value={formData.openTime}
                  onChange={handleChange}
                  placeholder="06:00"
                  pattern="^([0-1]?[0-9]|2[0-4]):[0-5][0-9]$"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ใช้รูปแบบ HH:MM (เช่น 06:00 หรือ 09:00)
                </p>
              </div>

              {/* Close Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เวลาปิด <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="closeTime"
                  value={formData.closeTime}
                  onChange={handleChange}
                  placeholder="22:00 (หรือ 24:00 สำหรับเที่ยงคืน)"
                  pattern="^([0-1]?[0-9]|2[0-4]):[0-5][0-9]$"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ใช้รูปแบบ HH:MM (เช่น 22:00 หรือ 24:00 สำหรับเที่ยงคืน)
                </p>
              </div>
            </div>

            {/* Days Open */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  วันทำการ <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {formData.daysOpen.length === 7 ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {daysOfWeek.map((day) => (
                  <label
                    key={day.value}
                    className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition ${
                      formData.daysOpen.includes(day.value)
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.daysOpen.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                      className="hidden"
                    />
                    <span className="font-medium">{day.label}</span>
                  </label>
                ))}
              </div>

              {formData.daysOpen.length === 0 && (
                <p className="text-red-500 text-sm mt-2">
                  กรุณาเลือกวันทำการอย่างน้อย 1 วัน
                </p>
              )}
            </div>

            {/* Preview */}
            {formData.daysOpen.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">
                  📋 ตัวอย่างเวลาทำการ
                </h4>
                <p className="text-sm text-blue-700">
                  เปิดทำการ <strong>{formData.openTime}</strong> - <strong>{formData.closeTime}</strong>
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  วัน{' '}
                  {formData.daysOpen
                    .map((day) => daysOfWeek.find((d) => d.value === day)?.label)
                    .join(', ')}
                </p>
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
              variant="green"
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

export default OperatingHoursPage;
