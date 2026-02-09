import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import RecurringBookingForm from '../../components/booking/RecurringBookingForm';
import RecurringPreviewModal from '../../components/booking/RecurringPreviewModal';
import { recurringBookingsAPI } from '../../lib/api';

const DAY_NAMES = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH').format(amount);
};

const getStatusBadge = (status) => {
  const styles = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  const labels = {
    active: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
};

const RecurringBookingsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [groupBookings, setGroupBookings] = useState([]);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Bulk Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'cash',
  });

  // Fetch recurring booking groups
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter) params.status = filter;
      if (searchQuery) params.search = searchQuery;

      const response = await recurringBookingsAPI.getAll(params);
      if (response.success) {
        setGroups(response.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [filter, searchQuery]);

  // Handle preview
  const handlePreview = async (data) => {
    try {
      setPreviewLoading(true);
      setFormData(data);

      const response = await recurringBookingsAPI.preview({
        daysOfWeek: data.daysOfWeek,
        startDate: data.startDate,
        endDate: data.endDate,
        court: data.court,
        timeSlot: data.timeSlot,
        duration: data.duration,
      });

      if (response.success) {
        setPreviewData(response.data);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการแสดงตัวอย่าง');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle create
  const handleCreate = async () => {
    try {
      setCreateLoading(true);

      const response = await recurringBookingsAPI.create({
        customer: formData.customer,
        daysOfWeek: formData.daysOfWeek,
        startDate: formData.startDate,
        endDate: formData.endDate,
        court: formData.court,
        timeSlot: formData.timeSlot,
        duration: formData.duration,
        paymentMode: formData.paymentMode,
        notes: formData.notes,
      });

      if (response.success) {
        toast.success(response.message || 'สร้างการจองประจำสำเร็จ');
        setShowPreview(false);
        setShowForm(false);
        setPreviewData(null);
        setFormData(null);
        fetchGroups();
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างการจอง');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle view detail
  const handleViewDetail = async (group) => {
    try {
      setSelectedGroup(group);
      setShowDetail(true);

      const response = await recurringBookingsAPI.getBookingsInGroup(group._id);
      if (response.success) {
        setGroupBookings(response.data);
      }
    } catch (error) {
      console.error('Error fetching group bookings:', error);
      toast.error('ไม่สามารถโหลดรายการจองได้');
    }
  };

  // Handle cancel
  const handleCancel = async (groupId) => {
    if (!confirm('คุณต้องการยกเลิกการจองประจำทั้งหมดหรือไม่? การจองในอนาคตทั้งหมดจะถูกยกเลิก')) {
      return;
    }

    try {
      setCancelLoading(true);
      const response = await recurringBookingsAPI.cancel(groupId);
      if (response.success) {
        toast.success(response.message || 'ยกเลิกการจองประจำสำเร็จ');
        setShowDetail(false);
        fetchGroups();
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการยกเลิก');
    } finally {
      setCancelLoading(false);
    }
  };

  // Open payment modal
  const handleOpenPaymentModal = () => {
    const remaining = (selectedGroup?.bulkPayment?.totalAmount || 0) - (selectedGroup?.bulkPayment?.paidAmount || 0);
    setPaymentData({
      amount: remaining,
      method: 'cash',
    });
    setShowPaymentModal(true);
  };

  // Handle bulk payment
  const handleBulkPayment = async () => {
    if (paymentData.amount <= 0) {
      toast.error('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }

    try {
      setPaymentLoading(true);
      const response = await recurringBookingsAPI.updatePayment(selectedGroup._id, {
        amount: paymentData.amount,
        paymentMethod: paymentData.method,
      });

      if (response.success) {
        toast.success('บันทึกการชำระเงินสำเร็จ');
        setShowPaymentModal(false);
        // Refresh selected group data
        const updatedGroup = await recurringBookingsAPI.getById(selectedGroup._id);
        if (updatedGroup.success) {
          setSelectedGroup(updatedGroup.data);
        }
        fetchGroups();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">การจองประจำ</h1>
            <p className="text-gray-600 mt-1">จัดการการจองแบบประจำสำหรับลูกค้าประจำ</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            สร้างการจองประจำ
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์โทร, หรือรหัส..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุกสถานะ</option>
            <option value="active">กำลังดำเนินการ</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>

        {/* Groups List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
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
            <p className="mt-4 text-gray-600">ยังไม่มีการจองประจำ</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              สร้างการจองประจำใหม่
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รหัส</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลูกค้า</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รายละเอียด</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ช่วงเวลา</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groups.map((group) => (
                  <tr key={group._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600">{group.groupCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{group.customer.name}</div>
                      <div className="text-sm text-gray-500">{group.customer.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        สนาม {group.pattern?.court?.courtNumber} - {group.pattern?.court?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {group.pattern?.timeSlot?.startTime} | {group.pattern?.duration === 0.5 ? '30 นาที' : group.pattern?.duration % 1 === 0 ? `${group.pattern?.duration} ชม.` : `${Math.floor(group.pattern?.duration)} ชม. 30 น.`} |{' '}
                        {group.pattern?.daysOfWeek?.map((d) => DAY_NAMES[d]).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(group.startDate)}</div>
                      <div className="text-sm text-gray-500">ถึง {formatDate(group.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(group.status)}
                      <div className="text-xs text-gray-500 mt-1">
                        {group.totalBookings} ครั้ง
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetail(group)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        ดูรายละเอียด
                      </button>
                      {group.status === 'active' && (
                        <button
                          onClick={() => handleCancel(group._id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={cancelLoading}
                        >
                          ยกเลิก
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowForm(false)}></div>
              <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">สร้างการจองประจำใหม่</h2>
                <RecurringBookingForm
                  onPreview={handlePreview}
                  onCancel={() => setShowForm(false)}
                  loading={previewLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        <RecurringPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          previewData={previewData}
          formData={formData}
          onConfirm={handleCreate}
          loading={createLoading}
        />

        {/* Detail Modal */}
        {showDetail && selectedGroup && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDetail(false)}></div>
              <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedGroup.groupCode}
                    </h2>
                    <p className="text-gray-600">
                      {selectedGroup.customer.name} - {selectedGroup.customer.phone}
                    </p>
                  </div>
                  <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Bulk Payment Section */}
                  {selectedGroup.paymentMode === 'bulk' && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">การชำระเงินแบบรวม</h3>
                            <p className="text-sm text-gray-600">จ่ายทั้งหมดในครั้งเดียว</p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            selectedGroup.bulkPayment?.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : selectedGroup.bulkPayment?.paymentStatus === 'partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {selectedGroup.bulkPayment?.paymentStatus === 'paid'
                            ? 'ชำระครบแล้ว'
                            : selectedGroup.bulkPayment?.paymentStatus === 'partial'
                            ? 'ชำระบางส่วน'
                            : 'รอชำระเงิน'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(selectedGroup.bulkPayment?.totalAmount || 0)}
                          </div>
                          <div className="text-sm text-gray-500">ยอดรวมทั้งหมด (บาท)</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(selectedGroup.bulkPayment?.paidAmount || 0)}
                          </div>
                          <div className="text-sm text-gray-500">ชำระแล้ว (บาท)</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-orange-600">
                            {formatCurrency(
                              (selectedGroup.bulkPayment?.totalAmount || 0) -
                                (selectedGroup.bulkPayment?.paidAmount || 0)
                            )}
                          </div>
                          <div className="text-sm text-gray-500">คงเหลือ (บาท)</div>
                        </div>
                      </div>

                      {selectedGroup.bulkPayment?.paymentStatus !== 'paid' && selectedGroup.status === 'active' && (
                        <button
                          onClick={handleOpenPaymentModal}
                          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          บันทึกการชำระเงิน
                        </button>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedGroup.totalBookings}</div>
                      <div className="text-sm text-blue-700">รวมทั้งหมด</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedGroup.completedBookings || 0}</div>
                      <div className="text-sm text-green-700">เสร็จสิ้น</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-orange-600">{selectedGroup.skippedDates?.length || 0}</div>
                      <div className="text-sm text-orange-700">ข้ามไป</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">{selectedGroup.cancelledBookings || 0}</div>
                      <div className="text-sm text-red-700">ยกเลิก</div>
                    </div>
                  </div>

                  {/* Bookings List */}
                  <h3 className="font-semibold text-gray-900 mb-3">รายการจองทั้งหมด</h3>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">วันที่</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">รหัสจอง</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ราคา</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">สถานะ</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ชำระเงิน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {groupBookings.map((booking, index) => (
                          <tr key={booking._id} className="bg-white">
                            <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className="font-medium">{formatDate(booking.date)}</span>
                              <span className="text-gray-500 ml-2">
                                {booking.timeSlot?.startTime}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-blue-600">{booking.bookingCode}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(booking.pricing?.total)} บาท</td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.bookingStatus === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : booking.bookingStatus === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : booking.bookingStatus === 'completed'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {booking.bookingStatus === 'confirmed'
                                  ? 'ยืนยันแล้ว'
                                  : booking.bookingStatus === 'cancelled'
                                  ? 'ยกเลิก'
                                  : booking.bookingStatus === 'completed'
                                  ? 'เสร็จสิ้น'
                                  : booking.bookingStatus}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.paymentStatus === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : booking.paymentStatus === 'partial'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {booking.paymentStatus === 'paid'
                                  ? 'ชำระแล้ว'
                                  : booking.paymentStatus === 'partial'
                                  ? 'บางส่วน'
                                  : 'รอชำระ'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t">
                  <button
                    onClick={() => setShowDetail(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ปิด
                  </button>
                  {selectedGroup.status === 'active' && (
                    <button
                      onClick={() => handleCancel(selectedGroup._id)}
                      disabled={cancelLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {cancelLoading ? 'กำลังยกเลิก...' : 'ยกเลิกการจองทั้งหมด'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Payment Modal */}
        {showPaymentModal && selectedGroup && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowPaymentModal(false)}></div>
              <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">บันทึกการชำระเงิน</h2>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600">ยอดคงเหลือ</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(
                      (selectedGroup.bulkPayment?.totalAmount || 0) -
                        (selectedGroup.bulkPayment?.paidAmount || 0)
                    )}{' '}
                    บาท
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      จำนวนเงินที่ชำระ (บาท)
                    </label>
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max={(selectedGroup.bulkPayment?.totalAmount || 0) - (selectedGroup.bulkPayment?.paidAmount || 0)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      วิธีการชำระเงิน
                    </label>
                    <select
                      value={paymentData.method}
                      onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cash">เงินสด</option>
                      <option value="bank_transfer">โอนเงิน</option>
                      <option value="promptpay">พร้อมเพย์</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={paymentLoading}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleBulkPayment}
                    disabled={paymentLoading || paymentData.amount <= 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {paymentLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        ยืนยันการชำระเงิน
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default RecurringBookingsPage;
