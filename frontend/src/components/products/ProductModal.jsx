import { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { productsAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const ProductModal = ({ product, onClose, onSuccess }) => {
  const isEdit = !!product;
  const [loading, setLoading] = useState(false);
  const [skuGenerating, setSkuGenerating] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'shuttlecock',
    price: 0,
    stock: 0,
    lowStockAlert: 10,
    status: 'active',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        category: product.category || 'shuttlecock',
        price: product.price || 0,
        stock: product.stock || 0,
        lowStockAlert: product.lowStockAlert || 10,
        status: product.status || 'active',
      });
      // Set existing image preview
      if (product.image) {
        setImagePreview(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${product.image}`);
      }
    }
  }, [product]);

  // Auto-generate SKU when category changes (only for new products)
  useEffect(() => {
    if (!isEdit && formData.category) {
      generateSKU(formData.category);
    }
  }, [formData.category, isEdit]);

  const generateSKU = async (category) => {
    try {
      setSkuGenerating(true);
      const response = await productsAPI.generateSKU(category);
      if (response.success) {
        setFormData((prev) => ({
          ...prev,
          sku: response.data.sku,
        }));
      }
    } catch (error) {
      console.error('Error generating SKU:', error);
      toast.error('ไม่สามารถสร้างรหัสสินค้าอัตโนมัติได้');
    } finally {
      setSkuGenerating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }

      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const validateForm = () => {
    if (!formData.sku.trim()) {
      toast.error('กรุณาระบุรหัสสินค้า (SKU)');
      return false;
    }

    if (!formData.name.trim()) {
      toast.error('กรุณาระบุชื่อสินค้า');
      return false;
    }

    if (formData.price < 0) {
      toast.error('ราคาต้องไม่ติดลบ');
      return false;
    }

    if (formData.stock < 0) {
      toast.error('จำนวนสต็อกต้องไม่ติดลบ');
      return false;
    }

    if (formData.lowStockAlert < 0) {
      toast.error('จำนวนเตือนสต็อกต้องไม่ติดลบ');
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

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('sku', formData.sku);
      submitData.append('name', formData.name);
      submitData.append('category', formData.category);
      submitData.append('price', formData.price);
      submitData.append('stock', formData.stock);
      submitData.append('lowStockAlert', formData.lowStockAlert);
      submitData.append('status', formData.status);

      // Add image if selected
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      let response;
      if (isEdit) {
        response = await productsAPI.update(product._id, submitData);
      } else {
        response = await productsAPI.create(submitData);
      }

      if (response.success) {
        toast.success(isEdit ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ');
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving product:', error);
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
            {isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
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
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รูปภาพสินค้า
            </label>

            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-40 h-40 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition cursor-pointer bg-gray-50">
                <label htmlFor="image-upload" className="cursor-pointer text-center p-4">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-600">อัปโหลดรูปภาพ</span>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              รองรับไฟล์ JPG, PNG, GIF (ขนาดไม่เกิน 5MB)
            </p>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อสินค้า <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="เช่น ลูกแบดมินตัน Yonex AS-40"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมวดหมู่ <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="shuttlecock">ลูกแบดมินตัน</option>
              <option value="drink">เครื่องดื่ม</option>
              <option value="snack">ขนม</option>
              <option value="equipment">อุปกรณ์</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ราคา (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนสต็อก <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Low Stock Alert */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เตือนเมื่อสต็อกต่ำกว่า <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="lowStockAlert"
              value={formData.lowStockAlert}
              onChange={handleChange}
              min="0"
              step="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              ระบบจะแจ้งเตือนเมื่อสต็อกต่ำกว่าจำนวนนี้
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะการขาย
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({
                  ...prev,
                  status: prev.status === 'active' ? 'inactive' : 'active'
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.status === 'active' ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${
                formData.status === 'active' ? 'text-green-700' : 'text-gray-600'
              }`}>
                {formData.status === 'active' ? 'เปิดขาย' : 'ปิดขาย'}
              </span>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
