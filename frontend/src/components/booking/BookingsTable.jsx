import { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { courtsAPI, bookingsAPI } from '../../lib/api';

/**
 * BookingsTable Component
 * ตารางแสดงรายการจองทั้งหมด
 */
const BookingsTable = ({
  bookings,
  loading,
  pagination,
  onPageChange,
  onViewDetail,
  onCheckin,
  onCancel,
  onMarkAsPaid,
  onReload,
}) => {
  const [courts, setCourts] = useState([]);
  const [assigningCourt, setAssigningCourt] = useState(null);

  useEffect(() => {
    loadCourts();
  }, []);

  const loadCourts = async () => {
    try {
      const response = await courtsAPI.getAll({ status: 'available' });
      if (response.success) {
        setCourts(response.data);
      }
    } catch (error) {
      console.error('Load courts error:', error);
    }
  };

  const handleAssignCourt = async (bookingId, courtId) => {
    if (!courtId) return;
    try {
      setAssigningCourt(bookingId);
      const response = await bookingsAPI.assignCourt(bookingId, courtId);
      if (response.success) {
        toast.success('กำหนดสนามสำเร็จ');
        if (onReload) onReload();
      }
    } catch (error) {
      console.error('Assign court error:', error);
      toast.error(error.response?.data?.message || 'ไม่สามารถกำหนดสนามได้');
    } finally {
      setAssigningCourt(null);
    }
  };
  // Get booking status badge
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
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  // Format time
  const formatTime = (startTime, endTime) => {
    return `${startTime} - ${endTime}`;
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Can check-in
  const canCheckin = (booking) => {
    return booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid';
  };

  // Can cancel
  const canCancel = (booking) => {
    return ['pending', 'confirmed'].includes(booking.bookingStatus);
  };

  // Can mark as paid
  const canMarkAsPaid = (booking) => {
    return booking.paymentStatus !== 'paid' && booking.bookingStatus !== 'cancelled';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดรายการจอง...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีรายการจอง</h3>
          <p className="mt-1 text-sm text-gray-500">ไม่พบรายการจองที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                รหัสจอง
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                เวลา
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สนาม
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ลูกค้า
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                การชำระเงิน
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                ยอดรวม
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => {
              const statusBadge = getStatusBadge(booking.bookingStatus);
              const paymentBadge = getPaymentBadge(booking.paymentStatus);

              return (
                <tr key={booking._id} className="hover:bg-gray-50">
                  {/* Booking Code */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">{booking.bookingCode}</div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(booking.date)}</div>
                  </td>

                  {/* Time */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {booking.timeSlot?.startTime && booking.timeSlot?.endTime
                        ? formatTime(booking.timeSlot.startTime, booking.timeSlot.endTime)
                        : '-'}
                    </div>
                  </td>

                  {/* Court */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {booking.court ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.court.courtNumber || '-'}
                        </div>
                        <div className="text-xs text-gray-500">{booking.court.name || ''}</div>
                      </>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => handleAssignCourt(booking._id, e.target.value)}
                        disabled={assigningCourt === booking._id}
                        className="text-sm border border-orange-300 bg-orange-50 text-orange-800 rounded-lg px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="" disabled>เลือกสนาม</option>
                        {courts.map((court) => (
                          <option key={court._id} value={court._id}>
                            {court.name || `Court ${court.courtNumber}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.customer?.name || '-'}
                    </div>
                    <div className="text-xs text-gray-500">{booking.customer?.phone || ''}</div>
                  </td>

                  {/* Booking Status */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                    >
                      {statusBadge.label}
                    </span>
                  </td>

                  {/* Payment Status */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentBadge.bg} ${paymentBadge.text}`}
                    >
                      {paymentBadge.label}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      ฿{formatPrice(booking.pricing?.total || 0)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* View Detail */}
                      <button
                        onClick={() => onViewDetail(booking._id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye size={18} />
                      </button>

                      {/* Mark as Paid */}
                      {canMarkAsPaid(booking) && (
                        <button
                          onClick={() => onMarkAsPaid(booking._id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="อัพเดตชำระเงินแล้ว"
                        >
                          <DollarSign size={18} />
                        </button>
                      )}

                      {/* Check-in */}
                      {canCheckin(booking) && (
                        <button
                          onClick={() => onCheckin(booking._id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="เช็คอิน"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}

                      {/* Cancel */}
                      {canCancel(booking) && (
                        <button
                          onClick={() => onCancel(booking._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="ยกเลิก"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              แสดง {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} จาก{' '}
              {pagination.total} รายการ
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="ไปหน้าก่อนหน้า"
              >
                <ChevronLeft size={16} className="mr-1" />
                ก่อนหน้า
              </button>
              <div className="flex items-center px-4 text-sm text-gray-700">
                หน้า {pagination.page} / {pagination.totalPages}
              </div>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="ไปหน้าถัดไป"
              >
                ถัดไป
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsTable;
