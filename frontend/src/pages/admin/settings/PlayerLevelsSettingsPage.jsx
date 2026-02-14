import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, Users } from 'lucide-react';
import { settingsAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { ROUTES } from '../../../constants';
import { PageContainer, Card, PageHeader, Button } from '../../../components/common';
import { clearLevelsCache } from '../../../constants/playerLevels';

const DEFAULT_COLOR = '#94a3b8';

const PlayerLevelsSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getPlayerLevels();
      if (response.success && response.data) {
        setLevels(response.data);
      }
    } catch (error) {
      console.error('Error fetching player levels:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, field, value) => {
    setLevels((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddLevel = () => {
    const nextValue = String(levels.length);
    setLevels((prev) => [
      ...prev,
      {
        value: nextValue,
        name: '',
        nameEn: '',
        description: '',
        color: DEFAULT_COLOR,
      },
    ]);
  };

  const handleRemoveLevel = (index) => {
    if (levels.length <= 1) {
      toast.error('ต้องมีอย่างน้อย 1 ระดับ');
      return;
    }
    setLevels((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Re-assign values to keep them sequential
      return updated.map((level, i) => ({ ...level, value: String(i) }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const emptyNames = levels.filter((l) => !l.name.trim());
    if (emptyNames.length > 0) {
      toast.error('กรุณากรอกชื่อระดับให้ครบทุกรายการ');
      return;
    }

    const names = levels.map((l) => l.name.trim());
    const duplicateNames = names.filter((name, i) => names.indexOf(name) !== i);
    if (duplicateNames.length > 0) {
      toast.error(`ชื่อระดับซ้ำ: ${duplicateNames[0]}`);
      return;
    }

    try {
      setSaving(true);
      const response = await settingsAPI.updatePlayerLevels(levels);
      if (response.success) {
        toast.success('บันทึกระดับมือสำเร็จ');
        clearLevelsCache();
        // Update levels with server response
        if (response.data) {
          setLevels(response.data);
        }
      }
    } catch (error) {
      console.error('Error saving player levels:', error);
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
          title="ระดับมือผู้เล่น"
          subtitle="จัดการระดับมือและสีที่แสดงในระบบ"
          icon={Users}
          iconColor="blue"
        />

        {/* Form */}
        <Card padding="p-0">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                เพิ่ม/ลบ/แก้ไขระดับมือผู้เล่นได้ตามต้องการ ค่าที่เปลี่ยนจะมีผลทั้งระบบทันที
              </div>

              {/* Levels Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-2 text-left font-medium text-gray-600 w-10">#</th>
                      <th className="py-3 px-2 text-left font-medium text-gray-600">
                        ชื่อ (ไทย) <span className="text-red-500">*</span>
                      </th>
                      <th className="py-3 px-2 text-left font-medium text-gray-600">ชื่อ (อังกฤษ)</th>
                      <th className="py-3 px-2 text-left font-medium text-gray-600">คำอธิบาย</th>
                      <th className="py-3 px-2 text-center font-medium text-gray-600 w-20">สี</th>
                      <th className="py-3 px-2 text-center font-medium text-gray-600 w-20">ตัวอย่าง</th>
                      <th className="py-3 px-2 text-center font-medium text-gray-600 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((level, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <span className="text-gray-400 font-mono text-xs">{index}</span>
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={level.name}
                            onChange={(e) => handleChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="เช่น มือBG"
                            required
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={level.nameEn}
                            onChange={(e) => handleChange(index, 'nameEn', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="e.g. BG"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={level.description}
                            onChange={(e) => handleChange(index, 'description', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="คำอธิบายสั้นๆ"
                          />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <input
                            type="color"
                            value={level.color || DEFAULT_COLOR}
                            onChange={(e) => handleChange(index, 'color', e.target.value)}
                            className="w-10 h-8 rounded cursor-pointer border border-gray-300"
                          />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: level.color || DEFAULT_COLOR }}
                          >
                            {level.name || '...'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLevel(index)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบระดับนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={handleAddLevel}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                <Plus className="w-4 h-4" />
                เพิ่มระดับใหม่
              </button>
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
                variant="primary"
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

export default PlayerLevelsSettingsPage;
