import { useState } from 'react';
import { X, Receipt, DollarSign, User, Phone, ShoppingBag, Banknote, QrCode, Building2 } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'เงินสด', icon: Banknote, selectedClass: 'border-green-500 bg-green-50', iconClass: 'text-green-600', labelClass: 'text-green-700' },
  { value: 'promptpay', label: 'พร้อมเพย์', icon: QrCode, selectedClass: 'border-blue-500 bg-blue-50', iconClass: 'text-blue-600', labelClass: 'text-blue-700' },
  { value: 'bank_transfer', label: 'โอนเงิน', icon: Building2, selectedClass: 'border-purple-500 bg-purple-50', iconClass: 'text-purple-600', labelClass: 'text-purple-700' },
];

export default function CheckoutConfirmModal({ player, posSales = [], onConfirm, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState('');

  if (!player) return null;

  const groupPlayCost = player.totalCost || 0;
  const posSalesTotal = posSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const grandTotal = groupPlayCost + posSalesTotal;

  const parsedReceived = parseFloat(receivedAmount) || 0;
  const changeAmount = paymentMethod === 'cash' ? parsedReceived - grandTotal : 0;
  const isCashValid = paymentMethod !== 'cash' || parsedReceived >= grandTotal;

  const handleConfirm = () => {
    onConfirm({
      paymentMethod,
      receivedAmount: paymentMethod === 'cash' ? parsedReceived : null,
      posSaleIds: posSales.map(s => s._id),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Receipt className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-white">
              Check Out คิดเงิน
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {/* Player Info */}
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <User className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">ผู้เล่น</p>
                <p className="text-lg font-semibold text-gray-900">
                  {player.player?.name || player.name || 'ไม่ระบุชื่อ'}
                </p>
                {(player.player?.phone || player.phone) && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                    <Phone size={12} />
                    {player.player?.phone || player.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">ค่าก๊วน (เข้าร่วม + สินค้า)</span>
              <span className="font-semibold text-purple-700">฿{groupPlayCost.toFixed(2)}</span>
            </div>

            {posSalesTotal > 0 && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-orange-600" />
                    <span className="text-sm text-gray-600">สินค้าจาก POS</span>
                  </div>
                  <span className="font-semibold text-orange-600">฿{posSalesTotal.toFixed(2)}</span>
                </div>
                {/* POS Sale details */}
                <div className="ml-5 mb-2">
                  {posSales.map((sale, idx) => (
                    <div key={idx} className="text-xs text-gray-500">
                      {sale.saleCode}: {sale.items?.map(i => `${i.product?.name || 'สินค้า'} x${i.quantity}`).join(', ')} = ฿{(sale.total || 0).toFixed(2)}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-purple-200">
              <span className="text-gray-700 font-semibold">ยอดรวมทั้งหมด</span>
              <div className="flex items-center gap-2">
                <DollarSign className="text-purple-600" size={20} />
                <span className="text-2xl font-bold text-purple-700">
                  ฿{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-3">วิธีชำระเงิน</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? method.selectedClass
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <Icon size={20} className={isSelected ? method.iconClass : 'text-gray-400'} />
                    <span className={`text-xs font-medium ${isSelected ? method.labelClass : 'text-gray-500'}`}>
                      {method.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash received amount */}
          {paymentMethod === 'cash' && (
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                จำนวนเงินที่รับ
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">฿</span>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder={grandTotal.toFixed(2)}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold"
                  min="0"
                  step="1"
                />
              </div>
              {parsedReceived > 0 && parsedReceived >= grandTotal && (
                <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-green-700">เงินทอน</span>
                  <span className="font-bold text-green-700">฿{changeAmount.toFixed(2)}</span>
                </div>
              )}
              {parsedReceived > 0 && parsedReceived < grandTotal && (
                <p className="mt-1 text-xs text-red-500">จำนวนเงินไม่เพียงพอ (ต้องการ ฿{grandTotal.toFixed(2)})</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isCashValid}
            className={`px-6 py-2 rounded-lg transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2 ${
              isCashValid
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Receipt size={18} />
            ยืนยัน Check Out
          </button>
        </div>
      </div>
    </div>
  );
}
