import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { settingsAPI } from '../../lib/api';
import BookingCalendar from '../../components/booking/BookingCalendar';
import CourtScheduleGrid from '../../components/booking/CourtScheduleGrid';
import BookingModal from '../../components/booking/BookingModal';
import { toast } from 'react-hot-toast';
import { PageContainer, PageHeader, Card, Button } from '../../components/common';
import { Calendar, RefreshCw, CalendarX, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayString, formatDateToString } from '../../utils/dateUtils';

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

  // Blocked Dates state
  const [blockedDates, setBlockedDates] = useState([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');
  const [addingBlocked, setAddingBlocked] = useState(false);

  // Pagination state for blocked dates
  const [blockedDatesPage, setBlockedDatesPage] = useState(1);
  const blockedDatesPerPage = 5;

  // Load schedule when date changes
  useEffect(() => {
    if (selectedDate) {
      loadDailySchedule();
    }
  }, [selectedDate]);

  // Load blocked dates on mount
  useEffect(() => {
    fetchBlockedDates();
  }, []);

  // Load daily schedule from API
  const loadDailySchedule = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Format date as YYYY-MM-DD using local timezone
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

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
    // Check if date is blocked
    if (blockedDateInfo) {
      toast.error(blockedDateInfo.reason
        ? `ไม่สามารถจองได้: ${blockedDateInfo.reason}`
        : 'วันนี้ปิดการจอง');
      return;
    }

    // Format date using local timezone
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    setSelectedSlot({
      court: slotData.court,
      timeSlot: slotData.timeSlot,
      date: dateStr,
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

  // ========== Blocked Dates Functions ==========
  const fetchBlockedDates = async () => {
    try {
      const response = await settingsAPI.getBlockedDates();
      if (response.success) {
        setBlockedDates(response.data);
      }
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate) {
      toast.error('กรุณาเลือกวันที่');
      return;
    }

    try {
      setAddingBlocked(true);
      const response = await settingsAPI.addBlockedDate(newBlockedDate, newBlockedReason);
      if (response.success) {
        toast.success('เพิ่มวันปิดการจองสำเร็จ');
        setNewBlockedDate('');
        setNewBlockedReason('');
        fetchBlockedDates();
        // Reload schedule if the blocked date affects current view
        loadDailySchedule();
      }
    } catch (error) {
      console.error('Error adding blocked date:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setAddingBlocked(false);
    }
  };

  const handleRemoveBlockedDate = async (dateStr) => {
    if (!confirm('ต้องการลบวันปิดการจองนี้?')) return;

    try {
      const response = await settingsAPI.removeBlockedDate(dateStr);
      if (response.success) {
        toast.success('ลบวันปิดการจองสำเร็จ');
        fetchBlockedDates();
        loadDailySchedule();
      }
    } catch (error) {
      console.error('Error removing blocked date:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const formatBlockedDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if selected date is blocked
  const getBlockedDateInfo = () => {
    const selectedDateStr = formatDateToString(selectedDate);
    const blockedEntry = blockedDates.find((item) => {
      const blockedDateStr = formatDateToString(new Date(item.date));
      return blockedDateStr === selectedDateStr;
    });
    return blockedEntry || null;
  };

  const blockedDateInfo = getBlockedDateInfo();

  // Pagination calculations for blocked dates
  const totalBlockedDates = blockedDates.length;
  const totalBlockedPages = Math.ceil(totalBlockedDates / blockedDatesPerPage);
  const startIndex = (blockedDatesPage - 1) * blockedDatesPerPage;
  const endIndex = startIndex + blockedDatesPerPage;
  const paginatedBlockedDates = blockedDates.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (blockedDatesPage > totalBlockedPages && totalBlockedPages > 0) {
      setBlockedDatesPage(1);
    }
  }, [blockedDates, blockedDatesPage, totalBlockedPages]);

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
          isBlocked={!!blockedDateInfo}
          blockedReason={blockedDateInfo?.reason}
        />
      </div>

      {/* Blocked Dates Section */}
      <Card padding="p-0">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <CalendarX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">วันปิดการจอง</h3>
              <p className="text-sm text-gray-500">กำหนดวันที่ไม่เปิดให้จอง (เช่น วันจัดแข่งขัน)</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Add New Blocked Date */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                min={getTodayString()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={newBlockedReason}
                onChange={(e) => setNewBlockedReason(e.target.value)}
                placeholder="เหตุผล (เช่น วันจัดแข่งขัน)"
                maxLength={200}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <Button
              type="button"
              variant="danger"
              onClick={handleAddBlockedDate}
              disabled={addingBlocked || !newBlockedDate}
              icon={addingBlocked ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            >
              เพิ่ม
            </Button>
          </div>

          {/* Blocked Dates List */}
          {blockedDates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarX className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>ยังไม่มีวันปิดการจอง</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Total count */}
              <div className="text-sm text-gray-500">
                ทั้งหมด {totalBlockedDates} รายการ
              </div>

              {/* List */}
              <div className="space-y-2">
                {paginatedBlockedDates.map((item, index) => (
                  <div
                    key={startIndex + index}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {formatBlockedDate(item.date)}
                      </p>
                      {item.reason && (
                        <p className="text-sm text-gray-600">{item.reason}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedDate(formatDateToString(new Date(item.date)))}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalBlockedPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    หน้า {blockedDatesPage} จาก {totalBlockedPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBlockedDatesPage((prev) => Math.max(prev - 1, 1))}
                      disabled={blockedDatesPage === 1}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="หน้าก่อน"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalBlockedPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setBlockedDatesPage(pageNum)}
                          className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                            pageNum === blockedDatesPage
                              ? 'bg-red-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setBlockedDatesPage((prev) => Math.min(prev + 1, totalBlockedPages))}
                      disabled={blockedDatesPage === totalBlockedPages}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="หน้าถัดไป"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

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
