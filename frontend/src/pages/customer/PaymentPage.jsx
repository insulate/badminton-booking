import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, AlertCircle, Upload, Image, Loader2, CheckCircle, Copy, Building2, CreditCard, Timer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customerBookingsAPI } from '../../lib/api';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [expired, setExpired] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Load booking and payment info
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [bookingRes, paymentRes] = await Promise.all([
          customerBookingsAPI.getBookingById(bookingId),
          customerBookingsAPI.getPaymentInfo(),
        ]);

        if (bookingRes.success) {
          const bookingData = bookingRes.data;
          setBooking(bookingData);

          // Check if already confirmed
          if (bookingData.bookingStatus === 'confirmed') {
            setUploadSuccess(true);
          }

          // Check if cancelled/expired
          if (bookingData.bookingStatus === 'cancelled') {
            setExpired(true);
            setError('การจองนี้ถูกยกเลิกแล้ว');
          }
        } else {
          setError('ไม่พบข้อมูลการจอง');
        }

        if (paymentRes.success) {
          setPaymentInfo(paymentRes.data);
        }
      } catch (err) {
        console.error('Load data error:', err);
        setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [bookingId]);

  // Countdown timer
  useEffect(() => {
    if (!booking?.paymentDeadline || booking.bookingStatus !== 'payment_pending') return;

    const updateTimer = () => {
      const deadline = new Date(booking.paymentDeadline).getTime();
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft(null);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  // File handling
  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('กรุณาเลือกไฟล์รูปภาพ (jpeg, jpg, png, gif, webp)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !booking?._id) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('slip', selectedFile);

      const response = await customerBookingsAPI.uploadSlip(booking._id, formData);

      if (response.success) {
        setUploadSuccess(true);
        toast.success('ชำระเงินสำเร็จ! การจองได้รับการยืนยันแล้ว');
      } else {
        toast.error(response.message || 'ไม่สามารถอัพโหลดสลิปได้');
      }
    } catch (err) {
      console.error('Upload slip error:', err);
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพโหลด');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}แล้ว`);
  };

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

  const generatePromptPayQR = () => {
    if (!paymentInfo?.promptPayNumber || !booking?.pricing?.total) return null;

    const promptPayNumber = paymentInfo.promptPayNumber.replace(/-/g, '');
    const amount = booking.pricing.total.toFixed(2);

    // PromptPay QR format (simplified)
    const qrData = `00020101021129370016A000000677010111${promptPayNumber.length === 10 ? '01' : '02'}${promptPayNumber.length}${promptPayNumber}5303764${amount ? `54${amount.length.toString().padStart(2, '0')}${amount}` : ''}5802TH6304`;

    return qrData;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !booking) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/booking')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            กลับไปจองใหม่
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (uploadSuccess) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">จองสำเร็จ!</h2>
          <p className="text-gray-600 mb-6">
            การจองของคุณได้รับการยืนยันแล้ว
          </p>

          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">รหัสการจอง</span>
                <span className="font-semibold text-blue-600">{booking?.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">วันที่</span>
                <span className="font-medium">{formatDate(booking?.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">เวลา</span>
                <span className="font-medium">
                  {booking?.timeSlot?.startTime} - {booking?.timeSlot?.endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ยอดชำระ</span>
                <span className="font-bold text-green-600">
                  {formatPrice(booking?.pricing?.total || 0)} บาท
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/my-bookings')}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              ดูการจองของฉัน
            </button>
            <button
              onClick={() => navigate('/booking')}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              จองเพิ่ม
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expired state
  if (expired) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Timer className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">หมดเวลาชำระเงิน</h2>
          <p className="text-gray-600 mb-6">
            การจองนี้ถูกยกเลิกเนื่องจากไม่ได้ชำระเงินภายในเวลาที่กำหนด
          </p>
          <button
            onClick={() => navigate('/booking')}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            จองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 p-4 pb-8">
      <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">ชำระเงิน</h1>
        <p className="text-gray-500 text-sm">โอนเงินและอัพโหลดสลิปเพื่อยืนยันการจอง</p>
      </div>

      {/* Countdown Timer */}
      {timeLeft && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center justify-center gap-2">
            <Timer className="w-5 h-5" />
            <span className="font-medium">กรุณาชำระเงินภายใน</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-4xl font-bold">
              {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-sm ml-2 opacity-80">นาที</span>
          </div>
        </div>
      )}

      {/* Booking Summary */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-blue-600 font-bold text-lg">{booking?.bookingCode}</span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
            รอชำระเงิน
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(booking?.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {booking?.timeSlot?.startTime} - {booking?.timeSlot?.endTime}
              {booking?.duration > 1 && ` (${booking.duration} ชม.)`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{booking?.court?.name || 'รอกำหนดสนาม'}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">ยอดที่ต้องชำระ</span>
            <span className="text-2xl font-bold text-blue-600">
              {formatPrice(booking?.pricing?.total || 0)} บาท
            </span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">ช่องทางการชำระเงิน</h3>

        {/* PromptPay QR */}
        {paymentInfo?.promptPayNumber && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium text-gray-700">พร้อมเพย์ (PromptPay)</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <QRCodeSVG
                value={generatePromptPayQR() || paymentInfo.promptPayNumber}
                size={180}
                level="M"
                className="mx-auto mb-3"
              />
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-semibold">{paymentInfo.promptPayNumber}</span>
                <button
                  onClick={() => copyToClipboard(paymentInfo.promptPayNumber, 'เลขพร้อมเพย์')}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bank Transfer */}
        {paymentInfo?.bankAccount?.accountNumber && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-medium text-gray-700">โอนผ่านธนาคาร</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">ธนาคาร</span>
                <span className="font-medium">{paymentInfo.bankAccount.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">เลขบัญชี</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{paymentInfo.bankAccount.accountNumber}</span>
                  <button
                    onClick={() => copyToClipboard(paymentInfo.bankAccount.accountNumber, 'เลขบัญชี')}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">ชื่อบัญชี</span>
                <span className="font-medium">{paymentInfo.bankAccount.accountName}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Slip */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">อัพโหลดหลักฐานการโอนเงิน</h3>

        <div
          className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {preview ? (
            <div className="text-center">
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg mb-3"
              />
              <p className="text-sm text-gray-600">{selectedFile?.name}</p>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-700"
              >
                เปลี่ยนรูป
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Image className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-1">ลากไฟล์มาวางที่นี่</p>
              <p className="text-sm text-gray-400">หรือคลิกเพื่อเลือกไฟล์</p>
              <p className="text-xs text-gray-400 mt-2">
                รองรับ: jpeg, jpg, png, gif, webp (ไม่เกิน 5MB)
              </p>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              กำลังยืนยันการชำระเงิน...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              ยืนยันการชำระเงิน
            </>
          )}
        </button>
      </div>

      {/* Cancel Link */}
      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/booking')}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ยกเลิกและกลับไปหน้าจอง
        </button>
      </div>
      </div>
    </div>
  );
}
