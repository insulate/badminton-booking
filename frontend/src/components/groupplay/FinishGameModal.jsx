import { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsAPI } from '../../lib/api';

export default function FinishGameModal({ session, gameId, onClose, onSuccess }) {
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ status: 'active', category: 'shuttlecock' });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดสินค้า');
    }
  };

  const addItem = (product) => {
    const existingItem = selectedItems.find(item => item.product._id === product._id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.product._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        product,
        quantity: 1,
        price: product.price,
      }]);
    }
  };

  const updateQuantity = (productId, change) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.product._id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (productId) => {
    setSelectedItems(selectedItems.filter(item => item.product._id !== productId));
  };

  const totalCost = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinishGame = async () => {
    if (selectedItems.length === 0) {
      toast.error('กรุณาเลือกลูกขนไก่อย่างน้อย 1 รายการ');
      return;
    }

    setLoading(true);
    try {
      const items = selectedItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price,
      }));

      await onSuccess(session._id, gameId, { items });
      toast.success('บันทึกการจบเกมสำเร็จ!');
      onClose();
    } catch (error) {
      console.error('Error finishing game:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการจบเกม');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">จบเกม</h2>
            <p className="text-sm text-text-secondary mt-1">
              เลือกลูกขนไก่ที่ใช้ในเกมนี้ (ถ้ามี)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product List */}
            <div>
              <h3 className="font-medium text-text-primary mb-3">ลูกขนไก่</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    ไม่มีลูกขนไก่ในระบบ
                  </div>
                ) : (
                  products
                    .sort((a, b) => a.price - b.price)
                    .map(product => (
                  <button
                    key={product._id}
                    onClick={() => addItem(product)}
                    className="w-full p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text-primary">{product.name}</p>
                        <p className="text-sm text-text-secondary">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary-blue">฿{product.price}</p>
                        <p className="text-xs text-text-secondary">คงเหลือ: {product.stock}</p>
                      </div>
                    </div>
                  </button>
                  ))
                )}
              </div>
            </div>

            {/* Selected Items */}
            <div>
              <h3 className="font-medium text-text-primary mb-3">
                ลูกขนไก่ที่เลือก ({selectedItems.length})
              </h3>
              {selectedItems.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  ยังไม่ได้เลือกลูกขนไก่
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-text-primary">{item.product.name}</p>
                          <p className="text-sm text-text-secondary">฿{item.price} x {item.quantity}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product._id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product._id, -1)}
                            className="p-1 border border-slate-300 rounded hover:bg-slate-50"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product._id, 1)}
                            className="p-1 border border-slate-300 rounded hover:bg-slate-50"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <p className="font-medium text-green-600">
                          ฿{item.price * item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>รวมทั้งหมด:</span>
                      <span className="text-green-600">฿{totalCost}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-text-primary rounded-lg hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleFinishGame}
              className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || selectedItems.length === 0}
            >
              {loading ? 'กำลังบันทึก...' : 'จบเกม'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
