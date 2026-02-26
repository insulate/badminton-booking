import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, MapPin, User, Phone, Mail, CreditCard, DollarSign, Image, CheckCircle, XCircle, Clock3, ShoppingCart, Plus, Trash2, Receipt, Minus, Search, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { settingsAPI, bookingsAPI, courtsAPI, salesAPI, productsAPI } from '../../lib/api';

// ใช้ base URL สำหรับ static files (ไม่มี /api)
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').trim().replace('/api', '');

/**
 * BookingDetailModal Component
 * Modal สำหรับแสดงและแก้ไขรายละเอียดการจอง
 */
const BookingDetailModal = ({ isOpen, onClose, booking, onUpdate, onUpdatePayment }) => {
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: booking?.paymentMethod || 'cash',
    amountPaid: 0,
  });
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showSlipPreview, setShowSlipPreview] = useState(false);
  const [isAssigningCourt, setIsAssigningCourt] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [allCourts, setAllCourts] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Tab/linked sales state
  const [linkedSales, setLinkedSales] = useState([]);
  const [salesSummary, setSalesSummary] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);

  // Fetch linked sales for this booking
  const fetchLinkedSales = async () => {
    if (!booking?._id) return;
    setSalesLoading(true);
    try {
      const response = await salesAPI.getByBooking(booking._id);
      if (response.success) {
        setLinkedSales(response.data || []);
        setSalesSummary(response.summary || null);
      }
    } catch (error) {
      console.error('Error fetching linked sales:', error);
    } finally {
      setSalesLoading(false);
    }
  };

  // Fetch courts for assignment
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const response = await courtsAPI.getAll();
        if (response.success) {
          setAllCourts(response.data);
        }
      } catch (error) {
        console.error('Error fetching courts:', error);
      }
    };

    if (isOpen) {
      fetchCourts();
      fetchLinkedSales();
    }
  }, [isOpen, booking?._id]);

  // Handle assign court
  const handleAssignCourt = async () => {
    if (!selectedCourtId) {
      toast.error('กรุณาเลือกสนาม');
      return;
    }
    try {
      setAssignLoading(true);
      const response = await bookingsAPI.assignCourt(booking._id, selectedCourtId);
      if (response.success) {
        toast.success('กำหนดสนามสำเร็จ');
        setIsAssigningCourt(false);
        setSelectedCourtId('');
        onUpdate?.(response.data);
      } else {
        toast.error(response.message || 'ไม่สามารถกำหนดสนามได้');
      }
    } catch (error) {
      console.error('Assign court error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการกำหนดสนาม');
    } finally {
      setAssignLoading(false);
    }
  };

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await settingsAPI.get();
        if (response.success && response.data.payment) {
          setPaymentSettings(response.data.payment);
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
      }
    };

    if (isOpen) {
      fetchPaymentSettings();
    }
  }, [isOpen]);

  // Get available payment methods based on settings
  const getAvailablePaymentMethods = (settings) => {
    if (!settings) return [];

    const methods = [];
    if (settings.acceptCash) methods.push({ value: 'cash', label: 'เงินสด' });
    if (settings.acceptTransfer) methods.push({ value: 'transfer', label: 'โอนเงิน' });
    if (settings.acceptPromptPay) methods.push({ value: 'qr', label: 'QR Code' });
    if (settings.acceptCreditCard) methods.push({ value: 'card', label: 'บัตรเครดิต' });
    return methods;
  };

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

  // Get slip status badge
  const getSlipStatusBadge = (status) => {
    const badges = {
      none: null,
      pending_verification: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock3, label: 'รอตรวจสอบ' },
      verified: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'ยืนยันแล้ว' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'ถูกปฏิเสธ' },
    };
    return badges[status] || null;
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

  const getBookingTimeRange = () => {
    if (!booking?.timeSlot?.startTime) return '';
    const [h, m] = booking.timeSlot.startTime.split(':').map(Number);
    const startMin = (booking.startMinute || 0);
    const totalStartMins = h * 60 + m + startMin;
    const totalEndMins = totalStartMins + (booking.duration || 1) * 60;
    const fmt = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    return `${fmt(totalStartMins)} - ${fmt(totalEndMins)}`;
  };

  // Handle payment update
  const handleUpdatePayment = () => {
    onUpdatePayment(booking._id, paymentData);
    setIsEditingPayment(false);
  };

  // Handle verify slip
  const handleVerifySlip = async () => {
    try {
      setVerifyLoading(true);
      const response = await bookingsAPI.verifySlip(booking._id, 'verify');
      if (response.success) {
        toast.success('ยืนยันสลิปสำเร็จ');
        onUpdate?.(response.data);
        onClose();
      } else {
        toast.error(response.message || 'ไม่สามารถยืนยันสลิปได้');
      }
    } catch (error) {
      console.error('Verify slip error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle reject slip
  const handleRejectSlip = async () => {
    if (!rejectReason.trim()) {
      toast.error('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    try {
      setVerifyLoading(true);
      const response = await bookingsAPI.verifySlip(booking._id, 'reject', rejectReason);
      if (response.success) {
        toast.success('ปฏิเสธสลิปสำเร็จ');
        setShowRejectModal(false);
        setRejectReason('');
        onUpdate?.(response.data);
        onClose();
      } else {
        toast.error(response.message || 'ไม่สามารถปฏิเสธสลิปได้');
      }
    } catch (error) {
      console.error('Reject slip error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle void a pending sale
  const handleVoidSale = async (saleId) => {
    if (!confirm('ต้องการยกเลิกรายการนี้? (สต็อกจะถูกคืน)')) return;
    try {
      const response = await salesAPI.void(saleId);
      if (response.success) {
        toast.success('ยกเลิกรายการสำเร็จ');
        fetchLinkedSales();
      }
    } catch (error) {
      console.error('Error voiding sale:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const statusBadge = getStatusBadge(booking.bookingStatus);
  const paymentBadge = getPaymentBadge(booking.paymentStatus);
  const slipStatus = booking.paymentSlip?.status;
  const slipBadge = getSlipStatusBadge(slipStatus);
  const hasSlip = slipStatus && slipStatus !== 'none' && booking.paymentSlip?.image;
  const canVerifySlip = slipStatus === 'pending_verification';

  return (
    <>
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
                className="tooltip text-gray-400 hover:text-gray-600 transition-colors"
                data-tooltip="ปิดหน้าต่าง"
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
                        {getBookingTimeRange()}
                        {booking.duration !== 1 && ` (${booking.duration === 0.5 ? '30 นาที' : booking.duration % 1 === 0 ? `${booking.duration} ชม.` : `${Math.floor(booking.duration)} ชม. 30 น.`})`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">สนาม</p>
                      {isAssigningCourt ? (
                        <div className="mt-1 space-y-2">
                          <select
                            value={selectedCourtId}
                            onChange={(e) => setSelectedCourtId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="">-- เลือกสนาม --</option>
                            {allCourts.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.courtNumber} - {c.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={handleAssignCourt}
                              disabled={assignLoading || !selectedCourtId}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {assignLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                            <button
                              onClick={() => { setIsAssigningCourt(false); setSelectedCourtId(''); }}
                              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {booking.court ? (
                            <p className="font-medium text-gray-900">
                              {booking.court.courtNumber} - {booking.court.name}
                            </p>
                          ) : (
                            <p className="font-medium text-amber-600">ยังไม่ได้กำหนดสนาม</p>
                          )}
                          <button
                            onClick={() => {
                              setSelectedCourtId(booking.court?._id || '');
                              setIsAssigningCourt(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {booking.court ? 'เปลี่ยน' : 'กำหนดสนาม'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">ระยะเวลาเล่น</p>
                      <p className="font-medium text-gray-900">
                        {booking.duration === 0.5 ? '30 นาที' : booking.duration % 1 === 0 ? `${booking.duration} ชั่วโมง` : `${Math.floor(booking.duration)} ชม. 30 นาที`}
                      </p>
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
                      <p className="font-medium text-gray-900">
                        {booking.customer?.name || '-'}
                        {booking.customer?.nickname && <span className="text-gray-500 font-normal"> ({booking.customer.nickname})</span>}
                      </p>
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

              {/* Payment Slip Section */}
              {hasSlip && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Image size={20} className="text-gray-400" />
                      สลิปการชำระเงิน
                    </h3>
                    {slipBadge && (
                      <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full ${slipBadge.bg} ${slipBadge.text}`}>
                        <slipBadge.icon size={14} />
                        {slipBadge.label}
                      </span>
                    )}
                  </div>

                  {/* Slip Image */}
                  <div className="flex flex-col items-center">
                    <img
                      src={`${API_URL}${booking.paymentSlip.image}`}
                      alt="Payment slip"
                      className="max-h-64 rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setShowSlipPreview(true)}
                    />
                    <p className="text-xs text-gray-500 mt-2">คลิกเพื่อดูขนาดเต็ม</p>
                  </div>

                  {/* Slip Info */}
                  {booking.paymentSlip.uploadedAt && (
                    <p className="text-xs text-gray-500 mt-3">
                      อัพโหลดเมื่อ: {new Date(booking.paymentSlip.uploadedAt).toLocaleString('th-TH')}
                    </p>
                  )}

                  {/* Reject Reason */}
                  {slipStatus === 'rejected' && booking.paymentSlip.rejectReason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700">
                        <strong>เหตุผลที่ปฏิเสธ:</strong> {booking.paymentSlip.rejectReason}
                      </p>
                    </div>
                  )}

                  {/* Verify/Reject Buttons */}
                  {canVerifySlip && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleVerifySlip}
                        disabled={verifyLoading}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        ยืนยันสลิป
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={verifyLoading}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} />
                        ปฏิเสธสลิป
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab / Linked Sales Section */}
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <ShoppingCart size={20} className="text-orange-500" />
                    รายการสินค้า (Tab)
                  </h3>
                  {(booking.bookingStatus === 'checked-in' || booking.bookingStatus === 'confirmed') && (
                    <button
                      onClick={() => setShowAddItemsModal(true)}
                      className="text-sm px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} />
                      เพิ่มสินค้า
                    </button>
                  )}
                </div>

                {salesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-4 border-orange-500 border-t-transparent mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">กำลังโหลด...</p>
                  </div>
                ) : linkedSales.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">ยังไม่มีรายการสินค้า</div>
                ) : (
                  <>
                    {/* Pending Sales */}
                    {linkedSales.filter((s) => s.paymentStatus === 'pending').length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-orange-700 mb-2">รายการค้างชำระ</p>
                        {linkedSales
                          .filter((s) => s.paymentStatus === 'pending')
                          .map((sale) => (
                            <div key={sale._id} className="bg-white rounded-lg p-3 mb-2 border border-orange-200">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-500">{sale.saleCode}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-orange-600">฿{sale.total.toFixed(2)}</span>
                                  <button
                                    onClick={() => handleVoidSale(sale._id)}
                                    className="text-xs text-red-500 hover:text-red-700 px-1.5 py-0.5 rounded hover:bg-red-50"
                                  >
                                    ยกเลิก
                                  </button>
                                </div>
                              </div>
                              {sale.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm text-gray-600">
                                  <span>
                                    {item.product?.name || 'สินค้า'} x {item.quantity}
                                  </span>
                                  <span>฿{item.subtotal.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Paid Sales */}
                    {linkedSales.filter((s) => s.paymentStatus === 'paid').length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-2">ชำระแล้ว</p>
                        {linkedSales
                          .filter((s) => s.paymentStatus === 'paid')
                          .map((sale) => (
                            <div key={sale._id} className="bg-white rounded-lg p-3 mb-2 border border-green-200">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-500">{sale.saleCode}</span>
                                <span className="font-bold text-green-600">฿{sale.total.toFixed(2)}</span>
                              </div>
                              {sale.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm text-gray-600">
                                  <span>
                                    {item.product?.name || 'สินค้า'} x {item.quantity}
                                  </span>
                                  <span>฿{item.subtotal.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}

                {/* Settlement Button */}
                {salesSummary && salesSummary.pendingCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-orange-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-gray-700">ยอดค้างชำระ (สินค้า)</span>
                      <span className="text-xl font-bold text-orange-600">
                        ฿{salesSummary.totalPending.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowSettlementModal(true)}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      <DollarSign size={20} />
                      ชำระเงินสินค้า
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">ข้อมูลการชำระเงิน</h3>
                  {!isEditingPayment && (
                    <button
                      onClick={() => setIsEditingPayment(true)}
                      className="tooltip text-sm text-blue-600 hover:text-blue-700 font-medium"
                      data-tooltip="แก้ไขข้อมูลการชำระเงิน"
                    >
                      แก้ไข
                    </button>
                  )}
                </div>

                {isEditingPayment ? (
                  <div className="space-y-4">
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
                        {paymentSettings && getAvailablePaymentMethods(paymentSettings).map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                        {(!paymentSettings || getAvailablePaymentMethods(paymentSettings).length === 0) && (
                          <option value="">ไม่มีวิธีการชำระเงินที่ใช้งานได้</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        จำนวนเงินที่ชำระ
                      </label>
                      <input
                        type="number"
                        value={paymentData.amountPaid}
                        onChange={(e) =>
                          setPaymentData({ ...paymentData, amountPaid: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleUpdatePayment}
                        className="tooltip tooltip-bottom flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        data-tooltip="บันทึกการเปลี่ยนแปลง"
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={() => setIsEditingPayment(false)}
                        className="tooltip tooltip-bottom flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        data-tooltip="ยกเลิกการแก้ไข"
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
                          {booking.paymentMethod === 'transfer' && 'โอนเงิน'}
                          {booking.paymentMethod === 'qr' && 'QR Code'}
                          {booking.paymentMethod === 'card' && 'บัตรเครดิต'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DollarSign size={20} className="text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">จำนวนเงินที่ชำระ</p>
                        <p className="font-medium text-gray-900">
                          ฿{formatPrice(booking.pricing?.deposit || 0)} / ฿
                          {formatPrice(booking.pricing?.total || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">สรุปค่าใช้จ่ายทั้งหมด</h3>
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
                  {salesSummary && salesSummary.totalPending > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ค่าสินค้า (ค้างชำระ)</span>
                      <span className="font-medium text-orange-600">
                        ฿{formatPrice(salesSummary.totalPending)}
                      </span>
                    </div>
                  )}
                  {salesSummary && salesSummary.totalPaid > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ค่าสินค้า (ชำระแล้ว)</span>
                      <span className="font-medium text-green-600">
                        ฿{formatPrice(salesSummary.totalPaid)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">ยอดรวมทั้งหมด</span>
                    <span className="font-bold text-lg text-blue-600">
                      ฿{formatPrice((booking.pricing?.total || 0) + (salesSummary?.grandTotal || 0))}
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
                className="tooltip tooltip-left px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                data-tooltip="ปิดหน้าต่าง"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowRejectModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">ปฏิเสธสลิป</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เหตุผลในการปฏิเสธ
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="เช่น สลิปไม่ชัด, จำนวนเงินไม่ตรง..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleRejectSlip}
                  disabled={verifyLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {verifyLoading ? 'กำลังดำเนินการ...' : 'ยืนยันการปฏิเสธ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Items Modal */}
      {showAddItemsModal && (
        <AddItemsModal
          isOpen={showAddItemsModal}
          onClose={() => setShowAddItemsModal(false)}
          booking={booking}
          onSuccess={() => {
            setShowAddItemsModal(false);
            fetchLinkedSales();
          }}
        />
      )}

      {/* Settlement Modal */}
      {showSettlementModal && (
        <SettlementModal
          isOpen={showSettlementModal}
          onClose={() => setShowSettlementModal(false)}
          booking={booking}
          pendingSales={linkedSales.filter((s) => s.paymentStatus === 'pending')}
          onSuccess={() => {
            setShowSettlementModal(false);
            fetchLinkedSales();
            onUpdate?.();
          }}
        />
      )}

      {/* Slip Preview Modal */}
      {showSlipPreview && hasSlip && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setShowSlipPreview(false)}
        >
          <img
            src={`${API_URL}${booking.paymentSlip.image}`}
            alt="Payment slip preview"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setShowSlipPreview(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X size={32} />
          </button>
        </div>
      )}
    </>
  );
};

// ============================================
// AddItemsModal - Mini POS for adding items to booking tab
// ============================================
const AddItemsModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setCart([]);
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getAll({ status: 'active' });
      if (response.success) {
        setProducts(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const hasStock = p.trackStock === false || p.stock > 0;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return hasStock && matchesSearch;
  });

  const addToCart = (product) => {
    const existing = cart.find((item) => item.product._id === product._id);
    if (existing) {
      if (product.trackStock !== false && existing.quantity >= product.stock) {
        toast.error('สต็อกไม่เพียงพอ');
        return;
      }
      setCart(
        cart.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1, subtotal: item.price * (item.quantity + 1) }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1, price: product.price, subtotal: product.price }]);
    }
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      setCart(cart.filter((item) => item.product._id !== productId));
      return;
    }
    const product = products.find((p) => p._id === productId);
    if (product?.trackStock !== false && newQty > product.stock) {
      toast.error('สต็อกไม่เพียงพอ');
      return;
    }
    setCart(
      cart.map((item) =>
        item.product._id === productId ? { ...item, quantity: newQty, subtotal: item.price * newQty } : item
      )
    );
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error('กรุณาเลือกสินค้า');
      return;
    }
    setSubmitting(true);
    try {
      const saleData = {
        items: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
        customer: booking.customer
          ? {
              name: booking.customer.name || '',
              nickname: booking.customer.nickname || '',
              phone: booking.customer.phone || '',
              type: 'walk-in',
            }
          : null,
        relatedBooking: booking._id,
        paymentStatus: 'pending',
        total,
      };

      const response = await salesAPI.create(saleData);
      if (response.success) {
        toast.success('เพิ่มรายการสำเร็จ');
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating tab sale:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} />
              <div>
                <h2 className="font-bold">เพิ่มสินค้า</h2>
                <p className="text-white/80 text-xs">
                  {booking.bookingCode} - {booking.customer?.nickname || booking.customer?.name || 'ลูกค้า'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-h-[calc(85vh-80px)] overflow-hidden">
            {/* Product List */}
            <div className="p-4 border-r overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-orange-500 border-t-transparent mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => addToCart(product)}
                      className="w-full text-left p-3 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-between border border-transparent hover:border-orange-200"
                    >
                      <div>
                        <p className="font-medium text-sm text-gray-800">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-orange-600">฿{product.price.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">
                          {product.trackStock === false ? 'ไม่จำกัด' : `เหลือ ${product.stock}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="p-4 flex flex-col overflow-y-auto max-h-[calc(85vh-80px)]">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Receipt size={16} className="text-orange-500" />
                รายการที่เลือก ({cart.length})
              </h3>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm flex-1">
                  <Package size={32} className="mx-auto mb-2 opacity-50" />
                  เลือกสินค้าจากรายการด้านซ้าย
                </div>
              ) : (
                <div className="flex-1 space-y-2 mb-4">
                  {cart.map((item) => (
                    <div key={item.product._id} className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-gray-400">฿{item.price.toFixed(2)} / ชิ้น</p>
                        </div>
                        <button
                          onClick={() => setCart(cart.filter((c) => c.product._id !== item.product._id))}
                          className="text-red-400 hover:text-red-600 p-0.5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                            className="w-7 h-7 rounded bg-white border flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                            className="w-7 h-7 rounded bg-white border flex items-center justify-center hover:bg-gray-100"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="font-bold text-sm text-orange-600">฿{item.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total & Submit */}
              {cart.length > 0 && (
                <div className="border-t pt-3 mt-auto">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">ยอดรวม</span>
                    <span className="text-xl font-bold text-orange-600">฿{total.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Receipt size={18} />
                        เพิ่มลงบิล (ยังไม่ชำระ)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SettlementModal - Pay pending sales (individual or combined)
// ============================================
const SettlementModal = ({ isOpen, onClose, booking, pendingSales, onSuccess }) => {
  const [mode, setMode] = useState('individual'); // 'individual' | 'combined'
  const [selectedSaleIds, setSelectedSaleIds] = useState(() => pendingSales.map((s) => s._id));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);

  const QUICK_CASH_AMOUNTS = [20, 50, 100, 500, 1000];

  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        try {
          const response = await settingsAPI.get();
          if (response.success && response.data.payment) {
            setPaymentSettings(response.data.payment);
          }
        } catch (error) {
          console.error('Error fetching payment settings:', error);
        }
      };
      fetchSettings();
      // Select all pending sales by default
      setSelectedSaleIds(pendingSales.map((s) => s._id));
    }
  }, [isOpen]);

  const getAvailableMethods = () => {
    const methods = [{ value: 'cash', label: 'เงินสด' }, { value: 'transfer', label: 'โอนเงิน' }];
    if (paymentSettings?.acceptPromptPay) methods.push({ value: 'promptpay', label: 'พร้อมเพย์' });
    if (paymentSettings?.acceptCreditCard) methods.push({ value: 'credit_card', label: 'บัตรเครดิต' });
    return methods;
  };

  const toggleSale = (saleId) => {
    setSelectedSaleIds((prev) =>
      prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]
    );
  };

  const salesTotalAmount = useMemo(() => {
    if (mode === 'combined') {
      return pendingSales.reduce((sum, s) => sum + s.total, 0);
    }
    return pendingSales.filter((s) => selectedSaleIds.includes(s._id)).reduce((sum, s) => sum + s.total, 0);
  }, [mode, pendingSales, selectedSaleIds]);

  const bookingRemainingAmount = useMemo(() => {
    if (mode === 'combined') {
      return (booking.pricing?.total || 0) - (booking.pricing?.deposit || 0);
    }
    return 0;
  }, [mode, booking]);

  const grandTotal = salesTotalAmount + bookingRemainingAmount;

  const changeAmount = useMemo(() => {
    const received = parseFloat(receivedAmount) || 0;
    return received >= grandTotal ? received - grandTotal : 0;
  }, [receivedAmount, grandTotal]);

  const isReceivedValid = useMemo(() => {
    if (paymentMethod !== 'cash') return true;
    return (parseFloat(receivedAmount) || 0) >= grandTotal;
  }, [paymentMethod, receivedAmount, grandTotal]);

  const handleSettle = async () => {
    if (paymentMethod === 'cash' && !isReceivedValid) {
      toast.error('จำนวนเงินที่รับไม่เพียงพอ');
      return;
    }
    if (mode === 'individual' && selectedSaleIds.length === 0) {
      toast.error('กรุณาเลือกรายการที่ต้องการชำระ');
      return;
    }

    setLoading(true);
    try {
      const data = {
        mode,
        paymentMethod,
        ...(paymentMethod === 'cash' && { receivedAmount: parseFloat(receivedAmount) }),
      };

      if (mode === 'combined') {
        data.bookingId = booking._id;
      } else {
        data.saleIds = selectedSaleIds;
      }

      const response = await salesAPI.settle(data);
      if (response.success) {
        toast.success('ชำระเงินสำเร็จ');
        onSuccess();
      }
    } catch (error) {
      console.error('Error settling:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={20} />
              <h2 className="font-bold">ชำระเงินสินค้า</h2>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Mode Selection */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">รูปแบบการชำระ</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('individual')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    mode === 'individual' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  จ่ายเฉพาะสินค้า
                </button>
                <button
                  onClick={() => setMode('combined')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    mode === 'combined' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  จ่ายรวม (คอร์ท+สินค้า)
                </button>
              </div>
            </div>

            {/* Items to settle */}
            {mode === 'individual' && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">เลือกรายการที่ต้องการชำระ</p>
                <div className="space-y-2">
                  {pendingSales.map((sale) => (
                    <label
                      key={sale._id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedSaleIds.includes(sale._id) ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSaleIds.includes(sale._id)}
                        onChange={() => toggleSale(sale._id)}
                        className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">{sale.saleCode}</p>
                        {sale.items.map((item, idx) => (
                          <p key={idx} className="text-sm text-gray-700">
                            {item.product?.name} x {item.quantity}
                          </p>
                        ))}
                      </div>
                      <span className="font-bold text-orange-600">฿{sale.total.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Combined breakdown */}
            {mode === 'combined' && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                {bookingRemainingAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ค่าเช่าสนาม (คงค้าง)</span>
                    <span className="font-medium">฿{bookingRemainingAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ค่าสินค้า ({pendingSales.length} รายการ)</span>
                  <span className="font-medium">฿{salesTotalAmount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">ยอดรวม</span>
                  <span className="font-bold text-lg text-orange-600">฿{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Total for individual mode */}
            {mode === 'individual' && (
              <div className="bg-orange-50 rounded-lg p-3 flex justify-between items-center">
                <span className="font-semibold">ยอดที่ต้องชำระ</span>
                <span className="text-xl font-bold text-orange-600">฿{grandTotal.toFixed(2)}</span>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">วิธีชำระเงิน</p>
              <div className="grid grid-cols-2 gap-2">
                {getAvailableMethods().map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      paymentMethod === method.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash handling */}
            {paymentMethod === 'cash' && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">รับเงิน</p>
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {QUICK_CASH_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setReceivedAmount(String(amount))}
                      className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                        parseFloat(receivedAmount) === amount ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setReceivedAmount(String(grandTotal))}
                  className="w-full mb-3 py-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-600 font-medium text-sm hover:border-blue-300"
                >
                  พอดี ({grandTotal.toFixed(2)})
                </button>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">฿</span>
                  <input
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="กรอกจำนวนเงินที่รับ"
                    className="w-full pl-8 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                {parseFloat(receivedAmount) > 0 && (
                  <div className={`mt-3 p-3 rounded-lg ${isReceivedValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm text-gray-700">เงินทอน</span>
                      <span className={`text-lg font-bold ${isReceivedValid ? 'text-green-600' : 'text-red-600'}`}>
                        {isReceivedValid ? `฿${changeAmount.toFixed(2)}` : 'เงินไม่พอ'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSettle}
                disabled={loading || (paymentMethod === 'cash' && !isReceivedValid) || grandTotal <= 0}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <DollarSign size={18} />
                    ยืนยันชำระเงิน
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
