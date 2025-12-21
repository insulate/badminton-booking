import { useState } from 'react';
import { X, CalendarX } from 'lucide-react';

/**
 * CourtScheduleGrid Component
 * ตารางแสดงสนาม x ช่วงเวลา พร้อมสถานะว่าง/จองแล้ว
 */
const CourtScheduleGrid = ({ schedule, onSlotClick, loading, isBlocked = false, blockedReason = '' }) => {
  const [selectedBooking, setSelectedBooking] = useState(null);
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
    // Date is blocked - show all available slots as blocked
    if (isBlocked && slot.available) {
      return 'bg-gray-200 border-gray-400 cursor-not-allowed opacity-60';
    }

    // Blocked by Group Play
    if (slot.blockedByGroupPlay) {
      return 'bg-purple-100 border-purple-400 cursor-not-allowed';
    }

    // Booked slots
    if (!slot.available) {
      // Booked and paid = green
      if (slot.booking?.paymentStatus === 'paid') {
        return 'bg-green-100 border-green-400 hover:bg-green-200 hover:shadow-md cursor-pointer';
      }
      // Booked but not paid = red
      return 'bg-red-100 border-red-300 hover:bg-red-200 hover:shadow-md cursor-pointer';
    }

    // Available slots
    // Available + Peak Hour = orange/yellow
    if (slot.peakHour) {
      return 'bg-orange-50 border-orange-300 hover:bg-orange-100 cursor-pointer';
    }
    // Available + Normal = blue
    return 'bg-blue-50 border-blue-300 hover:bg-blue-100 cursor-pointer';
  };

  // Handle slot click
  const handleSlotClick = (court, slot) => {
    // Date is blocked - do nothing for available slots
    if (isBlocked && slot.available) {
      onSlotClick({ court, timeSlot: slot }); // Let parent handle the error message
      return;
    }

    // Blocked by Group Play - do nothing
    if (slot.blockedByGroupPlay) {
      return;
    }

    if (slot.available) {
      // For available slots, open booking modal
      onSlotClick({
        court,
        timeSlot: {
          timeSlotId: slot.timeSlotId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          peakHour: slot.peakHour,
        },
      });
    } else {
      // For booked slots, show booking details in modal
      setSelectedBooking({
        ...slot.booking,
        courtNumber: court.courtNumber,
        courtName: court.courtName,
        timeSlot: `${slot.startTime} - ${slot.endTime}`,
        peakHour: slot.peakHour,
      });
    }
  };

  // Get booking status text
  const getBookingStatusText = (status) => {
    const statusMap = {
      pending: 'รอยืนยัน',
      confirmed: 'ยืนยันแล้ว',
      'checked-in': 'เช็คอินแล้ว',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก',
    };
    return statusMap[status] || status;
  };

  // Get payment status text
  const getPaymentStatusText = (status) => {
    const statusMap = {
      pending: 'รอชำระ',
      partial: 'ชำระบางส่วน',
      paid: 'ชำระแล้ว',
      refunded: 'คืนเงินแล้ว',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Blocked Date Warning Banner */}
      {isBlocked && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <CalendarX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-800">วันนี้ปิดการจอง</p>
              <p className="text-sm text-red-600">
                {blockedReason || 'ไม่สามารถจองสนามในวันนี้ได้'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">ตารางสนาม</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded"></div>
            <span className="text-sm text-gray-600">ว่าง</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-50 border-2 border-orange-300 rounded"></div>
            <span className="text-sm text-gray-600">ว่าง (Peak Hour)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
            <span className="text-sm text-gray-600">จองแล้ว (ชำระแล้ว)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
            <span className="text-sm text-gray-600">จองแล้ว (ยังไม่ชำระ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border-2 border-purple-400 rounded"></div>
            <span className="text-sm text-gray-600">ก๊วนสนาม (Group Play)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 border-2 border-gray-400 rounded opacity-60"></div>
            <span className="text-sm text-gray-600">ปิดการจอง</span>
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
                        className={`tooltip p-3 rounded-lg border-2 text-center transition-all ${getSlotColor(
                          slot
                        )}`}
                        data-tooltip={
                          slot.blockedByGroupPlay
                            ? 'ถูกบล็อกโดยก๊วนสนาม (Group Play)'
                            : isBlocked && slot.available
                            ? blockedReason || 'วันนี้ปิดการจอง'
                            : slot.available
                            ? 'คลิกเพื่อจอง'
                            : `จองโดย: ${slot.booking?.customerName || 'N/A'}`
                        }
                      >
                        {slot.blockedByGroupPlay ? (
                          <div className="text-xs font-semibold text-purple-700">
                            ก๊วนสนาม
                          </div>
                        ) : isBlocked && slot.available ? (
                          <div className="text-xs font-semibold text-gray-500">
                            ปิดการจอง
                          </div>
                        ) : slot.available ? (
                          <div className={`text-xs font-semibold ${
                            slot.peakHour ? 'text-orange-700' : 'text-blue-700'
                          }`}>
                            ว่าง
                          </div>
                        ) : (
                          <div className="text-xs">
                            <div className={`font-semibold ${
                              slot.booking?.paymentStatus === 'paid'
                                ? 'text-green-700'
                                : 'text-red-700'
                            }`}>
                              {slot.booking?.customerName || 'N/A'}
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

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">รายละเอียดการจอง</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="tooltip text-gray-400 hover:text-gray-600 transition-colors"
                data-tooltip="ปิดหน้าต่าง"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Booking Code */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-600 font-medium">รหัสจอง</p>
                <p className="text-xl font-bold text-blue-900 mt-1">
                  {selectedBooking.bookingCode}
                </p>
              </div>

              {/* Court and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">สนาม</p>
                  <p className="font-semibold text-gray-900">
                    {selectedBooking.courtNumber}
                  </p>
                  <p className="text-xs text-gray-500">{selectedBooking.courtName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">เวลา</p>
                  <p className="font-semibold text-gray-900">
                    {selectedBooking.timeSlot}
                  </p>
                  {selectedBooking.peakHour && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 rounded">
                      Peak Hour
                    </span>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-2">ข้อมูลลูกค้า</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <p className="font-medium text-gray-900">
                      {selectedBooking.customerName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <p className="text-gray-900">{selectedBooking.customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">สถานะการจอง</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedBooking.bookingStatus === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : selectedBooking.bookingStatus === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedBooking.bookingStatus === 'checked-in'
                          ? 'bg-purple-100 text-purple-800'
                          : selectedBooking.bookingStatus === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {getBookingStatusText(selectedBooking.bookingStatus)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">สถานะการชำระ</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedBooking.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : selectedBooking.paymentStatus === 'partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedBooking.paymentStatus === 'refunded'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {getPaymentStatusText(selectedBooking.paymentStatus)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedBooking(null)}
                className="tooltip tooltip-left px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                data-tooltip="ปิดหน้าต่าง"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtScheduleGrid;
