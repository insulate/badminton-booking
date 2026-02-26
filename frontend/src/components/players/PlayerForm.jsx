import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { getAllLevels, fetchPlayerLevels } from '../../constants/playerLevels';

/**
 * PlayerForm - ฟอร์มสร้าง/แก้ไขผู้เล่น
 * @param {object} player - ข้อมูลผู้เล่น (สำหรับ edit mode)
 * @param {function} onSubmit - ฟังก์ชันเมื่อ submit ฟอร์ม
 * @param {function} onCancel - ฟังก์ชันเมื่อยกเลิก
 * @param {boolean} isLoading - สถานะกำลังบันทึก
 */
export default function PlayerForm({ player, onSubmit, onCancel, isLoading = false }) {
  const isEditMode = !!player;
  const [levels, setLevels] = useState(getAllLevels());

  useEffect(() => {
    fetchPlayerLevels().then((apiLevels) => setLevels(apiLevels));
  }, []);

  const [formData, setFormData] = useState({
    name: player?.name || '',
    nickname: player?.nickname || '',
    phone: player?.phone || '',
    level: player?.level || '',
    password: '',
    notes: player?.notes || '',
  });

  const [errors, setErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Format phone number as user types
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 10) value = value.slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: value }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: null }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณากรอกชื่อผู้เล่น';
    } else if (formData.name.length < 2) {
      newErrors.name = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!/^0\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'เบอร์โทรศัพท์ต้องเป็นเลข 10 หลักและเริ่มต้นด้วย 0';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    // Prepare data
    const submitData = {
      name: formData.name.trim(),
      nickname: formData.nickname.trim(),
      phone: formData.phone,
      level: formData.level || null,
      notes: formData.notes.trim(),
    };

    // Only include password if it's filled
    if (formData.password) {
      submitData.password = formData.password;
    }

    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'แก้ไขข้อมูลผู้เล่น' : 'เพิ่มผู้เล่นใหม่'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อผู้เล่น <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="กรอกชื่อผู้เล่น"
              disabled={isLoading}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Nickname */}
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อเล่น
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="กรอกชื่อเล่น (ไม่บังคับ)"
              disabled={isLoading}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0812345678"
              disabled={isLoading}
              maxLength={10}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
          </div>

          {/* Level */}
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
              ระดับมือ
            </label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="">ไม่ระบุ</option>
              {levels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.name} - {level.description}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน {!isEditMode && <span className="text-red-500">*</span>}
              {isEditMode && <span className="text-gray-500 text-xs">(ไม่กรอกหากไม่ต้องการเปลี่ยน)</span>}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={isEditMode ? 'กรอกหากต้องการเปลี่ยนรหัสผ่าน' : 'กรอกรหัสผ่าน'}
              disabled={isLoading}
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              หมายเหตุ
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="บันทึกข้อมูลเพิ่มเติม (ไม่บังคับ)"
              disabled={isLoading}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">{formData.notes.length}/500 ตัวอักษร</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังบันทึก...' : isEditMode ? 'บันทึกการแก้ไข' : 'เพิ่มผู้เล่น'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

PlayerForm.propTypes = {
  player: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    phone: PropTypes.string,
    level: PropTypes.string,
    notes: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};
