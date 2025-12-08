import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Receipt } from 'lucide-react';
import { ROUTES } from '../../constants';

export default function BookingSuccessModal({ isOpen, booking, onClose }) {
  const navigate = useNavigate();

  if (!isOpen || !booking) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH').format(price);
  };

  const handleViewBookings = () => {
    navigate(ROUTES.CUSTOMER.MY_BOOKINGS);
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-blue-900 rounded-2xl w-full max-w-md p-6 border border-white/20 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-2">จองสำเร็จ!</h2>
        <p className="text-blue-200 mb-6">การจองของคุณได้รับการยืนยันแล้ว</p>

        {/* Booking Code */}
        <div className="bg-yellow-400/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-200 mb-1">รหัสการจอง</p>
          <p className="text-3xl font-bold text-yellow-400">{booking.bookingCode}</p>
        </div>

        {/* Details */}
        <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-blue-200">
              <Calendar className="w-5 h-5 text-yellow-400" />
              <span>{formatDate(booking.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-blue-200">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span>
                {booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}
                {booking.duration > 1 && ` (${booking.duration} ชม.)`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-blue-200">
              <Receipt className="w-5 h-5 text-yellow-400" />
              <span>{formatPrice(booking.pricing?.total || 0)} บาท</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="text-sm text-blue-300 mb-6">
          กรุณาแสดงรหัสการจองเมื่อมาถึงสนาม
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
          >
            ปิด
          </button>
          <button
            onClick={handleViewBookings}
            className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-lg transition-colors"
          >
            ดูประวัติการจอง
          </button>
        </div>
      </div>
    </div>
  );
}
