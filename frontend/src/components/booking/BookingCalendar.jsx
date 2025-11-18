import { useState } from 'react';

/**
 * BookingCalendar Component
 * ปฏิทินสำหรับเลือกวันที่จอง
 */
const BookingCalendar = ({ selectedDate, onDateChange }) => {
  // Format date for input type="date" (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Get max date (30 days from today)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const max = maxDate.toISOString().split('T')[0];

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    onDateChange(newDate);
  };

  // Get day name in Thai
  const getDayName = (date) => {
    if (!date) return '';
    const days = [
      'อาทิตย์',
      'จันทร์',
      'อังคาร',
      'พุธ',
      'พฤหัสบดี',
      'ศุกร์',
      'เสาร์',
    ];
    return days[new Date(date).getDay()];
  };

  // Format date display in Thai
  const formatDateDisplay = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear() + 543; // Convert to Buddhist year
    return `${day}/${month}/${year}`;
  };

  const dayType =
    selectedDate && (new Date(selectedDate).getDay() === 0 || new Date(selectedDate).getDay() === 6)
      ? 'วันหยุด'
      : 'วันธรรมดา';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left: Date Picker */}
        <div className="flex-1">
          <label htmlFor="booking-date" className="block text-sm font-medium text-gray-700 mb-2">
            เลือกวันที่จอง
          </label>
          <input
            type="date"
            id="booking-date"
            value={formatDateForInput(selectedDate)}
            onChange={handleDateChange}
            min={today}
            max={max}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">สามารถจองล่วงหน้าได้สูงสุด 30 วัน</p>
        </div>

        {/* Center: Selected Date Display */}
        {selectedDate && (
          <div className="flex-1 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">วันที่เลือก</p>
                <p className="text-lg font-semibold text-gray-800">
                  {getDayName(selectedDate)}ที่ {formatDateDisplay(selectedDate)}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    dayType === 'วันหยุด'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {dayType}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Right: Quick Date Selection */}
        <div className="flex-shrink-0">
          <p className="text-sm font-medium text-gray-700 mb-2">เลือกด่วน</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onDateChange(new Date())}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                onDateChange(tomorrow);
              }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              พรุ่งนี้
            </button>
            <button
              type="button"
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                onDateChange(nextWeek);
              }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              สัปดาห์หน้า
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
