import { X, Receipt, DollarSign, User, Phone, AlertCircle } from 'lucide-react';

export default function CheckoutConfirmModal({ player, onConfirm, onClose }) {
  if (!player) return null;

  const totalCost = player.totalCost || 0;
  const isPaid = player.paymentStatus === 'paid';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex items-center justify-between">
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
        <div className="px-6 py-6">
          {/* Player Info */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <User className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">ผู้เล่น</p>
                <p className="text-lg font-semibold text-gray-900">
                  {player.player?.name || 'ไม่ระบุชื่อ'}
                </p>
              </div>
            </div>
            {player.player?.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600 ml-16">
                <Phone size={14} />
                {player.player.phone}
              </div>
            )}
          </div>

          {/* Cost Summary */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700 font-medium">ยอดค่าใช้จ่ายทั้งหมด</span>
              <div className="flex items-center gap-2">
                <DollarSign className="text-purple-600" size={20} />
                <span className="text-2xl font-bold text-purple-700">
                  ฿{totalCost.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-purple-200">
              <span className="text-sm text-gray-600">สถานะการชำระเงิน</span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  isPaid
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {isPaid ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
              </span>
            </div>
          </div>

          {/* Warning for unpaid */}
          {!isPaid && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-amber-900 mb-1">ผู้เล่นยังไม่ได้ชำระเงิน</p>
                  <p className="text-sm text-amber-700">
                    กรุณาตรวจสอบการชำระเงินก่อน Check Out
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation message */}
          <div className="text-center mb-6">
            <p className="text-gray-600">
              ต้องการ Check Out ผู้เล่นนี้ใช่หรือไม่?
            </p>
            <p className="text-sm text-gray-500 mt-1">
              การดำเนินการนี้จะอัปเดตสถิติของผู้เล่น
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Receipt size={18} />
            ยืนยัน Check Out
          </button>
        </div>
      </div>
    </div>
  );
}
