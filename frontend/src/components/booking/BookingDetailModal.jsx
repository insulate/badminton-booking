import { useState } from 'react';
import { X, Calendar, Clock, MapPin, User, Phone, Mail, CreditCard, DollarSign } from 'lucide-react';

/**
 * BookingDetailModal Component
 * Modal สำหรับแสดงและแก้ไขรายละเอียดการจอง
 */
const BookingDetailModal = ({ isOpen, onClose, booking, onUpdate, onUpdatePayment }) => {
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentStatus: booking.paymentStatus || 'pending',
    paymentMethod: booking.paymentMethod || 'cash',
    paidAmount: booking.pricing?.paidAmount || 0,
  });

  if (!isOpen || !booking) return null;

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'รอยืนยัน' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'ยืนยันแล้ว' },
      'checked-in': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'เช็คอินแล้ว' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'เสร็จสิ้น' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'ยกเลิก' },
    };
    return badges[status] || badges.pending;
  };

  // Get payment status badge
  const getPaymentBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'รอชำระ' },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'ชำระบางส่วน' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'ชำระแล้ว' },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'คืนเงิน' },
    };
    return badges[status] || badges.pending;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543;
    const dayName = days[date.getDay()];
    return `${dayName}ที่ ${day}/${month}/${year}`;
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Handle payment update
  const handleUpdatePayment = () => {
    onUpdatePayment(booking._id, paymentData);
    setIsEditingPayment(false);
  };

  const statusBadge = getStatusBadge(booking.bookingStatus);
  const paymentBadge = getPaymentBadge(booking.paymentStatus);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">รายละเอียดการจอง</h2>
              <p className="text-sm text-gray-600 mt-1">{booking.bookingCode}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="ปิดหน้าต่าง"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Section */}
            <div className="flex gap-4">
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">สถานะการจอง</p>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                >
                  {statusBadge.label}
                </span>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">สถานะการชำระเงิน</p>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${paymentBadge.bg} ${paymentBadge.text}`}
                >
                  {paymentBadge.label}
                </span>
              </div>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">ข้อมูลการจอง</h3>

                <div className="flex items-start gap-3">
                  <Calendar size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">วันที่จอง</p>
                    <p className="font-medium text-gray-900">{formatDate(booking.date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">เวลา</p>
                    <p className="font-medium text-gray-900">
                      {booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">สนาม</p>
                    <p className="font-medium text-gray-900">
                      {booking.court?.courtNumber} - {booking.court?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">ระยะเวลาเล่น</p>
                    <p className="font-medium text-gray-900">{booking.duration} ชั่วโมง</p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">ข้อมูลลูกค้า</h3>

                <div className="flex items-start gap-3">
                  <User size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">ชื่อ</p>
                    <p className="font-medium text-gray-900">{booking.customer?.name || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone size={20} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">เบอร์โทร</p>
                    <p className="font-medium text-gray-900">{booking.customer?.phone || '-'}</p>
                  </div>
                </div>

                {booking.customer?.email && (
                  <div className="flex items-start gap-3">
                    <Mail size={20} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">อีเมล</p>
                      <p className="font-medium text-gray-900">{booking.customer.email}</p>
                    </div>
                  </div>
                )}

                {booking.notes && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5"></div>
                    <div>
                      <p className="text-sm text-gray-600">หมายเหตุ</p>
                      <p className="font-medium text-gray-900">{booking.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">ข้อมูลการชำระเงิน</h3>
                {!isEditingPayment && (
                  <button
                    onClick={() => setIsEditingPayment(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    title="แก้ไขข้อมูลการชำระเงิน"
                  >
                    แก้ไข
                  </button>
                )}
              </div>

              {isEditingPayment ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      สถานะการชำระเงิน
                    </label>
                    <select
                      value={paymentData.paymentStatus}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, paymentStatus: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">รอชำระ</option>
                      <option value="partial">ชำระบางส่วน</option>
                      <option value="paid">ชำระแล้ว</option>
                      <option value="refunded">คืนเงิน</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วิธีการชำระเงิน
                    </label>
                    <select
                      value={paymentData.paymentMethod}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, paymentMethod: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cash">เงินสด</option>
                      <option value="bank_transfer">โอนเงิน</option>
                      <option value="qr_code">QR Code</option>
                      <option value="credit_card">บัตรเครดิต</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      จำนวนเงินที่ชำระ
                    </label>
                    <input
                      type="number"
                      value={paymentData.paidAmount}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, paidAmount: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdatePayment}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      title="บันทึกการเปลี่ยนแปลง"
                    >
                      บันทึก
                    </button>
                    <button
                      onClick={() => setIsEditingPayment(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="ยกเลิกการแก้ไข"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CreditCard size={20} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">วิธีการชำระเงิน</p>
                      <p className="font-medium text-gray-900">
                        {booking.paymentMethod === 'cash' && 'เงินสด'}
                        {booking.paymentMethod === 'bank_transfer' && 'โอนเงิน'}
                        {booking.paymentMethod === 'qr_code' && 'QR Code'}
                        {booking.paymentMethod === 'credit_card' && 'บัตรเครดิต'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign size={20} className="text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">จำนวนเงินที่ชำระ</p>
                      <p className="font-medium text-gray-900">
                        ฿{formatPrice(booking.pricing?.paidAmount || 0)} / ฿
                        {formatPrice(booking.pricing?.total || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">สรุปค่าใช้จ่าย</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ค่าเช่าสนาม</span>
                  <span className="font-medium">
                    ฿{formatPrice(booking.pricing?.subtotal || 0)}
                  </span>
                </div>
                {booking.pricing?.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ส่วนลด</span>
                    <span className="font-medium text-green-600">
                      -฿{formatPrice(booking.pricing.discount)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">ยอดรวมทั้งหมด</span>
                  <span className="font-bold text-lg text-blue-600">
                    ฿{formatPrice(booking.pricing?.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            {(booking.createdAt || booking.updatedAt) && (
              <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
                {booking.createdAt && (
                  <p>สร้างเมื่อ: {new Date(booking.createdAt).toLocaleString('th-TH')}</p>
                )}
                {booking.updatedAt && (
                  <p>อัปเดตล่าสุด: {new Date(booking.updatedAt).toLocaleString('th-TH')}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="ปิดหน้าต่าง"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
