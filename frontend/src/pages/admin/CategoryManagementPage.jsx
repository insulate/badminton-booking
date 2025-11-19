import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Package,
  Plus,
  Search,
  Trash2,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { categoriesAPI } from '../../lib/api';

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    color: '#6B7280',
    order: 0,
    isActive: true,
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('ไม่สามารถโหลดหมวดหมู่ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories
  const filteredCategories = categories.filter((category) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      category.name.toLowerCase().includes(searchLower) ||
      category.label.toLowerCase().includes(searchLower)
    );
  });

  // Open modal for create
  const handleCreateClick = () => {
    setModalMode('create');
    setSelectedCategory(null);
    setFormData({
      name: '',
      label: '',
      color: '#6B7280',
      order: categories.length,
      isActive: true,
    });
    setModalOpen(true);
  };

  // Open modal for edit
  const handleEditClick = (category) => {
    setModalMode('edit');
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      label: category.label,
      color: category.color,
      order: category.order,
      isActive: category.isActive,
    });
    setModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.label) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      setLoading(true);

      if (modalMode === 'create') {
        const response = await categoriesAPI.create(formData);
        if (response.success) {
          toast.success('เพิ่มหมวดหมู่สำเร็จ');
          fetchCategories();
          setModalOpen(false);
        }
      } else {
        const response = await categoriesAPI.update(selectedCategory._id, formData);
        if (response.success) {
          toast.success('อัพเดทหมวดหมู่สำเร็จ');
          fetchCategories();
          setModalOpen(false);
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (categoryId) => {
    if (!window.confirm('คุณต้องการลบหมวดหมู่นี้หรือไม่?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await categoriesAPI.delete(categoryId);

      if (response.success) {
        toast.success('ลบหมวดหมู่สำเร็จ');
        fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-xl">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">จัดการหมวดหมู่สินค้า</h1>
            <p className="text-gray-600">เพิ่ม แก้ไข หรือลบหมวดหมู่สินค้า</p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาหมวดหมู่..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            onClick={handleCreateClick}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            เพิ่มหมวดหมู่ใหม่
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-4">กำลังโหลด...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">ไม่พบหมวดหมู่</p>
          <p className="text-gray-400 text-sm mt-2">เพิ่มหมวดหมู่ใหม่เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((category) => {
            return (
              <div
                key={category._id}
                className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-indigo-200 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: category.color }}
                  >
                    <span className="font-bold text-sm text-white">
                      {category.label}
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditClick(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{category.label}</h3>
                  <p className="text-sm text-gray-500 mb-3">({category.name})</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>ลำดับ: {category.order}</span>
                    <span
                      className={`px-2 py-1 rounded-full ${
                        category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {category.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {modalMode === 'create' ? 'เพิ่มหมวดหมู่ใหม่' : 'แก้ไขหมวดหมู่'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อภาษาอังกฤษ (ไม่ซ้ำ) *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น sportswear"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อภาษาไทย (แสดงบนหน้าจอ) *
                    </label>
                    <input
                      type="text"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="เช่น เสื้อผ้ากีฬา"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">สี</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#000000"
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                    <div
                      className="w-10 h-10 rounded-lg border-2 border-gray-200"
                      style={{ backgroundColor: formData.color }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">เลือกสีจาก color picker หรือใส่รหัสสี HEX</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ลำดับ</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                    <div className="flex items-center gap-4 mt-2.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isActive"
                          checked={formData.isActive === true}
                          onChange={() => setFormData({ ...formData, isActive: true })}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm text-gray-700">เปิดใช้งาน</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isActive"
                          checked={formData.isActive === false}
                          onChange={() => setFormData({ ...formData, isActive: false })}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm text-gray-700">ปิดใช้งาน</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>บันทึก</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
