import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Trash2, Plus, Minus, X, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productsAPI, salesAPI } from '../../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const POSPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll({ status: 'active' });
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('ไม่สามารถโหลดสินค้าได้');
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory && product.stock > 0;
  });

  // Add to cart
  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.product._id === product._id);

    if (existingItem) {
      // Check stock limit
      if (existingItem.quantity >= product.stock) {
        toast.error(`สต็อกสินค้าไม่เพียงพอ (เหลือ ${product.stock} ชิ้น)`);
        return;
      }
      updateQuantity(product._id, existingItem.quantity + 1);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          price: product.price,
          subtotal: product.price,
        },
      ]);
      toast.success(`เพิ่ม ${product.name} ลงตะกร้า`);
    }
  };

  // Update quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find((p) => p._id === productId);
    if (newQuantity > product.stock) {
      toast.error(`สต็อกสินค้าไม่เพียงพอ (เหลือ ${product.stock} ชิ้น)`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product._id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: item.price * newQuantity,
            }
          : item
      )
    );
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product._id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate total
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Get category label
  const getCategoryLabel = (category) => {
    const labels = {
      shuttlecock: 'ลูกแบด',
      drink: 'เครื่องดื่ม',
      snack: 'ขนม',
      equipment: 'อุปกรณ์',
      other: 'อื่นๆ',
    };
    return labels[category] || category;
  };

  // Get category badge color
  const getCategoryColor = (category) => {
    const colors = {
      shuttlecock: 'bg-blue-100 text-blue-800',
      drink: 'bg-green-100 text-green-800',
      snack: 'bg-yellow-100 text-yellow-800',
      equipment: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">POS - ขายสินค้า</h1>
              <p className="text-gray-600 text-sm mt-1">เลือกสินค้าเพื่อเพิ่มลงตะกร้า</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">{cart.length} รายการ</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="ค้นหาสินค้า (ชื่อ หรือ SKU)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Filter Buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setCategoryFilter('')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    categoryFilter === ''
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setCategoryFilter('shuttlecock')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    categoryFilter === 'shuttlecock'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  ลูกแบด
                </button>
                <button
                  onClick={() => setCategoryFilter('drink')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    categoryFilter === 'drink'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  เครื่องดื่ม
                </button>
                <button
                  onClick={() => setCategoryFilter('snack')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    categoryFilter === 'snack'
                      ? 'bg-yellow-600 text-white shadow-md'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  ขนม
                </button>
                <button
                  onClick={() => setCategoryFilter('equipment')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    categoryFilter === 'equipment'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                  }`}
                >
                  อุปกรณ์
                </button>
                <button
                  onClick={() => setCategoryFilter('other')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    categoryFilter === 'other'
                      ? 'bg-gray-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  อื่นๆ
                </button>
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">กำลังโหลดสินค้า...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">ไม่พบสินค้า</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => addToCart(product)}
                      className="border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                    >
                      {/* Product Image */}
                      {product.image ? (
                        <img
                          src={`${API_URL.replace('/api', '')}${product.image}`}
                          alt={product.name}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="text-xs text-gray-500 mb-1">{product.sku}</div>
                      <div className="font-semibold text-sm text-gray-800 mb-1 line-clamp-2">
                        {product.name}
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-full inline-block mb-2 ${getCategoryColor(product.category)}`}>
                        {getCategoryLabel(product.category)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-600 font-bold">฿{product.price.toFixed(2)}</span>
                        <span className="text-xs text-gray-500">คงเหลือ: {product.stock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">ตะกร้าสินค้า</h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    ล้าง
                  </button>
                )}
              </div>

              {/* Cart Items */}
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">ตะกร้าว่างเปล่า</p>
                  <p className="text-gray-400 text-sm">เลือกสินค้าเพื่อเริ่มขาย</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                    {cart.map((item) => (
                      <div
                        key={item.product._id}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-800">
                              {item.product.name}
                            </div>
                            <div className="text-xs text-gray-500">{item.product.sku}</div>
                            <div className="text-blue-600 font-semibold mt-1">
                              ฿{item.price.toFixed(2)}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product._id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="font-bold text-gray-800">
                            ฿{item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold text-gray-800">ยอดรวม</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ฿{total.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-5 h-5" />
                      ชำระเงิน
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          cart={cart}
          total={total}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            clearCart();
            setShowPaymentModal(false);
            fetchProducts(); // Refresh products to update stock
          }}
        />
      )}
    </div>
  );
};

// Payment Modal Component
const PaymentModal = ({ cart, total, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Prepare sale data
      const saleData = {
        items: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
        customer: customer.name || customer.phone ? { ...customer, type: 'walk-in' } : null,
        paymentMethod,
        total,
      };

      const response = await salesAPI.create(saleData);

      if (response.success) {
        toast.success('บันทึกการขายสำเร็จ');
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      console.error('Error response:', error.response?.data);
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || 'เกิดข้อผิดพลาดในการบันทึกการขาย';
      const errors = errorData?.errors;

      if (errors && Array.isArray(errors)) {
        toast.error(`${errorMessage}: ${errors.join(', ')}`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">ชำระเงิน</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Order Summary */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">สรุปรายการ</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product._id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.product.name} x {item.quantity}
                  </span>
                  <span className="font-semibold">฿{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-800">ยอดรวมทั้งหมด</span>
              <span className="text-2xl font-bold text-blue-600">฿{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Customer Info (Optional) */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">ข้อมูลลูกค้า (ไม่บังคับ)</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="ชื่อลูกค้า"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="tel"
                placeholder="เบอร์โทร"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">วิธีการชำระเงิน</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">เงินสด</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('promptpay')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'promptpay'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">พร้อมเพย์</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">โอนเงิน</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentMethod === 'credit_card'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">บัตรเครดิต</div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  <span>ยืนยันการชำระเงิน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default POSPage;
