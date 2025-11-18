import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft, Search, AlertTriangle, Package } from 'lucide-react';
import { productsAPI } from '../../../../lib/api';
import { ROUTES } from '../../../../constants';
import toast from 'react-hot-toast';
import ProductModal from '../../../../components/products/ProductModal';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
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
  const getCategoryLabel = (category) => {
    const labels = {
      shuttlecock: 'ลูกแบดมินตัน',
      drink: 'เครื่องดื่ม',
      snack: 'ขนม',
      equipment: 'อุปกรณ์',
      other: 'อื่นๆ',
    };
    return labels[category] || category;
  };

  // Category badge color
  const getCategoryBadge = (category) => {
    const badges = {
      shuttlecock: 'bg-blue-100 text-blue-800',
      drink: 'bg-cyan-100 text-cyan-800',
      snack: 'bg-orange-100 text-orange-800',
      equipment: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[category]}`}>
        {getCategoryLabel(category)}
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(ROUTES.ADMIN.DASHBOARD)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">จัดการสินค้า</h1>
            <p className="text-gray-600 text-sm">
              จัดการสินค้าและสต็อกทั้งหมด ({filteredProducts.length} รายการ)
            </p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          เพิ่มสินค้าใหม่
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า (ชื่อ หรือ SKU)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter by Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">หมวดหมู่ทั้งหมด</option>
            <option value="shuttlecock">ลูกแบดมินตัน</option>
            <option value="drink">เครื่องดื่ม</option>
            <option value="snack">ขนม</option>
            <option value="equipment">อุปกรณ์</option>
            <option value="other">อื่นๆ</option>
          </select>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">สถานะทั้งหมด</option>
            <option value="active">เปิดขาย</option>
            <option value="inactive">ปิดขาย</option>
          </select>
        </div>
      </div>

      {/* Low Stock Alert */}
      {products.filter(isLowStock).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">แจ้งเตือนสต็อกต่ำ</h3>
            <p className="text-sm text-yellow-700 mt-1">
              มีสินค้า {products.filter(isLowStock).length} รายการที่สต็อกต่ำกว่าจำนวนที่กำหนด
            </p>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
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
                          src={`${(import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')}${product.image}`}
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
                          <AlertTriangle className="w-4 h-4 text-yellow-600" title="สต็อกต่ำ" />
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
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition"
                          title="แก้ไข"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition"
                          title="ลบ"
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
      </div>

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={selectedProduct}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default ProductsPage;
