import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';

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
    notes: '',
  });

  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Calculate price when duration changes
  useEffect(() => {
    if (bookingData && formData.duration > 0) {
      calculatePrice();
    }
  }, [formData.duration, bookingData]);

  const calculatePrice = async () => {
    if (!bookingData?.timeSlot) return;

    try {
      // Mock price calculation (in real app, could call API)
      // For now, use simple calculation: 120 baht/hour (normal price)
      const pricePerHour = bookingData.timeSlot.peakHour ? 150 : 120;
      const subtotal = pricePerHour * formData.duration;

      setPricing({
        subtotal,
        discount: 0,
        total: subtotal,
        pricePerHour,
      });
    } catch (error) {
      console.error('Calculate price error:', error);
    }
  };

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
      alert(
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
      notes: '',
    });
    setPricing(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">สร้างการจองใหม่</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
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
                  {bookingData?.timeSlot?.startTime} - {bookingData?.timeSlot?.endTime}
                  {bookingData?.timeSlot?.peakHour && (
                    <span className="ml-2 inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                      Peak Hour
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Customer Name */}
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
                } px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="กรอกชื่อลูกค้า"
              />
              {errors.customerName && (
                <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
              )}
            </div>

            {/* Customer Phone */}
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
                } px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="08XXXXXXXX"
              />
              {errors.customerPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
              )}
            </div>

            {/* Customer Email */}
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
                } px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="example@email.com"
              />
              {errors.customerEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                ระยะเวลา (ชั่วโมง) <span className="text-red-500">*</span>
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                  <option key={hour} value={hour}>
                    {hour} ชั่วโมง
                  </option>
                ))}
              </select>
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
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">เงินสด</option>
                <option value="transfer">โอนเงิน</option>
                <option value="qr">QR Code</option>
                <option value="card">บัตรเครดิต</option>
              </select>
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
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              />
            </div>

            {/* Pricing Summary */}
            {pricing && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">สรุปราคา</h4>
                <div className="space-y-1 text-sm">
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
                  <div className="pt-2 border-t border-gray-300 flex justify-between">
                    <span className="font-semibold text-gray-900">ยอดรวม</span>
                    <span className="font-semibold text-blue-600 text-lg">
                      {pricing.total} บาท
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังบันทึก...' : 'ยืนยันการจอง'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
