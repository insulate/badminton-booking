import { X, Calendar, Clock, User, Phone } from 'lucide-react';

export default function BookingConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  bookingData,
  player,
}) {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-blue-900 rounded-2xl w-full max-w-md p-6 border border-white/20">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-blue-300 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-white mb-6 text-center">
          ยืนยันการจอง
        </h2>

        {/* Booking Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3 text-blue-200">
            <Calendar className="w-5 h-5 text-yellow-400" />
            <span>{formatDate(bookingData.date)}</span>
          </div>
          <div className="flex items-center gap-3 text-blue-200">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span>
              {bookingData.startTime} - {bookingData.endTime} ({bookingData.duration === 0.5 ? '30 นาที' : bookingData.duration % 1 === 0 ? `${bookingData.duration} ชม.` : `${Math.floor(bookingData.duration)} ชม. 30 น.`})
            </span>
          </div>
        </div>

        {/* Player Info */}
        <div className="bg-white/10 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-yellow-400 mb-3">ข้อมูลผู้จอง</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white">
              <User className="w-4 h-4 text-blue-300" />
              <span>{player.name}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Phone className="w-4 h-4 text-blue-300" />
              <span>{player.phone}</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="bg-yellow-400/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-200">ราคารวม</span>
            <span className="text-2xl font-bold text-yellow-400">
              {formatPrice(bookingData.totalPrice)} บาท
            </span>
          </div>
          {player.isMember && (
            <p className="text-xs text-green-400 mt-1">* ราคาสมาชิก</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'กำลังจอง...' : 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  );
}
