import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { courtsAPI } from '../../../../lib/api';
import { ROUTES } from '../../../../constants';
import toast from 'react-hot-toast';

const CourtsEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    courtNumber: '',
    name: '',
    status: 'available',
    description: '',
  });

  useEffect(() => {
    fetchCourt();
  }, [id]);

  const fetchCourt = async () => {
    try {
      setLoading(true);
      const response = await courtsAPI.getById(id);
      if (response.success) {
        setFormData(response.data);
      }
    } catch (error) {
      console.error('Error fetching court:', error);
      toast.error('ไม่สามารถโหลดข้อมูลสนามได้');
      navigate(ROUTES.ADMIN.COURTS);
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

    // Validation
    if (!formData.courtNumber.trim()) {
      toast.error('กรุณาระบุรหัสสนาม');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('กรุณาระบุชื่อสนาม');
      return;
    }

    try {
      setSaving(true);
      const response = await courtsAPI.update(id, formData);

      if (response.success) {
        toast.success('แก้ไขข้อมูลสนามสำเร็จ');
        navigate(ROUTES.ADMIN.COURTS);
      }
    } catch (error) {
      console.error('Error updating court:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
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
          onClick={() => navigate(ROUTES.ADMIN.COURTS)}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">แก้ไขข้อมูลสนาม</h1>
          <p className="text-gray-600 text-sm">แก้ไขข้อมูลสนาม {formData.courtNumber}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Court Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสสนาม <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="courtNumber"
                value={formData.courtNumber}
                onChange={handleChange}
                required
                placeholder="เช่น C01, C02"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
              <p className="text-gray-500 text-sm mt-1">รหัสสนามต้องไม่ซ้ำกัน (เช่น C01, C02, C03)</p>
            </div>

            {/* Court Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อสนาม <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="เช่น Court 1, Court Premium"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="available">พร้อมใช้งาน</option>
                <option value="maintenance">ปิดปรับปรุง</option>
                <option value="inactive">ปิดใช้งาน</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับสนาม (ถ้ามี)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Footer with Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <button
              type="button"
              onClick={() => navigate(ROUTES.ADMIN.COURTS)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึกการแก้ไข
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourtsEditPage;
