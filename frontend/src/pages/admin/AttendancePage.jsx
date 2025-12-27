import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  Calendar,
  User,
  Edit2,
  X,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { attendanceAPI, userAPI } from '../../lib/api';
import useAuthStore from '../../store/authStore';

// Helper function to format time
const formatTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper function to format date
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Helper function to format hours
const formatHours = (hours) => {
  if (!hours) return '-';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h} ชม. ${m} น.`;
};

export default function AttendancePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  // Today's attendance state
  const [todayStatus, setTodayStatus] = useState('not_clocked_in');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockingIn, setClockingIn] = useState(false);
  const [clockingOut, setClockingOut] = useState(false);

  // History state
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Filter state (Admin only)
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
  });

  // Edit modal state (Admin only)
  const [editModal, setEditModal] = useState({ open: false, attendance: null });
  const [editForm, setEditForm] = useState({
    clockInTime: '',
    clockInNote: '',
    clockOutTime: '',
    clockOutNote: '',
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance
  const fetchToday = useCallback(async () => {
    try {
      const response = await attendanceAPI.getToday();
      setTodayStatus(response.status);
      setTodayAttendance(response.data);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  }, []);

  // Fetch attendance history
  const fetchAttendances = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = isAdmin
        ? await attendanceAPI.getAll(params)
        : await attendanceAPI.getMy(params);

      setAttendances(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages,
      }));
    } catch (error) {
      console.error('Error fetching attendances:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, pagination.page, pagination.limit, filters]);

  // Fetch users for filter (Admin only)
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await userAPI.getAll();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchToday();
    fetchAttendances();
    fetchUsers();
  }, [fetchToday, fetchAttendances, fetchUsers]);

  // Clock in handler
  const handleClockIn = async () => {
    setClockingIn(true);
    try {
      await attendanceAPI.clockIn();
      toast.success('ลงเวลาเข้างานสำเร็จ');
      fetchToday();
      fetchAttendances();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setClockingIn(false);
    }
  };

  // Clock out handler
  const handleClockOut = async () => {
    setClockingOut(true);
    try {
      await attendanceAPI.clockOut();
      toast.success('ลงเวลาออกงานสำเร็จ');
      fetchToday();
      fetchAttendances();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setClockingOut(false);
    }
  };

  // Open edit modal (Admin only)
  const openEditModal = (attendance) => {
    setEditForm({
      clockInTime: attendance.clockIn?.time
        ? new Date(attendance.clockIn.time).toISOString().slice(0, 16)
        : '',
      clockInNote: attendance.clockIn?.note || '',
      clockOutTime: attendance.clockOut?.time
        ? new Date(attendance.clockOut.time).toISOString().slice(0, 16)
        : '',
      clockOutNote: attendance.clockOut?.note || '',
    });
    setEditModal({ open: true, attendance });
  };

  // Save edit (Admin only)
  const handleSaveEdit = async () => {
    try {
      await attendanceAPI.update(editModal.attendance._id, {
        clockInTime: editForm.clockInTime || null,
        clockInNote: editForm.clockInNote,
        clockOutTime: editForm.clockOutTime || null,
        clockOutNote: editForm.clockOutNote,
      });
      toast.success('แก้ไขข้อมูลสำเร็จ');
      setEditModal({ open: false, attendance: null });
      fetchAttendances();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ลงเวลางาน</h1>
            <p className="text-gray-500">บันทึกเวลาเข้า-ออกงาน</p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchToday();
            fetchAttendances();
          }}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </div>

      {/* Clock In/Out Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Current Time */}
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold text-gray-900">
              {currentTime.toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            <div className="text-gray-500 mt-1">
              {currentTime.toLocaleDateString('th-TH', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>

          {/* Status & Buttons */}
          <div className="flex flex-col items-center gap-4">
            {/* Status Badge */}
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                todayStatus === 'clocked_out'
                  ? 'bg-gray-100 text-gray-700'
                  : todayStatus === 'clocked_in'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {todayStatus === 'clocked_out'
                ? '✅ ลงเวลาออกแล้ว'
                : todayStatus === 'clocked_in'
                ? '🟢 กำลังทำงาน'
                : '⏳ ยังไม่ได้ลงเวลาเข้า'}
            </div>

            {/* Clock In/Out Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClockIn}
                disabled={todayStatus !== 'not_clocked_in' || clockingIn}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  todayStatus === 'not_clocked_in'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <LogIn className="w-5 h-5" />
                {clockingIn ? 'กำลังบันทึก...' : 'เข้างาน'}
              </button>

              <button
                onClick={handleClockOut}
                disabled={todayStatus !== 'clocked_in' || clockingOut}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  todayStatus === 'clocked_in'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <LogOut className="w-5 h-5" />
                {clockingOut ? 'กำลังบันทึก...' : 'ออกงาน'}
              </button>
            </div>

            {/* Today's Times */}
            {todayAttendance && (
              <div className="flex gap-6 text-sm text-gray-600">
                {todayAttendance.clockIn?.time && (
                  <span>
                    เข้า: {formatTime(todayAttendance.clockIn.time)}
                  </span>
                )}
                {todayAttendance.clockOut?.time && (
                  <span>
                    ออก: {formatTime(todayAttendance.clockOut.time)}
                  </span>
                )}
                {todayAttendance.totalHours > 0 && (
                  <span>รวม: {formatHours(todayAttendance.totalHours)}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters (Admin Only) */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                พนักงาน
              </label>
              <select
                value={filters.userId}
                onChange={(e) =>
                  setFilters({ ...filters, userId: e.target.value })
                }
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ทั้งหมด</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                fetchAttendances();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Search className="w-4 h-4" />
              ค้นหา
            </button>
            <button
              onClick={() => {
                setFilters({ startDate: '', endDate: '', userId: '' });
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              ล้าง
            </button>
          </div>
        </div>
      )}

      {/* Attendance History Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">
            {isAdmin ? 'ประวัติการลงเวลาทั้งหมด' : 'ประวัติการลงเวลาของฉัน'}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
        ) : attendances.length === 0 ? (
          <div className="p-8 text-center text-gray-500">ไม่พบข้อมูล</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      วันที่
                    </th>
                    {isAdmin && (
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        พนักงาน
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      เข้างาน
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      ออกงาน
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                      รวม
                    </th>
                    {isAdmin && (
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                        จัดการ
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attendances.map((attendance) => (
                    <tr key={attendance._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(attendance.date)}
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {attendance.user?.name || '-'}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-green-600 font-medium">
                            {formatTime(attendance.clockIn?.time)}
                          </span>
                          {attendance.clockIn?.method === 'manual' && (
                            <span className="ml-1 text-xs text-orange-500">
                              (แก้ไข)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-red-600 font-medium">
                            {formatTime(attendance.clockOut?.time)}
                          </span>
                          {attendance.clockOut?.method === 'manual' && (
                            <span className="ml-1 text-xs text-orange-500">
                              (แก้ไข)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatHours(attendance.totalHours)}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => openEditModal(attendance)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="แก้ไข"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  แสดง {attendances.length} จาก {pagination.total} รายการ
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 text-sm">
                    หน้า {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(pagination.pages, prev.page + 1),
                      }))
                    }
                    disabled={pagination.page === pagination.pages}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal (Admin Only) */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                แก้ไขเวลาลงงาน
              </h3>
              <button
                onClick={() => setEditModal({ open: false, attendance: null })}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-600">
                พนักงาน: {editModal.attendance?.user?.name} |{' '}
                วันที่: {formatDate(editModal.attendance?.date)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เวลาเข้างาน
                </label>
                <input
                  type="datetime-local"
                  value={editForm.clockInTime}
                  onChange={(e) =>
                    setEditForm({ ...editForm, clockInTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมายเหตุเข้างาน
                </label>
                <input
                  type="text"
                  value={editForm.clockInNote}
                  onChange={(e) =>
                    setEditForm({ ...editForm, clockInNote: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="หมายเหตุ (ถ้ามี)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เวลาออกงาน
                </label>
                <input
                  type="datetime-local"
                  value={editForm.clockOutTime}
                  onChange={(e) =>
                    setEditForm({ ...editForm, clockOutTime: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมายเหตุออกงาน
                </label>
                <input
                  type="text"
                  value={editForm.clockOutNote}
                  onChange={(e) =>
                    setEditForm({ ...editForm, clockOutNote: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="หมายเหตุ (ถ้ามี)"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setEditModal({ open: false, attendance: null })}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
