import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Save } from 'lucide-react';
import { settingsAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../../../constants';

const BookingSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    advanceBookingDays: 7,
    minBookingHours: 1,
    maxBookingHours: 3,
    cancellationHours: 24,
    requireDeposit: false,
    depositAmount: 0,
    depositPercentage: 0,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.get();
      if (response.success && response.data.booking) {
        setFormData(response.data.booking);
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
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.minBookingHours > formData.maxBookingHours) {
      toast.error('ระยะเวลาจองต่ำสุดต้องน้อยกว่าหรือเท่ากับระยะเวลาจองสูงสุด');
      return;
    }

    try {
      setSaving(true);
      const response = await settingsAPI.updateBooking(formData);

      if (response.success) {
        toast.success('บันทึกการตั้งค่าการจองสำเร็จ');
      }
    } catch (error) {
      console.error('Error saving booking settings:', error);
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
          <Calendar className="w-8 h-8 text-purple-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">การตั้งค่าการจอง</h1>
            <p className="text-gray-600 text-sm">กำหนดกฎและเงื่อนไขการจองสนาม</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Advance Booking */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จองล่วงหน้าได้กี่วัน <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="advanceBookingDays"
                value={formData.advanceBookingDays}
                onChange={handleChange}
                min="1"
                max="30"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-gray-500 text-sm mt-1">
                ลูกค้าสามารถจองล่วงหน้าได้ไม่เกิน {formData.advanceBookingDays} วัน
              </p>
            </div>

            {/* Min/Max Booking Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Min Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระยะเวลาจองต่ำสุด (ชั่วโมง) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="minBookingHours"
                  value={formData.minBookingHours}
                  onChange={handleChange}
                  min="0.5"
                  step="0.5"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Max Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระยะเวลาจองสูงสุด (ชั่วโมง) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="maxBookingHours"
                  value={formData.maxBookingHours}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Cancellation Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ยกเลิกการจองล่วงหน้ากี่ชั่วโมง <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="cancellationHours"
                value={formData.cancellationHours}
                onChange={handleChange}
                min="0"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-gray-500 text-sm mt-1">
                ลูกค้าต้องยกเลิกการจองล่วงหน้าอย่างน้อย {formData.cancellationHours} ชั่วโมง
              </p>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Deposit Section */}
            <div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="requireDeposit"
                  name="requireDeposit"
                  checked={formData.requireDeposit}
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="requireDeposit" className="ml-2 text-sm font-medium text-gray-700">
                  ต้องการให้ชำระมัดจำ
                </label>
              </div>

              {formData.requireDeposit && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-6">
                  {/* Deposit Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      จำนวนเงินมัดจำ (บาท)
                    </label>
                    <input
                      type="number"
                      name="depositAmount"
                      value={formData.depositAmount}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Deposit Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เปอร์เซ็นต์มัดจำ (%)
                    </label>
                    <input
                      type="number"
                      name="depositPercentage"
                      value={formData.depositPercentage}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      ใช้อย่างใดอย่างหนึ่ง: จำนวนเงินคงที่ หรือ เปอร์เซ็นต์
                    </p>
                  </div>
                </div>
              )}
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
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center disabled:bg-purple-400 disabled:cursor-not-allowed"
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

export default BookingSettingsPage;
