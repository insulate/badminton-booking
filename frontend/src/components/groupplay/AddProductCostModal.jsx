import { useState, useEffect, useMemo } from 'react';
import { X, User, Phone, Package, Plus, Minus, ShoppingCart, Search, Filter } from 'lucide-react';
import { productsAPI, categoriesAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export default function AddProductCostModal({ player, sessionId, onClose, onSuccess }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        productsAPI.getAll({ status: 'active' }),
        categoriesAPI.getAll({ type: 'product' })
      ]);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        // Find the category from categories list to match by name
        const selectedCat = categories.find(c => c._id === selectedCategory);
        if (!selectedCat) return false;

        // Product.category is a string, match it with category.name
        const productCategory = typeof p.category === 'object' ? p.category?.name : p.category;
        return productCategory === selectedCat.name;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchTerm, categories]);

  const handleAddProduct = (product) => {
    const existing = selectedProducts.find(p => p._id === product._id);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p =>
        p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setSelectedProducts(selectedProducts.filter(p => p._id !== productId));
    } else {
      setSelectedProducts(selectedProducts.map(p =>
        p._id === productId ? { ...p, quantity: newQuantity } : p
      ));
    }
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  };

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) {
      toast.error('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ');
      return;
    }

    try {
      setSubmitting(true);
      const items = selectedProducts.map(p => ({
        product: p._id,
        quantity: p.quantity,
        price: p.price
      }));

      await onSuccess(sessionId, player._id, { items });
      toast.success('เพิ่มค่าใช้จ่ายสินค้าสำเร็จ');
      onClose();
    } catch (error) {
      console.error('Error adding product cost:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มค่าใช้จ่าย');
    } finally {
      setSubmitting(false);
    }
  };

  if (!player) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <ShoppingCart className="text-green-500" size={24} />
              เพิ่มค่าใช้จ่ายสินค้า
            </h2>
            <div className="mt-2">
              <p className="text-text-primary font-medium flex items-center gap-2">
                <User size={16} />
                {player.name}
              </p>
              <p className="text-sm text-text-secondary flex items-center gap-2">
                <Phone size={14} />
                {player.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-text-secondary">กำลังโหลดสินค้า...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product List */}
              <div>
                <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Package size={18} />
                  รายการสินค้า ({filteredProducts.length})
                </h3>

                {/* Search and Filter */}
                <div className="space-y-3 mb-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ค้นหาชื่อหรือรหัสสินค้า..."
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Category Filter */}
                  {categories.length > 0 && (
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="all">ทุกหมวดหมู่</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    <Package size={48} className="mx-auto mb-3 opacity-50" />
                    <p>ไม่มีสินค้า</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    <Package size={48} className="mx-auto mb-3 opacity-50" />
                    <p>ไม่พบสินค้าที่ค้นหา</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <div
                        key={product._id}
                        className="border border-slate-200 rounded-lg p-3 hover:border-green-300 hover:bg-green-50 transition-colors cursor-pointer"
                        onClick={() => handleAddProduct(product)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-text-primary">{product.name}</p>
                              {product.category?.name && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  {product.category.name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-text-secondary">
                              {product.sku && <span className="mr-2">รหัส: {product.sku}</span>}
                              คงเหลือ: {product.quantity} {product.unit || 'ชิ้น'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">฿{product.price}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddProduct(product);
                              }}
                              className="mt-1 p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Products */}
              <div>
                <h3 className="font-semibold text-text-primary mb-3">
                  สินค้าที่เลือก ({selectedProducts.length})
                </h3>
                {selectedProducts.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary border-2 border-dashed border-slate-300 rounded-lg">
                    <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
                    <p>ยังไม่ได้เลือกสินค้า</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedProducts.map((product) => (
                      <div
                        key={product._id}
                        className="border border-green-200 bg-green-50 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-text-primary">{product.name}</p>
                            <p className="text-sm text-text-secondary">
                              ฿{product.price} / {product.unit || 'ชิ้น'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleUpdateQuantity(product._id, 0)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(product._id, product.quantity - 1)}
                              className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) => handleUpdateQuantity(product._id, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 border border-slate-300 rounded text-center"
                            />
                            <button
                              onClick={() => handleUpdateQuantity(product._id, product.quantity + 1)}
                              className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <p className="font-semibold text-green-600">
                            ฿{(product.price * product.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="border-t-2 border-green-300 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-text-primary">ยอดรวม</span>
                        <span className="text-2xl font-bold text-green-600">
                          ฿{calculateTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-slate-300 text-text-primary rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedProducts.length === 0}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                เพิ่มค่าใช้จ่าย
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
