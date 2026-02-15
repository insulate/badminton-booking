import { useState, useEffect } from 'react';
import { X, Image, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productsAPI } from '../../lib/api';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').trim();

const ProductModal = ({ product, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    price: '',
    stock: '',
    lowStockAlert: 5,
    status: 'active'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingSKU, setGeneratingSKU] = useState(false);

  const isEditMode = !!product;

  // Initialize form for edit mode
  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        category: product.category || '',
        price: product.price || '',
        stock: product.stock || '',
        lowStockAlert: product.lowStockAlert || 5,
        status: product.status || 'active'
      });

      // Set existing image preview
      if (product.image) {
        const imageUrl = product.image.startsWith('data:')
          ? product.image
          : `${(API_URL || 'http://localhost:3000/api').replace('/api', '')}${product.image}`;
        setImagePreview(imageUrl);
      }
    }
  }, [product]);

  // Auto-generate SKU when category changes (add mode only)
  useEffect(() => {
    if (!isEditMode && formData.category && !formData.sku) {
      handleGenerateSKU(formData.category);
    }
  }, [formData.category, isEditMode]);

  // Generate SKU based on category
  const handleGenerateSKU = async (category) => {
    if (!category) return;

    try {
      setGeneratingSKU(true);
      const response = await productsAPI.generateSKU(category);

      if (response.success) {
        setFormData(prev => ({ ...prev, sku: response.data.sku }));
      }
    } catch (error) {
      console.error('Error generating SKU:', error);
      toast.error('ไม่สามารถสร้าง SKU อัตโนมัติได้');
    } finally {
      setGeneratingSKU(false);
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }

      // Validate file size (max 5MB)
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

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setFormData(prev => ({
      ...prev,
      category,
      sku: '' // Reset SKU when category changes
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.sku.trim()) {
      toast.error('กรุณากรอก SKU');
      return false;
    }
    if (!formData.name.trim()) {
      toast.error('กรุณากรอกชื่อสินค้า');
      return false;
    }
    if (!formData.category) {
      toast.error('กรุณาเลือกหมวดหมู่');
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('กรุณากรอกราคาที่ถูกต้อง');
      return false;
    }
    if (!formData.stock || formData.stock < 0) {
      toast.error('กรุณากรอกจำนวนสต็อกที่ถูกต้อง');
      return false;
    }
    if (!formData.lowStockAlert || formData.lowStockAlert < 0) {
      toast.error('กรุณากรอกจำนวนแจ้งเตือนสต็อกต่ำที่ถูกต้อง');
      return false;
    }
    return true;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      // Prepare FormData for multipart upload
      const submitData = new FormData();
      submitData.append('sku', formData.sku.toUpperCase());
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
      if (isEditMode) {
        // Update product
        response = await productsAPI.update(product._id, submitData);
      } else {
        // Create product
        response = await productsAPI.create(submitData);
      }

      if (response.success) {
        toast.success(isEditMode ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ');
        if (onSuccess) {
          onSuccess();
        } else if (onClose) {
          onClose(true);
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0] || 'เกิดข้อผิดพลาด';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle remove image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditMode ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รูปภาพสินค้า
            </label>
            <div className="flex items-start gap-4">
              {/* Image Preview */}
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <Image className="text-gray-400 w-12 h-12" />
                </div>
              )}

              {/* Upload Button */}
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>เลือกรูปภาพ</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  รองรับไฟล์: JPG, PNG, GIF (ไม่เกิน 5MB)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                disabled={isEditMode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">เลือกหมวดหมู่</option>
                <option value="shuttlecock">ลูกแบด</option>
                <option value="beverage">เครื่องดื่ม</option>
                <option value="snack">ขนม</option>
                <option value="equipment">อุปกรณ์</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  disabled={isEditMode || generatingSKU}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                  placeholder="เช่น SHT-001"
                  required
                />
                {generatingSKU && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {!isEditMode && (
                <p className="text-xs text-gray-500 mt-1">
                  SKU จะถูกสร้างอัตโนมัติเมื่อเลือกหมวดหมู่
                </p>
              )}
            </div>

            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อสินค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ชื่อสินค้า"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ราคา (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนสต็อก <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
                required
              />
            </div>

            {/* Low Stock Alert */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                แจ้งเตือนสต็อกต่ำ <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="lowStockAlert"
                value={formData.lowStockAlert}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5"
                min="0"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                แจ้งเตือนเมื่อสต็อกต่ำกว่าหรือเท่ากับจำนวนนี้
              </p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="active">เปิดใช้งาน</option>
                <option value="inactive">ปิดใช้งาน</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading || generatingSKU}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>{isEditMode ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
