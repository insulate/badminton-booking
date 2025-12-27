import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Trash2,
  Plus,
  Minus,
  X,
  DollarSign,
  Package,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productsAPI, salesAPI, categoriesAPI, settingsAPI, shiftsAPI } from '../../lib/api';
import { PageContainer, PageHeader } from '../../components/common';
import { ROUTES } from '../../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const POSPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Shift state
  const [currentShift, setCurrentShift] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(true);
  const [showNoShiftModal, setShowNoShiftModal] = useState(false);

  // Fetch current shift status
  const fetchCurrentShift = async () => {
    try {
      setShiftLoading(true);
      const response = await shiftsAPI.getCurrent();
      if (response.success && response.data) {
        setCurrentShift(response.data);
        setShowNoShiftModal(false);
      } else {
        setCurrentShift(null);
        setShowNoShiftModal(true);
      }
    } catch (error) {
      console.error('Error fetching current shift:', error);
      setCurrentShift(null);
      setShowNoShiftModal(true);
    } finally {
      setShiftLoading(false);
    }
  };

  // Fetch products and categories
  useEffect(() => {
    fetchCurrentShift();
    fetchProducts();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll({ isActive: true });
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('ไม่สามารถโหลดหมวดหมู่ได้');
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
  const getCategoryLabel = (categoryName) => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.label || categoryName;
  };

  // Get category badge style
  const getCategoryStyle = (categoryName) => {
    const category = categories.find((c) => c.name === categoryName);
    const color = category?.color || '#6B7280';
    return {
      backgroundColor: color,
      color: '#FFFFFF',
    };
  };

  return (
    <PageContainer variant="full"><div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="POS - ขายสินค้า"
          subtitle="เลือกสินค้าเพื่อเพิ่มลงตะกร้า"
          icon={ShoppingCart}
          iconColor="green"
          actions={
            <div className="flex items-center gap-3 bg-green-50 px-6 py-3 rounded-xl border border-green-200">
              <ShoppingCart className="w-6 h-6 text-green-600" />
              <div className="text-right">
                <div className="text-green-600 text-xs">รายการในตะกร้า</div>
                <div className="text-green-600 font-bold text-xl">{cart.length}</div>
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
              {/* Search */}
              <div className="mb-5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="🔍 ค้นหาสินค้า (ชื่อ หรือ SKU)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
                  />
                </div>
              </div>

              {/* Category Filter Buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setCategoryFilter('')}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    categoryFilter === ''
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50 scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  ทั้งหมด
                </button>
                {categories.map((category) => {
                  const isActive = categoryFilter === category.name;
                  const color = category.color || '#6B7280';

                  return (
                    <button
                      key={category._id}
                      onClick={() => setCategoryFilter(category.name)}
                      className="px-5 py-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-105 text-white"
                      style={
                        isActive
                          ? {
                              backgroundColor: color,
                              boxShadow: `0 10px 15px -3px ${color}80`,
                              transform: 'scale(1.05)',
                            }
                          : {
                              backgroundColor: color,
                              opacity: 0.7,
                            }
                      }
                    >
                      {category.label}
                    </button>
                  );
                })}
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">กำลังโหลดสินค้า...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium text-lg">ไม่พบสินค้า</p>
                  <p className="text-gray-400 text-sm mt-2">ลองค้นหาด้วยคำอื่นหรือเปลี่ยนหมวดหมู่</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => addToCart(product)}
                      className="group relative bg-white border-2 border-gray-100 rounded-2xl p-3 hover:border-blue-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      {/* Stock Badge */}
                      {product.stock <= 10 && (
                        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                          <TrendingUp className="w-3 h-3" />
                          เหลือน้อย
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="relative overflow-hidden rounded-xl mb-3">
                        {product.image ? (
                          <img
                            src={product.image.startsWith('data:') ? product.image : `${API_URL.replace('/api', '')}${product.image}`}
                            alt={product.name}
                            className="w-full h-28 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-blue-50 group-hover:to-purple-50 transition-all">
                            <ShoppingCart className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                        )}
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>

                      {/* Product Info */}
                      <div className="text-xs text-gray-400 mb-1 font-medium">{product.sku}</div>
                      <div className="font-bold text-sm text-gray-800 mb-2 line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </div>
                      <div
                        className="text-xs px-2.5 py-1 rounded-full inline-block mb-3 font-medium"
                        style={getCategoryStyle(product.category)}
                      >
                        {getCategoryLabel(product.category)}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-blue-600 font-bold text-lg">฿{product.price.toFixed(2)}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          คงเหลือ {product.stock}
                        </span>
                      </div>

                      {/* Click indicator */}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-6 h-6 text-blue-600 bg-blue-100 rounded-full p-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 sticky top-4 border-2 border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ตะกร้าสินค้า
                  </h2>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    ล้างทั้งหมด
                  </button>
                )}
              </div>

              {/* Cart Items */}
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium text-lg">ตะกร้าว่างเปล่า</p>
                  <p className="text-gray-400 text-sm mt-2">เลือกสินค้าเพื่อเริ่มขาย</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto mb-5 pr-2">
                    {cart.map((item) => (
                      <div
                        key={item.product._id}
                        className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="font-bold text-sm text-gray-800 mb-1">
                              {item.product.name}
                            </div>
                            <div className="text-xs text-gray-400 font-medium">{item.product.sku}</div>
                            <div className="text-blue-600 font-bold mt-1.5">
                              ฿{item.price.toFixed(2)} <span className="text-gray-400 text-xs font-normal">/ ชิ้น</span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product._id)}
                            className="tooltip tooltip-left text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                            data-tooltip="ลบจากตะกร้า"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                              className="w-8 h-8 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-600 border border-gray-200 flex items-center justify-center transition-all shadow-sm"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center font-bold text-lg">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                              className="w-8 h-8 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-600 border border-gray-200 flex items-center justify-center transition-all shadow-sm"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ฿{item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t-2 border-gray-200 pt-5">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-gray-700">ยอดรวมทั้งหมด</span>
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ฿{total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold text-lg flex items-center justify-center gap-2 shadow-lg"
                    >
                      <DollarSign className="w-6 h-6" />
                      ชำระเงิน
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      {/* No Shift Modal - บังคับเปิดกะก่อนขาย */}
      {showNoShiftModal && !shiftLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">กรุณาเปิดกะก่อน</h2>
                  <p className="text-white/80 text-sm">ต้องเปิดกะก่อนจึงจะขายสินค้าได้</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-medium">ทำไมต้องเปิดกะ?</p>
                    <ul className="text-amber-700 text-sm mt-2 space-y-1">
                      <li>• ระบบจะติดตามยอดขายของคุณ</li>
                      <li>• บันทึกเงินเปิดกะสำหรับเช็คเงินตอนปิดกะ</li>
                      <li>• ช่วยให้การเช็คเงินถูกต้องแม่นยำ</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(ROUTES.ADMIN.DASHBOARD)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  กลับหน้าหลัก
                </button>
                <button
                  onClick={() => navigate(ROUTES.ADMIN.SHIFTS)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg"
                >
                  <Clock className="w-5 h-5" />
                  ไปเปิดกะ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </PageContainer>
  );
};

// Payment Modal Component
const PaymentModal = ({ cart, total, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState('');

  // Quick Cash amounts
  const QUICK_CASH_AMOUNTS = [20, 50, 100, 500, 1000];

  // Calculate change amount
  const changeAmount = useMemo(() => {
    const received = parseFloat(receivedAmount) || 0;
    return received >= total ? received - total : 0;
  }, [receivedAmount, total]);

  // Check if received amount is valid
  const isReceivedValid = useMemo(() => {
    if (paymentMethod !== 'cash') return true;
    const received = parseFloat(receivedAmount) || 0;
    return received >= total;
  }, [paymentMethod, receivedAmount, total]);

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await settingsAPI.get();
        if (response.success && response.data.payment) {
          setPaymentSettings(response.data.payment);
          // Set default payment method to first available option
          const availableMethods = getAvailablePaymentMethods(response.data.payment);
          if (availableMethods.length > 0) {
            setPaymentMethod(availableMethods[0].value);
          }
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
      }
    };

    fetchPaymentSettings();
  }, []);

  // Get available payment methods based on settings
  const getAvailablePaymentMethods = (settings) => {
    if (!settings) return [];

    const methods = [];
    if (settings.acceptCash) methods.push({ value: 'cash', label: 'เงินสด' });
    if (settings.acceptPromptPay) methods.push({ value: 'promptpay', label: 'พร้อมเพย์' });
    if (settings.acceptTransfer) methods.push({ value: 'transfer', label: 'โอนเงิน' });
    if (settings.acceptCreditCard) methods.push({ value: 'credit_card', label: 'บัตรเครดิต' });
    return methods;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate cash payment
    if (paymentMethod === 'cash' && !isReceivedValid) {
      toast.error('กรุณากรอกจำนวนเงินที่รับให้ถูกต้อง');
      return;
    }

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
        // Send receivedAmount only for cash payment
        ...(paymentMethod === 'cash' && receivedAmount && {
          receivedAmount: parseFloat(receivedAmount)
        }),
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
            className="tooltip text-gray-400 hover:text-gray-600 transition-colors"
            data-tooltip="ปิด"
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
            {paymentSettings && getAvailablePaymentMethods(paymentSettings).length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {getAvailablePaymentMethods(paymentSettings).map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      paymentMethod === method.value
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold">{method.label}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                ไม่มีวิธีการชำระเงินที่ใช้งานได้
              </div>
            )}
          </div>

          {/* Cash Payment Section */}
          {paymentMethod === 'cash' && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">รับเงิน</h3>

              {/* Quick Cash Buttons */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {QUICK_CASH_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setReceivedAmount(String(amount))}
                    className={`py-3 rounded-lg border-2 font-semibold transition-all ${
                      parseFloat(receivedAmount) === amount
                        ? 'border-green-600 bg-green-50 text-green-600'
                        : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              {/* Exact Amount Button */}
              <button
                type="button"
                onClick={() => setReceivedAmount(String(total))}
                className="w-full mb-4 py-3 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-600 font-semibold hover:border-blue-400 transition-all"
              >
                พอดี ({total.toFixed(2)})
              </button>

              {/* Manual Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">฿</span>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="กรอกจำนวนเงินที่รับ"
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Change Display */}
              {parseFloat(receivedAmount) > 0 && (
                <div className={`mt-4 p-4 rounded-xl ${isReceivedValid ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">เงินทอน</span>
                    <span className={`text-2xl font-bold ${isReceivedValid ? 'text-green-600' : 'text-red-600'}`}>
                      {isReceivedValid ? `฿${changeAmount.toFixed(2)}` : 'เงินไม่พอ'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

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
              disabled={loading || (paymentMethod === 'cash' && !isReceivedValid)}
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
