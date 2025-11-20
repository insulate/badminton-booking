import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { bookingsAPI, settingsAPI } from '../../lib/api';

/**
 * BookingModal Component
 * ฟอร์มกรอกข้อมูลการจอง
 */
const BookingModal = ({ isOpen, onClose, bookingData, onSuccess }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    duration: 1,
    paymentMethod: 'cash',
    paymentStatus: 'pending', // 'pending' or 'paid'
    notes: '',
  });

  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [paymentSettings, setPaymentSettings] = useState(null);

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await settingsAPI.get();
        if (response.success && response.data.payment) {
          setPaymentSettings(response.data.payment);
          // Set default payment method to first available option
          const availableMethods = getAvailablePaymentMethods(response.data.payment);
          if (availableMethods.length > 0 && !formData.paymentMethod) {
            setFormData(prev => ({ ...prev, paymentMethod: availableMethods[0].value }));
          }
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

  // Calculate end time based on duration
  const calculateEndTime = () => {
    if (!bookingData?.timeSlot?.startTime) return '';

    const [hours, minutes] = bookingData.timeSlot.startTime.split(':').map(Number);
    const endHours = hours + parseInt(formData.duration);
    const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return endTime;
  };

  // Calculate price when duration changes
  useEffect(() => {
    let isMounted = true;

    const calculatePrice = async () => {
      if (!bookingData?.timeSlot?._id) return;

      try {
        // Call backend API to calculate price
        const response = await bookingsAPI.calculatePrice({
          timeSlotId: bookingData.timeSlot._id,
          duration: formData.duration,
          customerType: 'normal', // TODO: Get from user profile when member system is implemented
          discountPercent: 0,
          depositAmount: 0,
        });

        // Only update state if component is still mounted
        if (isMounted && response.success) {
          setPricing(response.data);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Calculate price error:', error);
          // Fallback to basic pricing if API fails
          const pricePerHour = bookingData.timeSlot.peakHour ? 150 : 120;
          const subtotal = pricePerHour * formData.duration;
          setPricing({
            subtotal,
            discount: 0,
            total: subtotal,
            pricePerHour,
          });
        }
      }
    };

    if (bookingData && formData.duration > 0) {
      calculatePrice();
    }

    // Cleanup function to prevent memory leak
    return () => {
      isMounted = false;
    };
  }, [formData.duration, bookingData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'กรุณากรอกชื่อลูกค้า';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!/^0[0-9]{9}$/.test(formData.customerPhone.replace(/[-\s]/g, ''))) {
      newErrors.customerPhone = 'รูปแบบเบอร์โทรไม่ถูกต้อง (ต้องเป็น 10 หลัก)';
    }

    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (formData.duration < 1 || formData.duration > 8) {
      newErrors.duration = 'ระยะเวลาต้องอยู่ระหว่าง 1-8 ชั่วโมง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const bookingPayload = {
        customer: {
          name: formData.customerName,
          phone: formData.customerPhone,
          email: formData.customerEmail,
        },
        court: bookingData.court.courtId,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot.timeSlotId,
        duration: parseInt(formData.duration),
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes,
      };

      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.CREATE}`,
        bookingPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        onSuccess(response.data.data);
        handleClose();
      }
    } catch (error) {
      console.error('Create booking error:', error);
      toast.error(
        error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างการจอง'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      duration: 1,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      notes: '',
    });
    setPricing(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="relative w-full max-w-3xl p-5 overflow-hidden bg-white shadow-xl rounded-lg max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">สร้างการจองใหม่</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="ปิดหน้าต่าง"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Booking Info */}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">สนาม:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {bookingData?.court?.courtNumber} - {bookingData?.court?.courtName}
                </span>
              </div>
              <div>
                <span className="text-gray-600">เวลา:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {bookingData?.timeSlot?.startTime} - {calculateEndTime()}
                  {bookingData?.timeSlot?.peakHour && (
                    <span className="ml-2 inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                      Peak Hour
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Form - Scrollable */}
          <form id="booking-form" onSubmit={handleSubmit} className="mt-4 flex-1 overflow-y-auto">
            <div className="space-y-3 pr-2">
            {/* Row 1: Name & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                  ชื่อลูกค้า <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-lg border ${
                    errors.customerName ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="กรอกชื่อลูกค้า"
                />
                {errors.customerName && (
                  <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-lg border ${
                    errors.customerPhone ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="08XXXXXXXX"
                />
                {errors.customerPhone && (
                  <p className="mt-1 text-xs text-red-600">{errors.customerPhone}</p>
                )}
              </div>
            </div>

            {/* Row 2: Email & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
                  อีเมล (ไม่บังคับ)
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-lg border ${
                    errors.customerEmail ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="example@email.com"
                />
                {errors.customerEmail && (
                  <p className="mt-1 text-xs text-red-600">{errors.customerEmail}</p>
                )}
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  ระยะเวลา (ชั่วโมง) <span className="text-red-500">*</span>
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                    <option key={hour} value={hour}>
                      {hour} ชั่วโมง
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                วิธีการชำระเงิน
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {/* Payment Status Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                สถานะการชำระเงิน
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, paymentStatus: 'pending' }))}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    formData.paymentStatus === 'pending'
                      ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                  title="เลือกสถานะ: ยังไม่ชำระเงิน"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                      formData.paymentStatus === 'pending'
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-gray-400'
                    }`}>
                      {formData.paymentStatus === 'pending' && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <span>ยังไม่ชำระ</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, paymentStatus: 'paid' }))}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    formData.paymentStatus === 'paid'
                      ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                  title="เลือกสถานะ: ชำระเงินแล้ว"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${
                      formData.paymentStatus === 'paid'
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-400'
                    }`}>
                      {formData.paymentStatus === 'paid' && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <span>ชำระแล้ว</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                หมายเหตุ
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              />
            </div>

            {/* Pricing Summary */}
            {pricing && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-1.5">สรุปราคา</h4>
                <div className="space-y-0.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      ราคาต่อชั่วโมง × {formData.duration} ชม.
                    </span>
                    <span className="text-gray-900">{pricing.subtotal} บาท</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ส่วนลด</span>
                    <span className="text-gray-900">{pricing.discount} บาท</span>
                  </div>
                  <div className="pt-1.5 border-t border-gray-300 flex justify-between mt-1">
                    <span className="font-semibold text-gray-900">ยอดรวม</span>
                    <span className="font-semibold text-blue-600 text-base">
                      {pricing.total} บาท
                    </span>
                  </div>
                </div>
              </div>
            )}
            </div>
          </form>

          {/* Actions - Fixed at bottom */}
          <div className="flex justify-end gap-3 pt-3 mt-3 border-t border-gray-200 bg-white">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
              title="ยกเลิกและปิดหน้าต่าง"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              form="booking-form"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="บันทึกการจองใหม่"
            >
              {loading ? 'กำลังบันทึก...' : 'ยืนยันการจอง'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
