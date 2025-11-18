import { useState } from 'react';

/**
 * CourtScheduleGrid Component
 * ตารางแสดงสนาม x ช่วงเวลา พร้อมสถานะว่าง/จองแล้ว
 */
const CourtScheduleGrid = ({ schedule, onSlotClick, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดตารางสนาม...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!schedule || !schedule.courts || schedule.courts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีข้อมูลตารางสนาม</h3>
          <p className="mt-1 text-sm text-gray-500">กรุณาเลือกวันที่เพื่อดูตารางสนาม</p>
        </div>
      </div>
    );
  }

  const { courts, timeSlots } = schedule;

  // Get court type badge color
  const getCourtTypeBadge = (type) => {
    const badges = {
      normal: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'ธรรมดา' },
      premium: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'พรีเมี่ยม' },
      tournament: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'แข่งขัน' },
    };
    return badges[type] || badges.normal;
  };

  // Get slot status color
  const getSlotColor = (slot) => {
    if (!slot.available) {
      return 'bg-red-100 border-red-300 cursor-not-allowed';
    }
    if (slot.peakHour) {
      return 'bg-orange-50 border-orange-300 hover:bg-orange-100 cursor-pointer';
    }
    return 'bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer';
  };

  // Handle slot click
  const handleSlotClick = (court, slot) => {
    if (slot.available) {
      onSlotClick({
        court,
        timeSlot: {
          timeSlotId: slot.timeSlotId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          peakHour: slot.peakHour,
        },
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">ตารางสนาม</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
            <span className="text-sm text-gray-600">ว่าง</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-50 border-2 border-orange-300 rounded"></div>
            <span className="text-sm text-gray-600">ว่าง (Peak Hour)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
            <span className="text-sm text-gray-600">จองแล้ว</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                สนาม
              </th>
              {timeSlots.map((timeSlot) => (
                <th
                  key={timeSlot.timeSlotId}
                  className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]"
                >
                  <div>{timeSlot.startTime}</div>
                  <div className="text-gray-400 normal-case">-{timeSlot.endTime}</div>
                  {timeSlot.peakHour && (
                    <div className="mt-1">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                        Peak
                      </span>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courts.map((court) => {
              return (
                <tr key={court.courtId} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                    <div>
                      <div className="font-semibold">{court.courtNumber}</div>
                      <div className="text-xs text-gray-500">{court.courtName}</div>
                    </div>
                  </td>
                  {court.slots.map((slot, index) => (
                    <td key={`${court.courtId}-${index}`} className="px-2 py-2">
                      <div
                        onClick={() => handleSlotClick(court, slot)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${getSlotColor(
                          slot
                        )}`}
                        title={
                          slot.available
                            ? 'คลิกเพื่อจอง'
                            : `จองโดย: ${slot.booking?.customerName || 'N/A'}`
                        }
                      >
                        {slot.available ? (
                          <div className="text-xs font-semibold text-green-700">ว่าง</div>
                        ) : (
                          <div className="text-xs">
                            <div className="font-semibold text-red-700">จองแล้ว</div>
                            <div className="text-red-600 mt-0.5">
                              {slot.booking?.customerName || ''}
                            </div>
                            <div className="text-red-500 text-[10px] mt-0.5">
                              {slot.booking?.customerPhone || ''}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-600">
            ทั้งหมด {courts.length} สนาม × {timeSlots.length} ช่วงเวลา ={' '}
            {courts.length * timeSlots.length} ช่อง
          </div>
          <div className="text-gray-600">
            ว่าง:{' '}
            <span className="font-semibold text-green-600">
              {courts.reduce(
                (total, court) =>
                  total + court.slots.filter((slot) => slot.available).length,
                0
              )}
            </span>{' '}
            ช่อง
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtScheduleGrid;
