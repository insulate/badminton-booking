import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomerBookingPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mockup courts data
  const courts = [
    { id: 1, name: 'Court 1' },
    { id: 2, name: 'Court 2' },
    { id: 3, name: 'Court 3' },
    { id: 4, name: 'Court 4' },
    { id: 5, name: 'Court 5' },
    { id: 6, name: 'Court 6' },
    { id: 7, name: 'Court 7' },
    { id: 8, name: 'Court 8' },
  ];

  // Time slots from 08:00 to 24:00
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00',
  ];

  // Check if selected date is Sunday (for operating hours)
  const isSunday = selectedDate.getDay() === 0;
  const availableSlots = isSunday
    ? timeSlots.filter((slot) => {
        const hour = parseInt(slot.split(':')[0]);
        return hour < 22; // Sunday closes at 22:00
      })
    : timeSlots;

  // Generate random mockup availability based on date seed
  const mockupAvailability = useMemo(() => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const seed = dateString.split('-').reduce((acc, val) => acc + parseInt(val), 0);

    const availability = {};
    courts.forEach((court) => {
      availability[court.id] = {};
      availableSlots.forEach((slot, index) => {
        // Create deterministic "random" based on court, slot, and date
        const hash = (court.id * 17 + index * 31 + seed * 13) % 100;
        // More booked slots during peak hours (17:00-21:00)
        const hour = parseInt(slot.split(':')[0]);
        const isPeakHour = hour >= 17 && hour <= 21;
        const threshold = isPeakHour ? 60 : 30;
        availability[court.id][slot] = hash > threshold;
      });
    });
    return availability;
  }, [selectedDate, availableSlots]);

  // Navigate dates
  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    // Don't go before today
    if (newDate >= new Date().setHours(0, 0, 0, 0)) {
      setSelectedDate(newDate);
    }
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    // Allow up to 2 months ahead
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);
    if (newDate <= maxDate) {
      setSelectedDate(newDate);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('th-TH', options);
  };

  const formatDateShort = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Count available slots
  const availableCount = useMemo(() => {
    let count = 0;
    Object.values(mockupAvailability).forEach((courtSlots) => {
      Object.values(courtSlots).forEach((isAvailable) => {
        if (isAvailable) count++;
      });
    });
    return count;
  }, [mockupAvailability]);

  const totalSlots = courts.length * availableSlots.length;

  return (
    <div className="min-h-full p-4">
      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-white mb-1">
          Reservation Courts
        </h1>
        <p className="text-blue-200 text-sm">
          ตารางการจองสนาม Lucky Badminton
        </p>
      </div>

      {/* Date Picker */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 max-w-xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-lg bg-blue-800/50 text-white hover:bg-blue-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedDate <= new Date().setHours(0, 0, 0, 0)}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="text-center">
            <p className="text-yellow-400 font-bold text-lg">
              {formatDateShort(selectedDate)}
            </p>
            <p className="text-blue-200 text-xs">
              {formatDate(selectedDate)}
            </p>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-lg bg-blue-800/50 text-white hover:bg-blue-700/50 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Availability Summary */}
        <div className="mt-3 flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-white">ว่าง ({availableCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500/80 rounded"></div>
            <span className="text-white">จองแล้ว ({totalSlots - availableCount})</span>
          </div>
        </div>

        {isSunday && (
          <p className="text-center text-yellow-400 text-xs mt-2">
            * วันอาทิตย์เปิด 08:00 - 22:00 น.
          </p>
        )}
      </div>

      {/* Court Schedule Grid */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            {/* Header - Time Slots */}
            <thead>
              <tr className="bg-blue-950/50">
                <th className="sticky left-0 bg-blue-950 px-3 py-2 text-left text-xs font-semibold text-yellow-400 min-w-[80px] z-10">
                  สนาม
                </th>
                {availableSlots.map((slot) => (
                  <th
                    key={slot}
                    className="px-1 py-2 text-center text-xs font-medium text-blue-200 min-w-[50px]"
                  >
                    {slot}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body - Courts and Availability */}
            <tbody className="divide-y divide-white/5">
              {courts.map((court) => (
                <tr key={court.id} className="hover:bg-white/5">
                  <td className="sticky left-0 bg-blue-900/80 px-3 py-2 text-xs font-medium text-white z-10">
                    {court.name}
                  </td>
                  {availableSlots.map((slot) => {
                    const isAvailable = mockupAvailability[court.id]?.[slot];
                    return (
                      <td key={`${court.id}-${slot}`} className="px-1 py-1.5 text-center">
                        <div
                          className={`
                            w-full h-8 rounded flex items-center justify-center text-xs font-medium
                            ${isAvailable
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500/80 text-white/80'
                            }
                          `}
                        >
                          {isAvailable ? 'ว่าง' : 'เต็ม'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-4 text-center">
        <p className="text-blue-200 text-xs">
          * ข้อมูลการจองอาจมีการเปลี่ยนแปลง กรุณาติดต่อสอบถามก่อนเข้าใช้บริการ
        </p>
        <p className="text-yellow-400 text-sm mt-2 font-medium">
          TEL: 099-999-9999 | LINE: @luckybadminton
        </p>
      </div>
    </div>
  );
}
