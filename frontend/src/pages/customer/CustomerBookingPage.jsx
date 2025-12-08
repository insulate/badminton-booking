import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customerBookingsAPI } from '../../lib/api';
import usePlayerAuthStore from '../../store/playerAuthStore';
import BookingSlotModal from '../../components/customer/BookingSlotModal';
import BookingSuccessModal from '../../components/customer/BookingSuccessModal';
import { ROUTES } from '../../constants';

export default function CustomerBookingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, player } = usePlayerAuthStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  // Load availability when date changes
  useEffect(() => {
    loadAvailability();
  }, [selectedDate]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await customerBookingsAPI.getAvailability(dateStr);
      if (response.success) {
        setAvailability(response.data);
      }
    } catch (error) {
      console.error('Load availability error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลสนามว่างได้');
    } finally {
      setLoading(false);
    }
  };

  // Navigate dates
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate >= today) {
      setSelectedDate(newDate);
    }
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);
    if (newDate <= maxDate) {
      setSelectedDate(newDate);
    }
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateShort = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + 543;
    return `${day}/${month}/${year}`;
  };

  // Get progress bar color
  const getProgressColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return 'bg-green-500';
    if (percentage >= 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get status text color
  const getStatusColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return 'text-green-400';
    if (percentage >= 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Handle slot click
  const handleSlotClick = (slot) => {
    if (slot.availableCount < 1) return;

    if (!isAuthenticated) {
      navigate(`${ROUTES.CUSTOMER.LOGIN}?redirect=${ROUTES.CUSTOMER.BOOKING}`);
      return;
    }

    setSelectedSlot(slot);
    setShowSlotModal(true);
  };

  // Handle booking success
  const handleBookingSuccess = (booking) => {
    setCreatedBooking(booking);
    setShowSlotModal(false);
    setShowSuccessModal(true);
    loadAvailability(); // Refresh availability
  };

  return (
    <div className="min-h-full p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">จองสนาม</h1>
        <p className="text-blue-200 text-sm">เลือกวันและเวลาที่ต้องการ</p>
      </div>

      {/* Date Picker */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-lg bg-blue-800/50 text-white hover:bg-blue-700/50 transition-colors disabled:opacity-50"
            disabled={selectedDate <= new Date().setHours(0, 0, 0, 0)}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="text-center">
            <p className="text-yellow-400 font-bold text-lg">
              {formatDateShort(selectedDate)}
            </p>
            <p className="text-blue-200 text-xs">{formatDate(selectedDate)}</p>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-lg bg-blue-800/50 text-white hover:bg-blue-700/50 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10">
            {/* Table Header */}
            <div className="bg-blue-950/50 px-4 py-3 border-b border-white/10">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-blue-300 uppercase">
                <div className="col-span-2">เวลา</div>
                <div className="col-span-5 hidden sm:block">สถานะ</div>
                <div className="col-span-4 sm:col-span-2 text-center">ว่าง</div>
                <div className="col-span-3 sm:col-span-2 text-center">ราคา</div>
                <div className="col-span-3 sm:col-span-1 text-center"></div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-white/5">
              {availability?.availability?.map((slot) => {
                const isAvailable = slot.availableCount > 0;
                const percentage = (slot.availableCount / slot.totalCourts) * 100;
                const price = player?.isMember
                  ? slot.pricing.member
                  : slot.pricing.normal;

                return (
                  <div
                    key={slot.timeSlotId}
                    className={`px-4 py-3 transition-colors ${
                      isAvailable ? 'hover:bg-white/5' : 'opacity-50'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-2 items-center">
                      {/* Time */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <span className="text-white font-medium text-sm">
                            {slot.startTime}
                          </span>
                          {slot.peakHour && (
                            <Flame className="w-3 h-3 text-orange-400" />
                          )}
                        </div>
                      </div>

                      {/* Progress Bar - Hidden on mobile */}
                      <div className="col-span-5 hidden sm:block">
                        <div className="flex items-center gap-2">
                          {/* Progress Bar */}
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressColor(
                                slot.availableCount,
                                slot.totalCourts
                              )}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-blue-300 w-10 text-right">
                            {Math.round(percentage)}%
                          </span>
                        </div>
                      </div>

                      {/* Available Count */}
                      <div className="col-span-4 sm:col-span-2 text-center">
                        {isAvailable ? (
                          <span className={`text-sm font-medium ${getStatusColor(
                            slot.availableCount,
                            slot.totalCourts
                          )}`}>
                            {slot.availableCount}/{slot.totalCourts}
                            <span className="text-blue-300 ml-1 hidden sm:inline">ว่าง</span>
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-red-400">
                            เต็ม
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="col-span-3 sm:col-span-2 text-center">
                        <span className="text-white font-medium text-sm">
                          ฿{price}
                        </span>
                      </div>

                      {/* Action Button */}
                      <div className="col-span-3 sm:col-span-1 text-center">
                        {isAvailable ? (
                          <button
                            onClick={() => handleSlotClick(slot)}
                            className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-blue-900 text-xs font-semibold rounded-lg transition-colors"
                          >
                            จอง
                          </button>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-blue-300">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>ว่างมาก (&gt;50%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>ว่างน้อย</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>เต็ม</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" />
            <span>Peak Hour</span>
          </div>
        </div>
      </div>

      {/* Slot Modal */}
      <BookingSlotModal
        isOpen={showSlotModal}
        onClose={() => setShowSlotModal(false)}
        slot={selectedSlot}
        selectedDate={selectedDate}
        player={player}
        availability={availability?.availability}
        onSuccess={handleBookingSuccess}
      />

      {/* Success Modal */}
      <BookingSuccessModal
        isOpen={showSuccessModal}
        booking={createdBooking}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
