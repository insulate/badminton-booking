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
  Tag,
  Sparkles,
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

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-cream p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 mb-6 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

          <div className="flex justify-between items-center relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Tag className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">จัดการหมวดหมู่สินค้า</h1>
              </div>
              <p className="text-blue-100 text-sm ml-14">
                เพิ่ม แก้ไข หรือลบหมวดหมู่สินค้า • {filteredCategories.length} รายการ
              </p>
            </div>
            <button
              onClick={handleCreateClick}
              className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all font-semibold flex items-center gap-2 shadow-lg border border-white/30"
            >
              <Plus className="w-5 h-5" />
              เพิ่มหมวดหมู่ใหม่
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="🔍 ค้นหาหมวดหมู่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">ไม่พบหมวดหมู่</p>
            <p className="text-gray-400 text-sm">
              {searchTerm ? 'ไม่พบหมวดหมู่ที่ตรงกับเงื่อนไขการค้นหา' : 'เพิ่มหมวดหมู่ใหม่เพื่อเริ่มต้น'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category) => {
              return (
                <div
                  key={category._id}
                  className="bg-white/90 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-6 hover:border-blue-300 hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="px-4 py-2 rounded-xl shadow-lg"
                      style={{ backgroundColor: category.color }}
                    >
                      <span className="font-bold text-sm text-white">
                        {category.label}
                      </span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={() => handleEditClick(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110 shadow-md hover:shadow-lg"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110 shadow-md hover:shadow-lg"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{category.label}</h3>
                    <p className="text-sm text-gray-500 mb-3 font-mono">({category.name})</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">ลำดับ: {category.order}</span>
                      <span
                        className={`px-3 py-1 rounded-full font-medium ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
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
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
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
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">เปิดใช้งาน</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="isActive"
                            checked={formData.isActive === false}
                            onChange={() => setFormData({ ...formData, isActive: false })}
                            className="w-4 h-4 text-blue-600"
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
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
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
    </div>
  );
}


