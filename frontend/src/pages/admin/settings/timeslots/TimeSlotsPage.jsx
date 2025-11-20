import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ArrowLeft, Clock, DollarSign } from 'lucide-react';
import { timeslotsAPI } from '../../../../lib/api';
import { ROUTES } from '../../../../constants';
import toast from 'react-hot-toast';
import TimeSlotModal from '../../../../components/timeslots/TimeSlotModal';
import BulkUpdatePricingModal from '../../../../components/timeslots/BulkUpdatePricingModal';
import { PageContainer, Card, PageHeader, Button } from '../../../../components/common';

const TimeSlotsPage = () => {
  const navigate = useNavigate();
  const [timeslots, setTimeslots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDayType, setFilterDayType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);

  useEffect(() => {
    fetchTimeslots();
  }, []);

  const fetchTimeslots = async () => {
    try {
      setLoading(true);
      const response = await timeslotsAPI.getAll();
      if (response.success) {
        setTimeslots(response.data);
      }
    } catch (error) {
      console.error('Error fetching timeslots:', error);
      toast.error('ไม่สามารถโหลดข้อมูลช่วงเวลาได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (timeslot) => {
    if (
      !window.confirm(
        `คุณแน่ใจหรือไม่ที่จะลบช่วงเวลา "${timeslot.startTime}-${timeslot.endTime}" (${getDayTypeLabel(timeslot.dayType)})?`
      )
    ) {
      return;
    }

    try {
      const response = await timeslotsAPI.delete(timeslot._id);
      if (response.success) {
        toast.success('ลบช่วงเวลาสำเร็จ');
        fetchTimeslots();
      }
    } catch (error) {
      console.error('Error deleting timeslot:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบช่วงเวลา');
    }
  };

  const handleTogglePeakHour = async (timeslot) => {
    const newPeakHourStatus = !timeslot.peakHour;

    // Optimistic update - อัปเดต UI ทันทีก่อนเรียก API
    setTimeslots((prevTimeslots) =>
      prevTimeslots.map((t) =>
        t._id === timeslot._id ? { ...t, peakHour: newPeakHourStatus } : t
      )
    );

    try {
      const response = await timeslotsAPI.update(timeslot._id, {
        ...timeslot,
        peakHour: newPeakHourStatus,
      });
      if (response.success) {
        toast.success(
          newPeakHourStatus ? 'เปิด Peak Hour สำเร็จ' : 'ปิด Peak Hour สำเร็จ'
        );
      }
    } catch (error) {
      console.error('Error toggling peak hour:', error);
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ Peak Hour');

      // Revert กลับถ้า API ล้มเหลว
      setTimeslots((prevTimeslots) =>
        prevTimeslots.map((t) =>
          t._id === timeslot._id ? { ...t, peakHour: timeslot.peakHour } : t
        )
      );
    }
  };

  const handleEdit = (timeslot) => {
    setSelectedTimeslot(timeslot);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedTimeslot(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedTimeslot(null);
  };

  const handleModalSuccess = () => {
    fetchTimeslots();
    handleModalClose();
  };

  // Filter timeslots
  const filteredTimeslots = timeslots.filter((timeslot) => {
    const matchDayType = !filterDayType || timeslot.dayType === filterDayType;
    const matchStatus = !filterStatus || timeslot.status === filterStatus;
    return matchDayType && matchStatus;
  });

  // Group by day type
  const groupedTimeslots = {
    weekday: filteredTimeslots.filter((t) => t.dayType === 'weekday'),
    weekend: filteredTimeslots.filter((t) => t.dayType === 'weekend'),
  };

  // Day type label
  const getDayTypeLabel = (dayType) => {
    const labels = {
      weekday: 'วันจันทร์-ศุกร์',
      weekend: 'วันเสาร์-อาทิตย์',
    };
    return labels[dayType] || dayType;
  };

  // Day type badge color
  const getDayTypeBadge = (dayType) => {
    const badges = {
      weekday: 'bg-blue-100 text-blue-800',
      weekend: 'bg-purple-100 text-purple-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[dayType]}`}>
        {getDayTypeLabel(dayType)}
      </span>
    );
  };

  // Status badge color
  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      active: 'เปิดใช้งาน',
      inactive: 'ปิดใช้งาน',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PageContainer variant="full">
      <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="จัดการช่วงเวลาและราคา"
        subtitle={`จัดการช่วงเวลาการให้บริการและราคา (${filteredTimeslots.length} ช่วงเวลา)`}
        icon={Clock}
        iconColor="blue"
        actions={
          <div className="flex gap-2">
            <Button
              variant="green"
              onClick={() => setShowBulkUpdateModal(true)}
              icon={<DollarSign className="w-4 h-4" />}
            >
              อัปเดตราคาทั้งหมด
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              icon={<Plus className="w-4 h-4" />}
            >
              เพิ่มช่วงเวลาใหม่
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card padding="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filter by Day Type */}
          <select
            value={filterDayType}
            onChange={(e) => setFilterDayType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ประเภทวันทั้งหมด</option>
            <option value="weekday">วันจันทร์-ศุกร์</option>
            <option value="weekend">วันเสาร์-อาทิตย์</option>
          </select>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">สถานะทั้งหมด</option>
            <option value="active">เปิดใช้งาน</option>
            <option value="inactive">ปิดใช้งาน</option>
          </select>
        </div>
      </Card>

      {/* Timeslots by Day Type */}
      {!filterDayType ? (
        // Show all day types grouped
        <div className="space-y-6">
          {['weekday', 'weekend'].map((dayType) => (
            <div key={dayType}>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {getDayTypeLabel(dayType)} ({groupedTimeslots[dayType].length} ช่วงเวลา)
              </h2>
              <Card padding="p-0" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          เวลา
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peak Hour
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ราคาปกติ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ราคาสมาชิก
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peak ปกติ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peak สมาชิก
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          สถานะ
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          จัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupedTimeslots[dayType].length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                            ไม่มีข้อมูลช่วงเวลา
                          </td>
                        </tr>
                      ) : (
                        groupedTimeslots[dayType].map((timeslot) => (
                          <tr key={timeslot._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {timeslot.startTime} - {timeslot.endTime}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleTogglePeakHour(timeslot)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                  timeslot.peakHour ? 'bg-orange-600' : 'bg-gray-300'
                                }`}
                                title={timeslot.peakHour ? 'ปิด Peak Hour' : 'เปิด Peak Hour'}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    timeslot.peakHour ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{timeslot.pricing.normal}฿</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{timeslot.pricing.member}฿</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{timeslot.peakPricing?.normal || '-'}฿</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{timeslot.peakPricing?.member || '-'}฿</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(timeslot.status)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(timeslot)}
                                  className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition"
                                  title="แก้ไข"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(timeslot)}
                                  className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition"
                                  title="ลบ"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        // Show filtered day type only
        <Card padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เวลา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ประเภทวัน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peak Hour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ราคาปกติ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ราคาสมาชิก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peak ปกติ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peak สมาชิก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTimeslots.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      {filterDayType || filterStatus
                        ? 'ไม่พบข้อมูลช่วงเวลาที่ตรงกับเงื่อนไขการค้นหา'
                        : 'ยังไม่มีข้อมูลช่วงเวลา'}
                    </td>
                  </tr>
                ) : (
                  filteredTimeslots.map((timeslot) => (
                    <tr key={timeslot._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {timeslot.startTime} - {timeslot.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getDayTypeBadge(timeslot.dayType)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePeakHour(timeslot)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            timeslot.peakHour ? 'bg-orange-600' : 'bg-gray-300'
                          }`}
                          title={timeslot.peakHour ? 'ปิด Peak Hour' : 'เปิด Peak Hour'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              timeslot.peakHour ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{timeslot.pricing.normal}฿</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{timeslot.pricing.member}฿</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{timeslot.peakPricing?.normal || '-'}฿</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{timeslot.peakPricing?.member || '-'}฿</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(timeslot.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(timeslot)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition"
                            title="แก้ไข"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(timeslot)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TimeSlot Modal */}
      {showModal && (
        <TimeSlotModal
          timeslot={selectedTimeslot}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Bulk Update Pricing Modal */}
      {showBulkUpdateModal && (
        <BulkUpdatePricingModal
          onClose={() => setShowBulkUpdateModal(false)}
          onSuccess={() => {
            setShowBulkUpdateModal(false);
            fetchTimeslots();
          }}
        />
      )}
      </div>
    </PageContainer>
  );
};

export default TimeSlotsPage;
