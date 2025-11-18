import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import BookingFilters from '../../components/booking/BookingFilters';
import BookingsTable from '../../components/booking/BookingsTable';
import BookingDetailModal from '../../components/booking/BookingDetailModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { toast } from 'react-hot-toast';

/**
 * BookingsPage
 * หน้าจัดการรายการจอง (Booking Management)
 */
const BookingsPage = () => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // State
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning',
  });
  const [filters, setFilters] = useState({
    dateFrom: getTodayDate(),
    dateTo: getTodayDate(),
    status: 'all',
    courtId: 'all',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Load bookings
  useEffect(() => {
    loadBookings();
  }, [filters, pagination.page]);

  // Load bookings from API
  const loadBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Build query params
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (filters.dateFrom) params.append('startDate', filters.dateFrom);
      if (filters.dateTo) params.append('endDate', filters.dateTo);
      if (filters.status !== 'all') params.append('bookingStatus', filters.status);
      if (filters.courtId !== 'all') params.append('court', filters.courtId);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.LIST}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setBookings(response.data.data || []);
        setPagination({
          ...pagination,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0,
        });
      }
    } catch (error) {
      console.error('Load bookings error:', error);
      toast.error('ไม่สามารถโหลดรายการจองได้');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 }); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  // Handle view booking detail
  const handleViewDetail = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.GET(bookingId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSelectedBooking(response.data.data);
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error('Get booking detail error:', error);
      toast.error('ไม่สามารถโหลดรายละเอียดการจองได้');
    }
  };

  // Handle check-in
  const handleCheckin = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.CHECKIN(bookingId)}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success('เช็คอินสำเร็จ');
        loadBookings(); // Reload bookings
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error.response?.data?.message || 'เช็คอินไม่สำเร็จ');
    }
  };

  // Handle cancel booking
  const handleCancel = (bookingId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยกเลิกการจอง',
      message: 'คุณแน่ใจหรือไม่ที่จะยกเลิกการจองนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้',
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.patch(
            `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.CANCEL(bookingId)}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            toast.success('ยกเลิกการจองสำเร็จ');
            loadBookings(); // Reload bookings
          }
        } catch (error) {
          console.error('Cancel booking error:', error);
          toast.error(error.response?.data?.message || 'ยกเลิกการจองไม่สำเร็จ');
        }
      },
    });
  };

  // Handle mark as paid
  const handleMarkAsPaid = (bookingId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'อัพเดตสถานะการชำระเงิน',
      message: 'ยืนยันการอัพเดตสถานะเป็น "ชำระเงินแล้ว"?',
      type: 'success',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');

          // Get booking details first to get the total amount
          const bookingResponse = await axios.get(
            `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.GET(bookingId)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!bookingResponse.data.success) {
            toast.error('ไม่สามารถโหลดข้อมูลการจองได้');
            return;
          }

          const booking = bookingResponse.data.data;

          // Update payment with full amount
          const response = await axios.patch(
            `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.UPDATE_PAYMENT(bookingId)}`,
            { amountPaid: booking.pricing.total },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.data.success) {
            toast.success('อัปเดตสถานะการชำระเงินเป็น "ชำระแล้ว" สำเร็จ');
            loadBookings(); // Reload bookings
          }
        } catch (error) {
          console.error('Mark as paid error:', error);
          toast.error(error.response?.data?.message || 'อัปเดตสถานะการชำระเงินไม่สำเร็จ');
        }
      },
    });
  };

  // Handle update payment
  const handleUpdatePayment = async (bookingId, paymentData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.UPDATE_PAYMENT(bookingId)}`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success('อัปเดตสถานะการชำระเงินสำเร็จ');
        loadBookings(); // Reload bookings
      }
    } catch (error) {
      console.error('Update payment error:', error);
      toast.error('อัปเดตสถานะการชำระเงินไม่สำเร็จ');
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedBooking(null);
  };

  // Handle booking updated
  const handleBookingUpdated = () => {
    loadBookings(); // Reload bookings
    handleModalClose();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายการจอง</h1>
          <p className="mt-1 text-sm text-gray-600">
            จัดการและติดตามรายการจองสนามทั้งหมด
          </p>
        </div>
        <button
          onClick={loadBookings}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          title="รีเฟรชรายการจอง"
        >
          <svg
            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          รีเฟรช
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Filters */}
        <BookingFilters filters={filters} onFilterChange={handleFilterChange} />

        {/* Table */}
        <BookingsTable
          bookings={bookings}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onViewDetail={handleViewDetail}
          onMarkAsPaid={handleMarkAsPaid}
          onCheckin={handleCheckin}
          onCancel={handleCancel}
        />
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedBooking && (
        <BookingDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleModalClose}
          booking={selectedBooking}
          onUpdate={handleBookingUpdated}
          onUpdatePayment={handleUpdatePayment}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default BookingsPage;
