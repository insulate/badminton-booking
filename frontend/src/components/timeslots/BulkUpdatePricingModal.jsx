import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { timeslotsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const BulkUpdatePricingModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dayType: 'all', // all, weekday, weekend
    pricing: {
      normal: '',
      member: '',
    },
    peakPricing: {
      normal: '',
      member: '',
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('pricing.')) {
      const pricingField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          [pricingField]: value,
        },
      }));
    } else if (name.startsWith('peakPricing.')) {
      const pricingField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        peakPricing: {
          ...prev.peakPricing,
          [pricingField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate at least one price is filled
    const hasRegularPrice = formData.pricing.normal || formData.pricing.member;
    const hasPeakPrice = formData.peakPricing.normal || formData.peakPricing.member;

    if (!hasRegularPrice && !hasPeakPrice) {
      toast.error('กรุณากรอกราคาอย่างน้อย 1 ช่อง');
      return;
    }

    try {
      setLoading(true);

      // Prepare update data
      const updateData = {
        dayType: formData.dayType === 'all' ? null : formData.dayType,
      };

      // Only include pricing that has values
      if (formData.pricing.normal || formData.pricing.member) {
        updateData.pricing = {};
        if (formData.pricing.normal) updateData.pricing.normal = Number(formData.pricing.normal);
        if (formData.pricing.member) updateData.pricing.member = Number(formData.pricing.member);
      }

      if (formData.peakPricing.normal || formData.peakPricing.member) {
        updateData.peakPricing = {};
        if (formData.peakPricing.normal)
          updateData.peakPricing.normal = Number(formData.peakPricing.normal);
        if (formData.peakPricing.member)
          updateData.peakPricing.member = Number(formData.peakPricing.member);
      }

      const response = await timeslotsAPI.bulkUpdatePricing(updateData);

      if (response.success) {
        toast.success(`อัปเดตราคา ${response.data.modifiedCount} ช่วงเวลาสำเร็จ`);
        onSuccess();
      }
    } catch (error) {
      console.error('Error bulk updating pricing:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตราคา');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">อัปเดตราคาทั้งหมด</h2>
          </div>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>หมายเหตุ:</strong> ช่องที่ปล่อยว่างจะไม่ถูกอัปเดต ระบบจะอัปเดตเฉพาะช่องที่กรอกค่า
            </p>
          </div>

          {/* Day Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกประเภทวันที่ต้องการอัปเดต <span className="text-red-500">*</span>
            </label>
            <select
              name="dayType"
              value={formData.dayType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="all">ทุกประเภทวัน (ทั้งหมด)</option>
              <option value="weekday">วันจันทร์-ศุกร์ เท่านั้น</option>
              <option value="weekend">วันเสาร์-อาทิตย์ เท่านั้น</option>
            </select>
          </div>

          <hr className="border-gray-200" />

          {/* Regular Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">ราคาปกติ (บาท/ชั่วโมง)</h3>
            <p className="text-xs text-gray-500">ปล่อยว่างถ้าไม่ต้องการเปลี่ยน</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ราคาปกติ</label>
                <input
                  type="number"
                  name="pricing.normal"
                  value={formData.pricing.normal}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="ไม่เปลี่ยน"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ราคาสมาชิก</label>
                <input
                  type="number"
                  name="pricing.member"
                  value={formData.pricing.member}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="ไม่เปลี่ยน"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Peak Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">ราคา Peak Hour (บาท/ชั่วโมง)</h3>
            <p className="text-xs text-gray-500">ปล่อยว่างถ้าไม่ต้องการเปลี่ยน</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Peak ปกติ</label>
                <input
                  type="number"
                  name="peakPricing.normal"
                  value={formData.peakPricing.normal}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="ไม่เปลี่ยน"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Peak สมาชิก</label>
                <input
                  type="number"
                  name="peakPricing.member"
                  value={formData.peakPricing.member}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="ไม่เปลี่ยน"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังอัปเดต...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  อัปเดตราคา
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkUpdatePricingModal;
