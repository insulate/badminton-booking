import { useState } from 'react';

const DAY_NAMES = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH').format(amount);
};

const RecurringPreviewModal = ({
  isOpen,
  onClose,
  previewData,
  formData,
  onConfirm,
  loading = false,
}) => {
  const [showAllDates, setShowAllDates] = useState(false);

  if (!isOpen || !previewData) return null;

  const { summary, dates, skippedDates, pricing } = previewData;
  const displayDates = showAllDates ? dates : dates.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal */}
        <div className="relative w-full max-w-2xl bg-white shadow-xl rounded-lg max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">ตรวจสอบการจองประจำ</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">ข้อมูลการจอง</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">ลูกค้า:</span>
                  <span className="ml-2 font-medium">{formData.customer.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">เบอร์โทร:</span>
                  <span className="ml-2 font-medium">{formData.customer.phone}</span>
                </div>
                <div>
                  <span className="text-gray-600">สนาม:</span>
                  <span className="ml-2 font-medium">
                    {summary.court?.courtNumber} - {summary.court?.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">เวลา:</span>
                  <span className="ml-2 font-medium">
                    {summary.timeSlot?.startTime} ({summary.duration === 0.5 ? '30 นาที' : summary.duration % 1 === 0 ? `${summary.duration} ชม.` : `${Math.floor(summary.duration)} ชม. 30 น.`})
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">วัน:</span>
                  <span className="ml-2 font-medium">{summary.daysOfWeekDisplay}</span>
                </div>
                <div>
                  <span className="text-gray-600">ช่วงเวลา:</span>
                  <span className="ml-2 font-medium">
                    {formatDate(summary.startDate)} - {formatDate(summary.endDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{summary.validDates}</div>
                <div className="text-sm text-green-700">วันที่จองได้</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{summary.skippedDates}</div>
                <div className="text-sm text-red-700">วันที่ข้ามไป</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.totalDates}</div>
                <div className="text-sm text-blue-700">วันทั้งหมด</div>
              </div>
            </div>

            {/* Dates List */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                วันที่จองได้ ({dates.length} วัน)
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {displayDates.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm bg-white px-2 py-1 rounded border border-gray-200"
                    >
                      <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {DAY_NAMES[item.dayOfWeek]}
                      </span>
                      <span className="text-gray-700">{formatDate(item.date)}</span>
                    </div>
                  ))}
                </div>
                {dates.length > 5 && !showAllDates && (
                  <button
                    onClick={() => setShowAllDates(true)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    ดูทั้งหมด ({dates.length} วัน)
                  </button>
                )}
              </div>
            </div>

            {/* Skipped Dates */}
            {skippedDates.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  วันที่ไม่สามารถจองได้ ({skippedDates.length} วัน)
                </h4>
                <div className="bg-red-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="space-y-1">
                    {skippedDates.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-700 rounded text-xs font-medium">
                            {DAY_NAMES[item.dayOfWeek]}
                          </span>
                          <span className="text-gray-700">{formatDate(item.date)}</span>
                        </div>
                        <span className="text-red-600 text-xs">
                          {item.reason === 'blocked' ? 'วันปิดทำการ' : 'มีการจองแล้ว'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">สรุปราคา</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">จำนวนครั้ง</span>
                  <span className="font-medium">{dates.length} ครั้ง</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ราคาต่อครั้ง</span>
                  <span className="font-medium">{formatCurrency(pricing.pricePerSession)} บาท</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="font-semibold text-gray-900">ราคารวมทั้งหมด</span>
                  <span className="font-semibold text-blue-600 text-lg">
                    {formatCurrency(pricing.totalAmount)} บาท
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  รูปแบบชำระเงิน:{' '}
                  <span className="font-medium text-gray-900">
                    {formData.paymentMode === 'bulk' ? 'จ่ายรวมทั้งหมด' : 'จ่ายทีละครั้ง'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              แก้ไข
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading || dates.length === 0}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังสร้าง...' : `ยืนยันสร้าง ${dates.length} การจอง`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringPreviewModal;
