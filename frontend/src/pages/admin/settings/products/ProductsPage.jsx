import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft, Search, AlertTriangle, Package, Sparkles, TrendingUp } from 'lucide-react';
import { productsAPI, categoriesAPI } from '../../../../lib/api';
import { ROUTES } from '../../../../constants';
import toast from 'react-hot-toast';
import ProductModal from '../../../../components/products/ProductModal';
import { PageContainer, Card, PageHeader, Button } from '../../../../components/common';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('ไม่สามารถโหลดข้อมูลสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll({ isActive: true });
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDelete = async (product) => {
    if (
      !window.confirm(
        `คุณแน่ใจหรือไม่ที่จะลบสินค้า "${product.name}"?\n\nหมายเหตุ: การลบสินค้าจะไม่สามารถย้อนกลับได้`
      )
    ) {
      return;
    }

    try {
      const response = await productsAPI.delete(product._id);
      if (response.success) {
        toast.success('ลบสินค้าสำเร็จ');
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบสินค้า');
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  const handleModalSuccess = () => {
    fetchProducts();
    handleModalClose();
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = !filterCategory || product.category === filterCategory;
    const matchStatus = !filterStatus || product.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  // Category labels
  const getCategoryLabel = (categoryName) => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.label || categoryName;
  };

  // Category badge style
  const getCategoryStyle = (categoryName) => {
    const category = categories.find((c) => c.name === categoryName);
    const color = category?.color || '#6B7280';
    return {
      backgroundColor: color,
      color: '#FFFFFF',
    };
  };

  // Category badge
  const getCategoryBadge = (categoryName) => {
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={getCategoryStyle(categoryName)}
      >
        {getCategoryLabel(categoryName)}
      </span>
    );
  };

  // Status badge color
  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
    };
    const labels = {
      active: 'เปิดขาย',
      inactive: 'ปิดขาย',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Check if stock is low
  const isLowStock = (product) => {
    return product.stock <= product.lowStockAlert;
  };

  if (loading) {
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
    <PageContainer variant="full">
      <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="จัดการสินค้า"
        subtitle={`จัดการสินค้าและสต็อกทั้งหมด • ${filteredProducts.length} รายการ`}
        icon={Package}
        iconColor="purple"
        actions={
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่มสินค้าใหม่
          </button>
        }
      />

      {/* Search and Filters */}
      <Card padding="p-6" className="bg-white/80 backdrop-blur-sm border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="🔍 ค้นหาสินค้า (ชื่อ หรือ SKU)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
              />
            </div>

            {/* Filter by Category */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
            >
              <option value="">หมวดหมู่ทั้งหมด</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.label}
                </option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
            >
              <option value="">สถานะทั้งหมด</option>
              <option value="active">เปิดขาย</option>
              <option value="inactive">ปิดขาย</option>
            </select>
          </div>
      </Card>

      {/* Low Stock Alert */}
        {products.filter(isLowStock).length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-5 flex items-start gap-3 shadow-lg">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-yellow-800">แจ้งเตือนสต็อกต่ำ</h3>
              <p className="text-sm text-yellow-700 mt-1">
                มีสินค้า <span className="font-bold">{products.filter(isLowStock).length}</span> รายการที่สต็อกต่ำกว่าจำนวนที่กำหนด
              </p>
            </div>
          </div>
        )}

      {/* Products Table */}
      <Card padding="p-0" className="overflow-hidden bg-white/80 backdrop-blur-sm border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รูปภาพ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อสินค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หมวดหมู่
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ราคา
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สต็อก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-gray-300" />
                      <p>
                        {searchTerm || filterCategory || filterStatus
                          ? 'ไม่พบข้อมูลสินค้าที่ตรงกับเงื่อนไขการค้นหา'
                          : 'ยังไม่มีข้อมูลสินค้า'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product._id}
                    className={`hover:bg-gray-50 ${isLowStock(product) ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      {product.image ? (
                        <img
                          src={product.image.startsWith('data:') ? product.image : `${(import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')}${product.image}`}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{product.sku}</span>
                        {isLowStock(product) && (
                          <AlertTriangle className="tooltip w-4 h-4 text-yellow-600" data-tooltip="สต็อกต่ำ" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCategoryBadge(product.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        ฿{product.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div
                        className={`text-sm font-medium ${
                          isLowStock(product) ? 'text-yellow-600' : 'text-gray-900'
                        }`}
                      >
                        {product.stock.toLocaleString('th-TH')}
                      </div>
                      <div className="text-xs text-gray-500">
                        เตือนที่ {product.lowStockAlert.toLocaleString('th-TH')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="tooltip text-blue-600 hover:text-blue-700 p-2.5 hover:bg-blue-50 rounded-lg transition-all hover:shadow-md hover:scale-105"
                          data-tooltip="แก้ไข"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="tooltip text-red-600 hover:text-red-700 p-2.5 hover:bg-red-50 rounded-lg transition-all hover:shadow-md hover:scale-105"
                          data-tooltip="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
      </Card>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={selectedProduct}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
      </div>
    </PageContainer>
  );
};

export default ProductsPage;

