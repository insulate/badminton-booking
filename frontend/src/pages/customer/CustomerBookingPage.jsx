import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame, Calendar, Clock, Info, CheckCircle, Ticket, CalendarX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customerBookingsAPI, settingsAPI } from '../../lib/api';
import usePlayerAuthStore from '../../store/playerAuthStore';
import BookingSlotModal from '../../components/customer/BookingSlotModal';
import { ROUTES } from '../../constants';

export default function CustomerBookingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, player, initAuth } = usePlayerAuthStore();

  const [selectedDate, setSelectedDate] = useState(new Date());

  // Initialize auth state from localStorage
  useEffect(() => {
    initAuth();
  }, [initAuth]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  
  // Date strip state
  const [dateList, setDateList] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(14);
  const dateScrollRef = useRef(null);

  // Initialize dates and fetch settings + blocked dates
  useEffect(() => {
    const initDatesAndSettings = async () => {
      // Fetch advance booking days from settings
      let days = 14;
      try {
        const venueRes = await settingsAPI.getVenueInfo();
        if (venueRes.success && venueRes.data?.booking?.advanceBookingDays) {
          days = venueRes.data.booking.advanceBookingDays;
          setAdvanceBookingDays(days);
        }
      } catch (error) {
        console.error('Error fetching venue info:', error);
      }

      // Generate date list based on settings
      const dates = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d);
      }
      setDateList(dates);

      // Fetch blocked dates
      try {
        const response = await settingsAPI.getBlockedDates();
        if (response.success) {
          setBlockedDates(response.data.map(d => {
            const date = new Date(d.date);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
          }));
        }
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
      }
    };
    initDatesAndSettings();
  }, []);

  // Check if a date is blocked
  const isDateBlocked = (date) => {
    const dateTime = new Date(date);
    dateTime.setHours(0, 0, 0, 0);
    return blockedDates.includes(dateTime.getTime());
  };

  // Load availability when date changes
  useEffect(() => {
    loadAvailability();
  }, [selectedDate]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      // Use local date format to avoid timezone issues
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
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

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const scrollDates = (direction) => {
    if (dateScrollRef.current) {
      const scrollAmount = 200;
      dateScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Format helper
  const isSameDay = (d1, d2) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const getDayName = (date) => {
    const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    return days[date.getDay()];
  };

  const getDateNumber = (date) => date.getDate();

  // Get status color for cards
  const getStatusColor = (percentage) => {
    if (percentage > 50) return 'text-emerald-600 bg-emerald-50/50 border-emerald-100';
    if (percentage >= 20) return 'text-amber-600 bg-amber-50/50 border-amber-100';
    return 'text-rose-600 bg-rose-50/50 border-rose-100';
  };
  
  const getProgressBarColor = (percentage) => {
    if (percentage > 50) return 'bg-gradient-to-r from-emerald-400 to-emerald-600';
    if (percentage >= 20) return 'bg-gradient-to-r from-amber-400 to-amber-600';
    return 'bg-gradient-to-r from-rose-400 to-rose-600';
  };

  const getCardBorderTopColor = (percentage) => {
    if (percentage > 50) return 'border-t-emerald-400';
    if (percentage >= 20) return 'border-t-amber-400';
    return 'border-t-rose-400';
  };

  // Handle slot click
  const handleSlotClick = (slot) => {
    if (slot.availableCount < 1) return;

    // รอให้ auth state โหลดเสร็จก่อน
    if (authLoading) {
      toast.loading('กำลังตรวจสอบสถานะ...', { duration: 1000 });
      return;
    }

    if (!isAuthenticated) {
      navigate(`${ROUTES.CUSTOMER.LOGIN}?redirect=${ROUTES.CUSTOMER.BOOKING}`);
      return;
    }

    setSelectedSlot(slot);
    setShowSlotModal(true);
  };

  // Handle booking success - redirect to payment page
  const handleBookingSuccess = (booking) => {
    setShowSlotModal(false);
    // Redirect to payment page
    navigate(ROUTES.CUSTOMER.PAYMENT(booking._id));
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50 pb-12">
      {/* Header Section with Gradient */}
      <div className="bg-white/80 backdrop-blur-md border-b border-indigo-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-md mx-auto px-4 py-4 md:max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-2">
                <Ticket className="w-6 h-6 text-indigo-600" />
                จองสนามแบดมินตัน
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-1 ml-1">
                {selectedDate.toLocaleDateString('th-TH', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            {/* Legend */}
            <div className="hidden sm:flex gap-3 text-xs font-medium bg-white/50 px-3 py-1.5 rounded-full border border-indigo-50">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-200"></div>
                <span className="text-slate-600">ว่างมาก</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 shadow-sm shadow-amber-200"></div>
                <span className="text-slate-600">ว่างน้อย</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-400 to-rose-600 shadow-sm shadow-rose-200"></div>
                <span className="text-slate-600">เต็ม</span>
              </div>
            </div>
          </div>

          {/* Date Scroller */}
          <div className="relative group">
            <button 
              onClick={() => scrollDates('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-lg text-indigo-600 hover:text-indigo-800 hover:scale-110 border border-indigo-100 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div 
              ref={dateScrollRef}
              className="flex overflow-x-auto gap-3 pb-4 pt-2 scrollbar-hide -mx-4 px-4 scroll-smooth"
            >
              {dateList.map((date, index) => {
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());
                const blocked = isDateBlocked(date);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[3.8rem] h-[5rem] rounded-2xl transition-all duration-300 border relative overflow-hidden ${
                      blocked
                        ? 'bg-red-50 text-red-400 border-red-200 opacity-80'
                        : isSelected
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/30 scale-105 -translate-y-1'
                        : 'bg-white text-slate-500 border-indigo-50 hover:border-blue-300 hover:bg-blue-50 hover:-translate-y-0.5 hover:shadow-md'
                    }`}
                  >
                    {/* Background blob for unselected */}
                    {!isSelected && !blocked && (
                      <div className="absolute -top-4 -right-4 w-8 h-8 bg-indigo-50 rounded-full blur-xl"></div>
                    )}

                    <span className="text-[0.7rem] font-semibold uppercase tracking-wider mb-0.5 opacity-90">{getDayName(date)}</span>
                    <span className={`text-2xl font-black ${blocked ? 'text-red-400' : isSelected ? 'text-white' : 'text-slate-700'}`}>
                      {getDateNumber(date)}
                    </span>
                    {blocked ? (
                      <span className="text-[0.55rem] mt-1 px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-600">
                        ปิด
                      </span>
                    ) : isToday && (
                      <span className={`text-[0.6rem] mt-1 px-2 py-0.5 rounded-full font-bold shadow-sm ${
                        isSelected
                          ? 'bg-white/20 text-white backdrop-blur-sm'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                      }`}>
                        วันนี้
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => scrollDates('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-lg text-indigo-600 hover:text-indigo-800 hover:scale-110 border border-indigo-100 opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 md:max-w-4xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
            <p className="text-indigo-600 font-medium animate-pulse">กำลังโหลดตารางเวลา...</p>
          </div>
        ) : availability?.isBlocked ? (
          /* Show blocked message when date is blocked */
          <div className="flex flex-col items-center justify-center py-16 bg-red-50 rounded-2xl border border-red-200">
            <div className="p-4 bg-red-100 rounded-full mb-4">
              <CalendarX className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-red-700 mb-2">ไม่เปิดให้จองในวันนี้</h3>
            <p className="text-red-600 text-center max-w-sm">
              {availability?.blockedReason || 'วันนี้ไม่เปิดให้จอง กรุณาเลือกวันอื่น'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-indigo-100 shadow-sm bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-indigo-50/50 border-b border-indigo-100 text-xs uppercase tracking-wider text-indigo-900 font-semibold">
                <th className="px-6 py-4 whitespace-nowrap">เวลา</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">ราคา</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">สถานะ</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {availability?.availability?.map((slot) => {
                const isAvailable = slot.availableCount > 0;
                const percentage = (slot.availableCount / slot.totalCourts) * 100;
                
                const price = player?.isMember
                  ? slot.pricing.member
                  : slot.pricing.normal;

                return (
                  <tr 
                    key={slot.timeSlotId} 
                    className={`group transition-all duration-200 ${
                      isAvailable ? 'hover:bg-indigo-50/30' : 'bg-slate-50 opacity-70'
                    }`}
                  >
                    {/* Time Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isAvailable ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Clock size={18} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-bold ${isAvailable ? 'text-slate-800' : 'text-slate-500'}`}>
                              {slot.startTime} - {slot.endTime.split(':')[0]}:00 น.
                            </span>
                            {slot.peakHour && (
                              <div className="flex items-center gap-0.5 text-[0.6rem] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full font-bold border border-orange-100">
                                <Flame size={8} fill="currentColor" />
                                PEAK
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price Column */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className={`text-base font-bold ${
                          isAvailable 
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600' 
                            : 'text-slate-400'
                        }`}>
                          ฿{price}
                        </span>
                        {player?.isMember && (
                          <span className="text-[0.6rem] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 mt-0.5">
                            ราคาสมาชิก
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1.5">
                         <span className={`text-xs font-bold flex items-center gap-1.5 ${
                          percentage > 50 ? 'text-emerald-600' : 
                          percentage >= 20 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {isAvailable ? (
                            <>
                              <div className={`w-2 h-2 rounded-full ${
                                percentage > 50 ? 'bg-emerald-500' : 
                                percentage >= 20 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}></div>
                              ว่าง {slot.availableCount} สนาม
                            </>
                          ) : 'เต็มแล้ว'}
                        </span>
                        
                        {/* Progress Bar */}
                        <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentage > 50 ? 'bg-emerald-500' : 
                              percentage >= 20 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {isAvailable ? (
                        <button 
                          onClick={() => handleSlotClick(slot)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 rounded-lg shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:-translate-y-0.5 transition-all active:scale-95"
                        >
                          จองเลย <ChevronRight size={14} />
                        </button>
                      ) : (
                        <span className="inline-block text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                          เต็ม
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
        
        {/* Info Text */}
        {!loading && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 flex gap-4 border border-blue-100 shadow-sm">
             <div className="bg-white p-2.5 rounded-xl shadow-sm text-blue-600 h-fit">
               <Info className="w-6 h-6" />
             </div>
             <div>
               <h4 className="font-bold text-blue-900 mb-1">คำแนะนำการจอง</h4>
               <p className="text-sm text-blue-700/80 leading-relaxed">
                 เลือกเวลาที่ต้องการจองเพื่อดูรายละเอียดสนาม หากเป็นสมาชิกจะได้รับส่วนลดพิเศษทันที 
                 สามารถจองล่วงหน้าได้สูงสุด {advanceBookingDays} วัน กรุณามาก่อนเวลาจองอย่างน้อย 10 นาที
               </p>
             </div>
          </div>
        )}
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
    </div>
  );
}
