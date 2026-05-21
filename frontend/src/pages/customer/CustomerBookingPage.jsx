import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarX, Flame } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customerBookingsAPI, settingsAPI } from '../../lib/api';
import usePlayerAuthStore from '../../store/playerAuthStore';
import { formatDateToString } from '../../utils/dateUtils';
import { ROUTES } from '../../constants';

const getDayName = (date) => {
  const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  return days[date.getDay()];
};

const getMonthShort = (date) =>
  date.toLocaleDateString('th-TH', { month: 'short' }).replace('.', '');

const isSameDay = (d1, d2) =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

const formatDuration = (d) => {
  if (d === 0.5) return '30น.';
  if (d % 1 === 0) return `${d}ชม.`;
  return `${Math.floor(d)}ชม.30น.`;
};

const calcEndTime = (startTime, duration) => {
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + duration * 60;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export default function CustomerBookingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, player, initAuth } = usePlayerAuthStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [availableCourts, setAvailableCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [courtsLoading, setCourtsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [dateList, setDateList] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(14);
  const dateScrollRef = useRef(null);

  useEffect(() => { initAuth(); }, [initAuth]);

  useEffect(() => {
    const init = async () => {
      let days = 14;
      try {
        const res = await settingsAPI.getVenueInfo();
        if (res.success && res.data?.booking?.advanceBookingDays) {
          days = res.data.booking.advanceBookingDays;
          setAdvanceBookingDays(days);
        }
      } catch { /* keep default */ }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setDateList(
        Array.from({ length: days }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          return d;
        })
      );

      try {
        const res = await settingsAPI.getBlockedDates();
        if (res.success) {
          setBlockedDates(
            res.data.map((d) => {
              const dt = new Date(d.date);
              dt.setHours(0, 0, 0, 0);
              return dt.getTime();
            })
          );
        }
      } catch { /* ignore */ }
    };
    init();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setSelectedSlot(null);
      setSelectedCourt(null);
      try {
        const res = await customerBookingsAPI.getAvailability(formatDateToString(selectedDate));
        if (res.success) setAvailability(res.data);
      } catch {
        toast.error('ไม่สามารถโหลดข้อมูลสนามว่างได้');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedSlot) return;
    const load = async () => {
      setCourtsLoading(true);
      setSelectedCourt(null);
      try {
        const res = await customerBookingsAPI.getCourtAvailability({
          date: formatDateToString(selectedDate),
          timeSlotId: selectedSlot.timeSlotId,
          duration: selectedDuration,
          startMinute: 0,
        });
        setAvailableCourts(res.data?.courts || []);
      } catch {
        setAvailableCourts([]);
      } finally {
        setCourtsLoading(false);
      }
    };
    load();
  }, [selectedSlot, selectedDuration]);

  const isDateBlocked = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return blockedDates.includes(d.getTime());
  };

  const slotIndex = useMemo(() => {
    if (!selectedSlot || !availability?.availability) return 0;
    return availability.availability.findIndex((s) => s.timeSlotId === selectedSlot.timeSlotId);
  }, [selectedSlot, availability]);

  const maxDuration = useMemo(() => {
    if (!availability?.availability || !selectedSlot) return 1;
    let max = 1;
    for (let i = slotIndex; i < availability.availability.length && i < slotIndex + 8; i++) {
      if (availability.availability[i].availableCount < 1) break;
      max = i - slotIndex + 1;
    }
    return max;
  }, [availability, slotIndex, selectedSlot]);

  const durationOptions = useMemo(
    () => Array.from({ length: maxDuration * 2 }, (_, i) => (i + 1) * 0.5),
    [maxDuration]
  );

  const pricePerHour = selectedSlot
    ? (player?.isMember ? selectedSlot.pricing.member : selectedSlot.pricing.normal)
    : 0;
  const totalPrice = pricePerHour * selectedDuration;
  const endTime = selectedSlot ? calcEndTime(selectedSlot.startTime, selectedDuration) : '';

  const handleDateSelect = (date) => {
    if (isDateBlocked(date)) return;
    setSelectedDate(date);
  };

  const handleSlotSelect = (slot) => {
    if (slot.availableCount === 0) return;
    if (authLoading) {
      toast.loading('กำลังตรวจสอบสถานะ...', { duration: 1000 });
      return;
    }
    if (!isAuthenticated) {
      navigate(`${ROUTES.CUSTOMER.LOGIN}?redirect=${ROUTES.CUSTOMER.BOOKING}`);
      return;
    }
    if (selectedSlot?.timeSlotId === slot.timeSlotId) return;
    setSelectedSlot(slot);
    setSelectedDuration(1);
    setSelectedCourt(null);
  };

  const handleDurationSelect = (d) => {
    setSelectedDuration(d);
    setSelectedCourt(null);
  };

  const handleBookNow = async () => {
    if (!selectedSlot || !selectedCourt || booking) return;
    setBooking(true);
    try {
      const res = await customerBookingsAPI.create({
        date: formatDateToString(selectedDate),
        timeSlot: selectedSlot.timeSlotId,
        duration: selectedDuration,
        court: selectedCourt._id,
      });
      if (res.success) {
        navigate(ROUTES.CUSTOMER.PAYMENT(res.data._id));
      } else {
        toast.error(res.message || 'ไม่สามารถจองได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการจอง');
    } finally {
      setBooking(false);
    }
  };

  const isBookReady = !!(selectedSlot && selectedCourt);
  const bookLabel = booking
    ? 'กำลังจอง...'
    : !selectedSlot
    ? 'เลือกวันที่และเวลาให้ครบ'
    : !selectedCourt
    ? 'เลือกสนามให้ครบ'
    : `จองเลย — ฿${totalPrice.toLocaleString()}`;

  return (
    <div className="min-h-full bg-gray-50 pb-24">
      {/* ──────── Sticky Header ──────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          {/* Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm shadow-blue-200 shrink-0">
              🏸
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-800 leading-tight">จองคอร์ทแบดมินตัน</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedDate.toLocaleDateString('th-TH', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Step 1 Label */}
          <div className="flex items-center gap-2 mb-2.5">
            <StepBadge n={1} />
            <span className="text-sm font-semibold text-gray-700">เลือกวันที่</span>
          </div>

          {/* Date Cards */}
          <div
            ref={dateScrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
          >
            {dateList.map((date, i) => {
              const selected = isSameDay(date, selectedDate);
              const today = isSameDay(date, new Date());
              const blocked = isDateBlocked(date);
              return (
                <button
                  key={i}
                  onClick={() => !blocked && handleDateSelect(date)}
                  className={`shrink-0 flex flex-col items-center justify-center w-14 rounded-xl border-2 py-2 transition-all duration-200 ${
                    blocked
                      ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed'
                      : selected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 scale-105'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className="text-[0.6rem] font-semibold">{getDayName(date)}</span>
                  <span className="text-lg font-black leading-none my-0.5">{date.getDate()}</span>
                  <span className={`text-[0.55rem] font-medium ${selected ? 'text-blue-100' : blocked ? 'text-red-400' : 'text-gray-400'}`}>
                    {blocked ? 'ปิด' : today ? 'วันนี้' : getMonthShort(date)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ──────── Scrollable Content ──────── */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600 mb-3" />
            <p className="text-sm text-blue-600 font-medium animate-pulse">กำลังโหลดตารางเวลา...</p>
          </div>
        ) : availability?.isBlocked ? (
          <div className="flex flex-col items-center justify-center py-16 bg-red-50 rounded-2xl border border-red-200">
            <div className="p-4 bg-red-100 rounded-full mb-4">
              <CalendarX className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-red-700 mb-1">ไม่เปิดให้จองในวันนี้</h3>
            <p className="text-sm text-red-600 text-center px-6">
              {availability?.blockedReason || 'วันนี้ไม่เปิดให้จอง กรุณาเลือกวันอื่น'}
            </p>
          </div>
        ) : (
          <>
            {/* Step 2: Time + Duration */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <StepBadge n={2} />
                <span className="text-sm font-semibold text-gray-700">เลือกเวลาและระยะเวลา</span>
              </div>

              {/* Time Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {availability?.availability?.map((slot) => {
                  const sel = selectedSlot?.timeSlotId === slot.timeSlotId;
                  const full = slot.availableCount === 0;
                  return (
                    <button
                      key={slot.timeSlotId}
                      onClick={() => handleSlotSelect(slot)}
                      disabled={full}
                      className={`flex flex-col items-center justify-center py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        sel
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-100'
                          : full
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <span className="text-xs">{slot.startTime}</span>
                      {slot.peakHour && (
                        <span className={`flex items-center gap-0.5 text-[0.5rem] font-bold mt-0.5 ${sel ? 'text-blue-100' : 'text-orange-500'}`}>
                          <Flame className="w-2.5 h-2.5" fill="currentColor" />
                          PEAK
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Duration Selector */}
              {selectedSlot ? (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-gray-500 mb-2.5">ระยะเวลา</p>
                  <div className="flex flex-wrap gap-2">
                    {durationOptions.map((d) => (
                      <button
                        key={d}
                        onClick={() => handleDurationSelect(d)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                          selectedDuration === d
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {formatDuration(d)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 text-center">
                    {selectedSlot.startTime} – {endTime} น. &nbsp;·&nbsp; {formatDuration(selectedDuration)}
                    &nbsp;·&nbsp; ฿{pricePerHour}/ชม.
                    {player?.isMember && (
                      <span className="ml-1.5 text-emerald-600 font-semibold">(ราคาสมาชิก)</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-xs text-gray-400 text-center">กดเลือกเวลาที่ต้องการด้านบน</p>
              )}
            </div>

            {/* Step 3: Court Selection */}
            {selectedSlot && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <StepBadge n={3} />
                  <span className="text-sm font-semibold text-gray-700">เลือกสนาม</span>
                </div>

                {courtsLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : availableCourts.length === 0 ? (
                  <p className="text-sm text-red-500 text-center py-4">ไม่มีสนามว่างในช่วงเวลานี้</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableCourts.map((court) => {
                      const sel = selectedCourt?._id === court._id;
                      const avail = court.isAvailable !== false;
                      return (
                        <button
                          key={court._id}
                          onClick={() => avail && setSelectedCourt(court)}
                          disabled={!avail}
                          className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                            sel
                              ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
                              : avail
                              ? 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                              : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <span className="text-sm font-bold text-gray-800 truncate w-full">
                            {court.name || `สนาม ${court.courtNumber}`}
                          </span>
                          <span className={`text-xs mt-1 font-medium ${avail ? 'text-emerald-600' : 'text-red-500'}`}>
                            {avail ? 'ว่าง' : 'จองแล้ว'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ──────── Fixed Bottom Button ──────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-lg px-4 py-3 z-30">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleBookNow}
            disabled={!isBookReady || booking}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
              isBookReady && !booking
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-100'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {bookLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepBadge({ n }) {
  return (
    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
      {n}
    </span>
  );
}
