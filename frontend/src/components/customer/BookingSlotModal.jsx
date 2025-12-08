import { useState, useMemo } from 'react';
import { X, Calendar, Clock, User, Phone, Flame } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customerBookingsAPI } from '../../lib/api';

export default function BookingSlotModal({
  isOpen,
  onClose,
  slot,
  selectedDate,
  player,
  availability,
  onSuccess,
}) {
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !slot) return null;

  // Find slot index in availability array
  const slotIndex = availability?.findIndex(
    (s) => s.timeSlotId === slot.timeSlotId
  ) ?? 0;

  // Calculate max duration based on consecutive available slots
  const maxDuration = useMemo(() => {
    if (!availability) return 1;
    let max = 1;
    for (let i = slotIndex; i < availability.length && i < slotIndex + 8; i++) {
      if (availability[i].availableCount < 1) break;
      max = i - slotIndex + 1;
    }
    return max;
  }, [availability, slotIndex]);

  // Duration options
  const durationOptions = Array.from({ length: maxDuration }, (_, i) => i + 1);

  // Calculate end time
  const endTime = useMemo(() => {
    if (!availability) return slot.endTime;
    const endIndex = slotIndex + selectedDuration - 1;
    return availability[endIndex]?.endTime || slot.endTime;
  }, [availability, slotIndex, selectedDuration, slot.endTime]);

  // Calculate price
  const pricePerHour = player?.isMember
    ? slot.pricing.member
    : slot.pricing.normal;
  const totalPrice = pricePerHour * selectedDuration;

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Handle confirm booking
  const handleConfirm = async () => {
    try {
      setLoading(true);
      const response = await customerBookingsAPI.create({
        date: selectedDate.toISOString().split('T')[0],
        timeSlot: slot.timeSlotId,
        duration: selectedDuration,
      });

      if (response.success) {
        onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการจอง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-md p-6 border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
          จองสนาม
        </h2>

        {/* Slot Info */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>{formatDate(selectedDate)}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>เริ่ม {slot.startTime} น.</span>
            {slot.peakHour && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-xs">
                <Flame className="w-3 h-3" />
                Peak Hour
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <span className="w-5 h-5 flex items-center justify-center text-blue-600 font-medium">฿</span>
            <span>{pricePerHour.toLocaleString()} บาท/ชม.</span>
            {player?.isMember && (
              <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs">
                ราคาสมาชิก
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4" />

        {/* Duration Selector */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">จำนวนชั่วโมง</p>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map((duration) => (
              <button
                key={duration}
                onClick={() => setSelectedDuration(duration)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedDuration === duration
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {duration} ชม.
              </button>
            ))}
          </div>
        </div>

        {/* Time Range */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-center gap-2 text-gray-800">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-medium">
              {slot.startTime} - {endTime}
            </span>
            <span className="text-gray-500">({selectedDuration} ชั่วโมง)</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4" />

        {/* Player Info */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">ข้อมูลผู้จอง</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-800">
              <User className="w-4 h-4 text-gray-400" />
              <span>{player?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{player?.phone}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4" />

        {/* Total Price */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">ยอดรวม</span>
            <span className="text-2xl font-bold text-blue-600">
              {totalPrice.toLocaleString()} บาท
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'กำลังจอง...' : 'ยืนยันการจอง'}
          </button>
        </div>
      </div>
    </div>
  );
}
