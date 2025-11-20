import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import BookingCalendar from '../../components/booking/BookingCalendar';
import CourtScheduleGrid from '../../components/booking/CourtScheduleGrid';
import BookingModal from '../../components/booking/BookingModal';
import { toast } from 'react-hot-toast';
import { PageContainer, PageHeader } from '../../components/common';
import { Calendar, RefreshCw } from 'lucide-react';

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
    <PageContainer variant="full">
      <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="จองสนาม"
        subtitle="เลือกวันที่และช่วงเวลาเพื่อจองสนามแบดมินตัน"
        icon={Calendar}
        iconColor="blue"
        actions={
          <button
            onClick={loadDailySchedule}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
        }
      />

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
    </PageContainer>
  );
};

export default BookingPage;
