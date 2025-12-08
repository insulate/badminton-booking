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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-blue-900 rounded-2xl w-full max-w-md p-6 border border-white/20 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-blue-300 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-white mb-6 text-center">
          จองสนาม
        </h2>

        {/* Slot Info */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-blue-200">
            <Calendar className="w-5 h-5 text-yellow-400" />
            <span>{formatDate(selectedDate)}</span>
          </div>
          <div className="flex items-center gap-3 text-blue-200">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span>เริ่ม {slot.startTime} น.</span>
            {slot.peakHour && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">
                <Flame className="w-3 h-3" />
                Peak Hour
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-blue-200">
            <span className="w-5 h-5 flex items-center justify-center text-yellow-400">฿</span>
            <span>{pricePerHour.toLocaleString()} บาท/ชม.</span>
            {player?.isMember && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                ราคาสมาชิก
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-4" />

        {/* Duration Selector */}
        <div className="mb-4">
          <p className="text-sm text-blue-200 mb-3">จำนวนชั่วโมง</p>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map((duration) => (
              <button
                key={duration}
                onClick={() => setSelectedDuration(duration)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedDuration === duration
                    ? 'bg-yellow-400 text-blue-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {duration} ชม.
              </button>
            ))}
          </div>
        </div>

        {/* Time Range */}
        <div className="bg-white/5 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-center gap-2 text-white">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="font-medium">
              {slot.startTime} - {endTime}
            </span>
            <span className="text-blue-300">({selectedDuration} ชั่วโมง)</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-4" />

        {/* Player Info */}
        <div className="mb-4">
          <p className="text-sm text-blue-200 mb-2">ข้อมูลผู้จอง</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white">
              <User className="w-4 h-4 text-blue-300" />
              <span>{player?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Phone className="w-4 h-4 text-blue-300" />
              <span>{player?.phone}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-4" />

        {/* Total Price */}
        <div className="bg-yellow-400/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-200">ยอดรวม</span>
            <span className="text-2xl font-bold text-yellow-400">
              {totalPrice.toLocaleString()} บาท
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'กำลังจอง...' : 'ยืนยันการจอง'}
          </button>
        </div>
      </div>
    </div>
  );
}
