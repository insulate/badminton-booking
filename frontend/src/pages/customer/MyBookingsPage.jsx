import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Receipt } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { customerBookingsAPI, playerAuthAPI } from '../../lib/api';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      // Verify token/session validity before fetching bookings
      try {
        await playerAuthAPI.getMe();
      } catch (meError) {
        // If getMe fails, we might have an invalid token, but we'll proceed 
        // to let the main call handle it or fail gracefully
      }

      const response = await customerBookingsAPI.getMyBookings({
        status: filter !== 'all' ? filter : undefined,
      });

      if (response.success) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error('Load bookings error:', error);
      toast.error('ไม่สามารถโหลดประวัติการจองได้');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH').format(price);
  };

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: { bg: 'bg-blue-500', label: 'ยืนยันแล้ว' },
      'checked-in': { bg: 'bg-purple-500', label: 'เช็คอินแล้ว' },
      completed: { bg: 'bg-green-500', label: 'เสร็จสิ้น' },
      cancelled: { bg: 'bg-red-500', label: 'ยกเลิก' },
    };
    return badges[status] || { bg: 'bg-gray-500', label: status };
  };

  const filters = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'confirmed', label: 'รอใช้บริการ' },
    { value: 'completed', label: 'เสร็จสิ้น' },
    { value: 'cancelled', label: 'ยกเลิก' },
  ];

  return (
    <div className="min-h-full p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">ประวัติการจอง</h1>
        <p className="text-gray-500 text-sm">ดูรายการจองของคุณ</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">ไม่พบรายการจอง</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const statusBadge = getStatusBadge(booking.bookingStatus);
            return (
              <div
                key={booking._id}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-600 font-bold">
                    {booking.bookingCode}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusBadge.bg}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(booking.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}
                      {booking.duration > 1 && ` (${booking.duration} ชม.)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {booking.court
                        ? `${booking.court.name || `Court ${booking.court.courtNumber}`}`
                        : 'รอกำหนดสนาม'}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-gray-500 text-sm">ยอดรวม</span>
                  <span className="text-gray-800 font-bold">
                    {formatPrice(booking.pricing?.total || 0)} บาท
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
