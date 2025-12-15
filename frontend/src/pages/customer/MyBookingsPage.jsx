import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Receipt, Upload, AlertCircle, CheckCircle, Clock3, CreditCard, Timer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customerBookingsAPI, playerAuthAPI } from '../../lib/api';
import SlipUploadModal from '../../components/customer/SlipUploadModal';
import { ROUTES } from '../../constants';

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showSlipUpload, setShowSlipUpload] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);

      // Verify token/session validity before fetching bookings
      try {
        await playerAuthAPI.getMe();
      } catch (meError) {
        // If getMe fails, we might have an invalid token, but we'll proceed
        // to let the main call handle it or fail gracefully
      }

      const response = await customerBookingsAPI.getMyBookings({
        status: filter !== 'all' ? filter : undefined,
      });

      if (response.success) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error('Load bookings error:', error);
      toast.error('ไม่สามารถโหลดประวัติการจองได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH').format(price);
  };

  const getStatusBadge = (status) => {
    const badges = {
      payment_pending: { bg: 'bg-orange-500', label: 'รอชำระเงิน' },
      confirmed: { bg: 'bg-blue-500', label: 'ยืนยันแล้ว' },
      'checked-in': { bg: 'bg-purple-500', label: 'เช็คอินแล้ว' },
      completed: { bg: 'bg-green-500', label: 'เสร็จสิ้น' },
      cancelled: { bg: 'bg-red-500', label: 'ยกเลิก' },
    };
    return badges[status] || { bg: 'bg-gray-500', label: status };
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'รอชำระ' },
      partial: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'ชำระบางส่วน' },
      paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'ชำระแล้ว' },
    };
    return badges[paymentStatus] || { bg: 'bg-gray-100', text: 'text-gray-700', label: paymentStatus };
  };

  const getSlipStatus = (booking) => {
    const status = booking.paymentSlip?.status;
    if (!status || status === 'none') return null;

    const statuses = {
      pending_verification: {
        icon: Clock3,
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        label: 'รอตรวจสอบสลิป',
      },
      verified: {
        icon: CheckCircle,
        bg: 'bg-green-50',
        text: 'text-green-700',
        label: 'สลิปถูกยืนยัน',
      },
      rejected: {
        icon: AlertCircle,
        bg: 'bg-red-50',
        text: 'text-red-700',
        label: 'สลิปถูกปฏิเสธ',
        reason: booking.paymentSlip?.rejectReason,
      },
    };
    return statuses[status];
  };

  const canUploadSlip = (booking) => {
    // Can upload if booking is not cancelled/completed and payment is not complete
    if (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'completed') {
      return false;
    }
    // Don't show upload button for payment_pending - use go to payment page instead
    if (booking.bookingStatus === 'payment_pending') {
      return false;
    }
    if (booking.paymentStatus === 'paid') {
      return false;
    }
    // Can re-upload if rejected
    if (booking.paymentSlip?.status === 'rejected') {
      return true;
    }
    // Can upload if no slip or slip not verified
    return !booking.paymentSlip?.status || booking.paymentSlip?.status === 'none';
  };

  // Check if booking is payment pending and can go to payment page
  const canGoToPayment = (booking) => {
    return booking.bookingStatus === 'payment_pending';
  };

  // Get remaining time for payment deadline
  const getRemainingTime = (paymentDeadline) => {
    if (!paymentDeadline) return null;
    const deadline = new Date(paymentDeadline).getTime();
    const now = Date.now();
    const diff = deadline - now;

    if (diff <= 0) return { expired: true };

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { minutes, seconds, expired: false };
  };

  // Handle go to payment page
  const handleGoToPayment = (bookingId) => {
    navigate(ROUTES.CUSTOMER.PAYMENT(bookingId));
  };

  const handleUploadClick = (booking) => {
    setSelectedBooking(booking);
    setShowSlipUpload(true);
  };

  const handleSlipUploadSuccess = (updatedBooking) => {
    toast.success('อัพโหลดสลิปสำเร็จ รอการตรวจสอบ');
    setShowSlipUpload(false);
    setSelectedBooking(null);
    loadBookings(); // Refresh list
  };

  const filters = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'payment_pending', label: 'รอชำระเงิน' },
    { value: 'confirmed', label: 'รอใช้บริการ' },
    { value: 'completed', label: 'เสร็จสิ้น' },
    { value: 'cancelled', label: 'ยกเลิก' },
  ];

  return (
    <div className="min-h-full p-4">
      <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">ประวัติการจอง</h1>
        <p className="text-gray-500 text-sm">ดูรายการจองของคุณ</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">ไม่พบรายการจอง</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const statusBadge = getStatusBadge(booking.bookingStatus);
            const paymentBadge = getPaymentStatusBadge(booking.paymentStatus);
            const slipStatus = getSlipStatus(booking);
            const showUploadButton = canUploadSlip(booking);
            const showPaymentButton = canGoToPayment(booking);
            const remainingTime = showPaymentButton ? getRemainingTime(booking.paymentDeadline) : null;

            return (
              <div
                key={booking._id}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                {/* Payment Deadline Banner for payment_pending */}
                {showPaymentButton && remainingTime && !remainingTime.expired && (
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 -m-4 mb-3 p-3 rounded-t-xl text-white text-center">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Timer className="w-4 h-4" />
                      <span>ชำระเงินภายใน</span>
                      <span className="font-bold text-lg">
                        {String(remainingTime.minutes).padStart(2, '0')}:{String(remainingTime.seconds).padStart(2, '0')}
                      </span>
                      <span>นาที</span>
                    </div>
                  </div>
                )}

                {/* Expired Banner */}
                {showPaymentButton && remainingTime?.expired && (
                  <div className="bg-red-100 -m-4 mb-3 p-3 rounded-t-xl text-red-700 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium">
                      <AlertCircle className="w-4 h-4" />
                      <span>หมดเวลาชำระเงิน - การจองจะถูกยกเลิก</span>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-600 font-bold">
                    {booking.bookingCode}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${paymentBadge.bg} ${paymentBadge.text}`}
                    >
                      {paymentBadge.label}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusBadge.bg}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(booking.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}
                      {booking.duration > 1 && ` (${booking.duration} ชม.)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {booking.court
                        ? `${booking.court.name || `Court ${booking.court.courtNumber}`}`
                        : 'รอกำหนดสนาม'}
                    </span>
                  </div>
                </div>

                {/* Slip Status */}
                {slipStatus && (
                  <div className={`mt-3 p-2 rounded-lg flex items-center gap-2 ${slipStatus.bg}`}>
                    <slipStatus.icon className={`w-4 h-4 ${slipStatus.text}`} />
                    <span className={`text-sm ${slipStatus.text}`}>
                      {slipStatus.label}
                      {slipStatus.reason && `: ${slipStatus.reason}`}
                    </span>
                  </div>
                )}

                {/* Price & Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-500 text-sm">ยอดรวม</span>
                    <span className="text-gray-800 font-bold">
                      {formatPrice(booking.pricing?.total || 0)} บาท
                    </span>
                  </div>

                  {/* Go to Payment Button for payment_pending */}
                  {showPaymentButton && remainingTime && !remainingTime.expired && (
                    <button
                      onClick={() => handleGoToPayment(booking._id)}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      ชำระเงิน
                    </button>
                  )}

                  {/* Upload Slip Button */}
                  {showUploadButton && (
                    <button
                      onClick={() => handleUploadClick(booking)}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {slipStatus?.label === 'สลิปถูกปฏิเสธ' ? 'อัพโหลดสลิปใหม่' : 'อัพโหลดสลิป'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Slip Upload Modal */}
      <SlipUploadModal
        isOpen={showSlipUpload}
        onClose={() => {
          setShowSlipUpload(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onSuccess={handleSlipUploadSuccess}
      />
    </div>
  );
}
