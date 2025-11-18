import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import BookingCalendar from '../../components/booking/BookingCalendar';
import CourtScheduleGrid from '../../components/booking/CourtScheduleGrid';
import BookingModal from '../../components/booking/BookingModal';
import { toast } from 'react-hot-toast';

/**
 * BookingPage
 * หน้าจัดการการจองสนาม
 */
const BookingPage = () => {
  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Load schedule when date changes
  useEffect(() => {
    if (selectedDate) {
      loadDailySchedule();
    }
  }, [selectedDate]);

  // Load daily schedule from API
  const loadDailySchedule = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Format date as YYYY-MM-DD
      const dateStr = selectedDate.toISOString().split('T')[0];

      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.DAILY_SCHEDULE}?date=${dateStr}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSchedule(response.data.data);
      }
    } catch (error) {
      console.error('Load schedule error:', error);
      toast.error('ไม่สามารถโหลดตารางสนามได้');
    } finally {
      setLoading(false);
    }
  };

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Handle slot click (open booking modal)
  const handleSlotClick = (slotData) => {
    setSelectedSlot({
      court: slotData.court,
      timeSlot: slotData.timeSlot,
      date: selectedDate.toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  // Handle booking success
  const handleBookingSuccess = (booking) => {
    toast.success(`จองสำเร็จ! รหัสจอง: ${booking.bookingCode}`);
    // Reload schedule to show updated availability
    loadDailySchedule();
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จองสนาม</h1>
          <p className="mt-1 text-sm text-gray-600">
            เลือกวันที่และช่วงเวลาเพื่อจองสนามแบดมินตัน
          </p>
        </div>
        <button
          onClick={loadDailySchedule}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
        {/* Calendar Section - ด้านบน */}
        <BookingCalendar selectedDate={selectedDate} onDateChange={handleDateChange} />

        {/* Schedule Grid - ด้านล่าง */}
        <CourtScheduleGrid
          schedule={schedule}
          onSlotClick={handleSlotClick}
          loading={loading}
        />
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          bookingData={selectedSlot}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default BookingPage;
