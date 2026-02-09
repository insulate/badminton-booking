import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { timeslotsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const TimeSlotModal = ({ timeslot, onClose, onSuccess }) => {
  const isEdit = !!timeslot;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    dayType: 'weekday',
    pricing: {
      normal: 150,
      member: 120,
    },
    peakPricing: {
      normal: 200,
      member: 170,
    },
    peakHour: false,
    status: 'active',
  });

  useEffect(() => {
    if (timeslot) {
      setFormData({
        startTime: timeslot.startTime || '',
        endTime: timeslot.endTime || '',
        dayType: timeslot.dayType || 'weekday',
        pricing: {
          normal: timeslot.pricing?.normal || 150,
          member: timeslot.pricing?.member || 120,
        },
        peakPricing: {
          normal: timeslot.peakPricing?.normal || 200,
          member: timeslot.peakPricing?.member || 170,
        },
        peakHour: timeslot.peakHour || false,
        status: timeslot.status || 'active',
      });
    }
  }, [timeslot]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('pricing.')) {
      const pricingField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          [pricingField]: Number(value),
        },
      }));
    } else if (name.startsWith('peakPricing.')) {
      const pricingField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        peakPricing: {
          ...prev.peakPricing,
          [pricingField]: Number(value),
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const validateForm = () => {
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const endTimeRegex = /^(([0-1]?[0-9]|2[0-3]):[0-5][0-9]|24:00)$/;
    if (!timeRegex.test(formData.startTime)) {
      toast.error('รูปแบบเวลาเริ่มต้นไม่ถูกต้อง (ใช้รูปแบบ HH:MM)');
      return false;
    }
    if (!endTimeRegex.test(formData.endTime)) {
      toast.error('รูปแบบเวลาสิ้นสุดไม่ถูกต้อง (ใช้รูปแบบ HH:MM)');
      return false;
    }

    // Validate end time > start time
    const [startHour, startMin] = formData.startTime.split(':').map(Number);
    const [endHour, endMin] = formData.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      toast.error('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
      return false;
    }

    // Validate pricing
    if (formData.pricing.normal < 0 || formData.pricing.member < 0) {
      toast.error('ราคาปกติต้องไม่ติดลบ');
      return false;
    }

    if (formData.peakPricing.normal < 0 || formData.peakPricing.member < 0) {
      toast.error('ราคา Peak Hour ต้องไม่ติดลบ');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      let response;

      if (isEdit) {
        response = await timeslotsAPI.update(timeslot._id, formData);
      } else {
        response = await timeslotsAPI.create(formData);
      }

      if (response.success) {
        toast.success(isEdit ? 'แก้ไขช่วงเวลาสำเร็จ' : 'เพิ่มช่วงเวลาสำเร็จ');
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving timeslot:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? 'แก้ไขช่วงเวลา' : 'เพิ่มช่วงเวลาใหม่'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            type="button"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เวลาเริ่มต้น <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                placeholder="เช่น 08:00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500">รูปแบบ HH:MM (เช่น 08:00)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เวลาสิ้นสุด <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                placeholder="เช่น 09:00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500">รูปแบบ HH:MM (เช่น 09:00)</p>
            </div>
          </div>

          {/* Day Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประเภทวัน <span className="text-red-500">*</span>
            </label>
            <select
              name="dayType"
              value={formData.dayType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="weekday">วันจันทร์-ศุกร์</option>
              <option value="weekend">วันเสาร์-อาทิตย์</option>
            </select>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">ราคาปกติ (บาท/ชั่วโมง)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ราคาปกติ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="pricing.normal"
                  value={formData.pricing.normal}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ราคาสมาชิก <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="pricing.member"
                  value={formData.pricing.member}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Peak Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">ราคา Peak Hour (บาท/ชั่วโมง)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Peak ปกติ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="peakPricing.normal"
                  value={formData.peakPricing.normal}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Peak สมาชิก <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="peakPricing.member"
                  value={formData.peakPricing.member}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Peak Hour Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label htmlFor="peakHour" className="text-sm font-medium text-gray-700">
                Peak Hour (ช่วงเวลาเร่งด่วน)
              </label>
              <p className="text-xs text-gray-500 mt-1">
                เปิดใช้งานราคา Peak Hour สำหรับช่วงเวลานี้
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  peakHour: !prev.peakHour,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                formData.peakHour ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.peakHour ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะ <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="active">เปิดใช้งาน</option>
              <option value="inactive">ปิดใช้งาน</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มช่วงเวลา'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeSlotModal;
