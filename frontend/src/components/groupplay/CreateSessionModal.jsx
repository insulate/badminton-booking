import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'จันทร์' },
  { value: 'tuesday', label: 'อังคาร' },
  { value: 'wednesday', label: 'พุธ' },
  { value: 'thursday', label: 'พฤหัสบดี' },
  { value: 'friday', label: 'ศุกร์' },
  { value: 'saturday', label: 'เสาร์' },
  { value: 'sunday', label: 'อาทิตย์' },
];

export default function CreateSessionModal({ courts, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    sessionName: '',
    courts: [],
    daysOfWeek: [],
    startTime: '18:00',
    endTime: '22:00',
    entryFee: 30,
  });
  const [loading, setLoading] = useState(false);

  const toggleCourt = (courtId) => {
    setFormData(prev => ({
      ...prev,
      courts: prev.courts.includes(courtId)
        ? prev.courts.filter(id => id !== courtId)
        : [...prev.courts, courtId]
    }));
  };

  const toggleDay = (dayValue) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayValue)
        ? prev.daysOfWeek.filter(d => d !== dayValue)
        : [...prev.daysOfWeek, dayValue]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.sessionName || formData.courts.length === 0 || formData.daysOfWeek.length === 0) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วนและเลือกอย่างน้อย 1 สนาม และ 1 วัน');
      return;
    }

    setLoading(true);
    try {
      await onSuccess(formData);
      toast.success('สร้าง Session สำเร็จ!');
      onClose();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้าง session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-text-primary">สร้าง Session ใหม่</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              ชื่อ Session *
            </label>
            <input
              type="text"
              value={formData.sessionName}
              onChange={(e) => setFormData({ ...formData, sessionName: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="เช่น ก๊วนจันทร์-ศุกร์"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              สนาม * (เลือกได้หลายสนาม)
            </label>
            <div className="border border-slate-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {courts.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-2">ไม่มีสนาม</p>
              ) : (
                <div className="space-y-2">
                  {courts.map(court => (
                    <label
                      key={court._id}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.courts.includes(court._id)}
                        onChange={() => toggleCourt(court._id)}
                        className="w-4 h-4 text-primary-blue border-slate-300 rounded focus:ring-primary-blue"
                      />
                      <span className="text-sm text-text-primary">
                        {court.name} ({court.courtNumber})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formData.courts.length > 0 && (
              <p className="text-xs text-green-600 mt-1">
                เลือกแล้ว {formData.courts.length} สนาม
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              วันในสัปดาห์ * (เลือกได้หลายวัน)
            </label>
            <div className="border border-slate-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {DAYS_OF_WEEK.map(day => (
                  <label
                    key={day.value}
                    className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.daysOfWeek.includes(day.value)}
                      onChange={() => toggleDay(day.value)}
                      className="w-4 h-4 text-primary-blue border-slate-300 rounded focus:ring-primary-blue"
                    />
                    <span className="text-sm text-text-primary">
                      {day.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {formData.daysOfWeek.length > 0 && (
              <p className="text-xs text-green-600 mt-1">
                เลือกแล้ว {formData.daysOfWeek.length} วัน
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                เวลาเริ่ม
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                เวลาสิ้นสุด
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              ค่าเข้าร่วม (บาท)
            </label>
            <input
              type="number"
              value={formData.entryFee}
              onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              min="0"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-text-primary rounded-lg hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'กำลังสร้าง...' : 'สร้าง Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
