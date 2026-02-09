import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Receipt, Building2, Upload, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ROUTES } from '../../constants';
import { customerBookingsAPI } from '../../lib/api';
import PromptPayQR from './PromptPayQR';
import SlipUploadModal from './SlipUploadModal';

export default function BookingSuccessModal({ isOpen, booking, onClose }) {
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSlipUpload, setShowSlipUpload] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Fetch payment info
  useEffect(() => {
    if (isOpen) {
      fetchPaymentInfo();
    }
  }, [isOpen]);

  const fetchPaymentInfo = async () => {
    try {
      setLoading(true);
      const response = await customerBookingsAPI.getPaymentInfo();
      if (response.success) {
        setPaymentInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment info:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getBookingTimeRange = () => {
    if (!booking?.timeSlot?.startTime) return '';
    const [h, m] = booking.timeSlot.startTime.split(':').map(Number);
    const startMin = (booking.startMinute || 0);
    const totalStartMins = h * 60 + m + startMin;
    const totalEndMins = totalStartMins + (booking.duration || 1) * 60;
    const fmt = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    return `${fmt(totalStartMins)} - ${fmt(totalEndMins)}`;
  };

  const handleViewBookings = () => {
    navigate(ROUTES.CUSTOMER.MY_BOOKINGS);
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('คัดลอกแล้ว');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('ไม่สามารถคัดลอกได้');
    }
  };

  const handleSlipUploadSuccess = (updatedBooking) => {
    toast.success('อัพโหลดสลิปสำเร็จ รอการตรวจสอบ');
    setShowSlipUpload(false);
  };

  const hasPaymentMethod = paymentInfo?.acceptPromptPay || paymentInfo?.acceptTransfer;
  const totalAmount = booking.pricing?.total || 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl w-full max-w-md p-6 border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">จองสำเร็จ!</h2>
            <p className="text-gray-500 mb-6">การจองของคุณได้รับการยืนยันแล้ว</p>
          </div>

          {/* Booking Code */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-gray-500 mb-1">รหัสการจอง</p>
            <p className="text-3xl font-bold text-blue-600">{booking.bookingCode}</p>
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>{formatDate(booking.date)}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>
                  {getBookingTimeRange()}
                  {booking.duration !== 1 && ` (${booking.duration === 0.5 ? '30 นาที' : booking.duration % 1 === 0 ? `${booking.duration} ชม.` : `${Math.floor(booking.duration)} ชม. 30 น.`})`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Receipt className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-600">{formatPrice(totalAmount)} บาท</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {!loading && hasPaymentMethod && (
            <div className="border-t pt-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                ชำระเงิน
              </h3>

              {/* PromptPay QR */}
              {paymentInfo.acceptPromptPay && paymentInfo.promptPayNumber && (
                <div className="mb-6">
                  <PromptPayQR
                    promptPayNumber={paymentInfo.promptPayNumber}
                    amount={totalAmount}
                  />
                </div>
              )}

              {/* Bank Transfer */}
              {paymentInfo.acceptTransfer && paymentInfo.bankAccount?.accountNumber && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-800">โอนเงินผ่านธนาคาร</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">ธนาคาร</span>
                      <span className="font-medium">{paymentInfo.bankAccount.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">ชื่อบัญชี</span>
                      <span className="font-medium">{paymentInfo.bankAccount.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">เลขบัญชี</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono">{paymentInfo.bankAccount.accountNumber}</span>
                        <button
                          onClick={() => handleCopy(paymentInfo.bankAccount.accountNumber, 'account')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {copiedField === 'account' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-500">จำนวนเงิน</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">{formatPrice(totalAmount)} บาท</span>
                        <button
                          onClick={() => handleCopy(totalAmount.toString(), 'amount')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {copiedField === 'amount' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Slip Button */}
              <button
                onClick={() => setShowSlipUpload(true)}
                className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                อัพโหลดสลิปการโอนเงิน
              </button>
            </div>
          )}

          {/* Note */}
          <p className="text-sm text-gray-500 mb-6 text-center">
            กรุณาแสดงรหัสการจองเมื่อมาถึงสนาม
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              ปิด
            </button>
            <button
              onClick={handleViewBookings}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              ดูประวัติการจอง
            </button>
          </div>
        </div>
      </div>

      {/* Slip Upload Modal */}
      <SlipUploadModal
        isOpen={showSlipUpload}
        onClose={() => setShowSlipUpload(false)}
        booking={booking}
        onSuccess={handleSlipUploadSuccess}
      />
    </>
  );
}
