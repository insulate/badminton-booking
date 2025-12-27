import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Calculator,
  Clock,
  DollarSign,
  Plus,
  Minus,
  X,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Banknote,
  CreditCard,
  Receipt,
  Trash2,
  Calendar,
  User,
  Search,
} from 'lucide-react';
import { shiftsAPI, userAPI } from '../../lib/api';
import useAuthStore from '../../store/authStore';

// Helper function to format currency
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

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
  });
};

// Expense categories
const EXPENSE_CATEGORIES = [
  { value: 'ice', label: 'ค่าน้ำแข็ง' },
  { value: 'snack', label: 'ค่าขนม' },
  { value: 'supplies', label: 'ค่าวัสดุสิ้นเปลือง' },
  { value: 'other', label: 'อื่นๆ' },
];

export default function ShiftPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  // Current shift state
  const [currentShift, setCurrentShift] = useState(null);
  const [hasOpenShift, setHasOpenShift] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [closeShiftModal, setCloseShiftModal] = useState(false);
  const [addExpenseModal, setAddExpenseModal] = useState(false);

  // Forms
  const [openingCash, setOpeningCash] = useState('');
  const [closeForm, setCloseForm] = useState({
    actualCash: '',
    actualNonCash: '',
    note: '',
  });
  const [expenseForm, setExpenseForm] = useState({
    category: 'ice',
    description: '',
    amount: '',
  });

  // History state
  const [shifts, setShifts] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Filter state (Admin only)
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    status: '',
  });

  // Fetch current shift
  const fetchCurrentShift = useCallback(async () => {
    try {
      const response = await shiftsAPI.getCurrent();
      setCurrentShift(response.data);
      setHasOpenShift(response.hasOpenShift);
    } catch (error) {
      console.error('Error fetching current shift:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch shift history
  const fetchShiftHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await shiftsAPI.getAll(params);
      setShifts(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages,
      }));
    } catch (error) {
      console.error('Error fetching shift history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

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
    fetchCurrentShift();
    if (isAdmin) {
      fetchShiftHistory();
      fetchUsers();
    }
  }, [fetchCurrentShift, fetchShiftHistory, fetchUsers, isAdmin]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCurrentShift(), isAdmin ? fetchShiftHistory() : Promise.resolve()]);
    setRefreshing(false);
  };

  // Open shift handler
  const handleOpenShift = async () => {
    const amount = parseFloat(openingCash);
    if (isNaN(amount) || amount < 0) {
      toast.error('กรุณากรอกจำนวนเงินที่ถูกต้อง');
      return;
    }

    try {
      await shiftsAPI.open(amount);
      toast.success('เปิดกะสำเร็จ');
      setOpenShiftModal(false);
      setOpeningCash('');
      fetchCurrentShift();
      if (isAdmin) fetchShiftHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Close shift handler
  const handleCloseShift = async () => {
    const actualCash = parseFloat(closeForm.actualCash);
    const actualNonCash = parseFloat(closeForm.actualNonCash);

    if (isNaN(actualCash) || actualCash < 0) {
      toast.error('กรุณากรอกยอดเงินสดที่ถูกต้อง');
      return;
    }
    if (isNaN(actualNonCash) || actualNonCash < 0) {
      toast.error('กรุณากรอกยอดโอนที่ถูกต้อง');
      return;
    }

    try {
      await shiftsAPI.close(currentShift._id, {
        actualCash,
        actualNonCash,
        note: closeForm.note,
      });
      toast.success('ปิดกะสำเร็จ');
      setCloseShiftModal(false);
      setCloseForm({ actualCash: '', actualNonCash: '', note: '' });
      fetchCurrentShift();
      if (isAdmin) fetchShiftHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Add expense handler
  const handleAddExpense = async () => {
    const amount = parseFloat(expenseForm.amount);
    if (!expenseForm.description.trim()) {
      toast.error('กรุณากรอกรายละเอียด');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.error('กรุณากรอกจำนวนเงินที่ถูกต้อง');
      return;
    }

    try {
      await shiftsAPI.addExpense(currentShift._id, {
        category: expenseForm.category,
        description: expenseForm.description,
        amount,
      });
      toast.success('เพิ่มรายจ่ายสำเร็จ');
      setAddExpenseModal(false);
      setExpenseForm({ category: 'ice', description: '', amount: '' });
      fetchCurrentShift();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Remove expense handler
  const handleRemoveExpense = async (expenseId) => {
    if (!confirm('ต้องการลบรายจ่ายนี้?')) return;

    try {
      await shiftsAPI.removeExpense(currentShift._id, expenseId);
      toast.success('ลบรายจ่ายสำเร็จ');
      fetchCurrentShift();
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Calculate expected amounts
  const calculateExpected = () => {
    if (!currentShift) return { cash: 0, nonCash: 0 };

    const summary = currentShift.summary || {};
    const totalExpenses = currentShift.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

    const expectedCash =
      currentShift.openingCash +
      (summary.cashSales || 0) -
      (summary.totalChangeGiven || 0) -
      totalExpenses;

    const expectedNonCash = (summary.promptpaySales || 0) + (summary.transferSales || 0);

    return { cash: expectedCash, nonCash: expectedNonCash };
  };

  const expected = calculateExpected();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Calculator className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">เช็คเงินกะ</h1>
            <p className="text-gray-500">จัดการเงินประจำกะ</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>
      ) : !hasOpenShift ? (
        /* No Open Shift - Show Open Shift Card */
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            ยังไม่ได้เปิดกะ
          </h2>
          <p className="text-gray-500 mb-6">
            กรุณาเปิดกะก่อนเริ่มขายสินค้า
          </p>
          <button
            onClick={() => setOpenShiftModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            เปิดกะ
          </button>
        </div>
      ) : (
        /* Has Open Shift - Show Dashboard */
        <div className="space-y-6">
          {/* Shift Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {currentShift.shiftCode}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    กำลังเปิด
                  </span>
                </div>
                <div className="text-gray-500 text-sm mt-1">
                  เปิดเมื่อ {formatTime(currentShift.startTime)} |{' '}
                  ขายไปแล้ว {currentShift.salesCount || 0} รายการ
                </div>
              </div>
              <button
                onClick={() => setCloseShiftModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                ปิดกะ
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Banknote className="w-5 h-5" />
                  <span className="text-sm font-medium">เงินเปิดกะ</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  ฿{formatCurrency(currentShift.openingCash)}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium">ยอดขายเงินสด</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  ฿{formatCurrency(currentShift.summary?.cashSales || 0)}
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm font-medium">ยอดโอน</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  ฿{formatCurrency(
                    (currentShift.summary?.promptpaySales || 0) +
                      (currentShift.summary?.transferSales || 0)
                  )}
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <Minus className="w-5 h-5" />
                  <span className="text-sm font-medium">รายจ่าย</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  ฿{formatCurrency(currentShift.summary?.totalExpenses || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Expected Cash Display */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">ยอดเงินที่ควรมี</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 text-blue-200 mb-1">
                  <Banknote className="w-5 h-5" />
                  <span>เงินสดในลิ้นชัก</span>
                </div>
                <div className="text-3xl font-bold">
                  ฿{formatCurrency(expected.cash)}
                </div>
                <div className="text-sm text-blue-200 mt-1">
                  = เปิดกะ + ขายสด - ทอน - รายจ่าย
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-blue-200 mb-1">
                  <CreditCard className="w-5 h-5" />
                  <span>ยอดโอน (PromptPay/โอน)</span>
                </div>
                <div className="text-3xl font-bold">
                  ฿{formatCurrency(expected.nonCash)}
                </div>
                <div className="text-sm text-blue-200 mt-1">
                  = PromptPay + โอนธนาคาร
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                รายจ่ายระหว่างกะ
              </h3>
              <button
                onClick={() => setAddExpenseModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                เพิ่มรายจ่าย
              </button>
            </div>

            {!currentShift.expenses || currentShift.expenses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                ยังไม่มีรายจ่าย
              </div>
            ) : (
              <div className="divide-y">
                {currentShift.expenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {expense.description}
                      </div>
                      <div className="text-sm text-gray-500">
                        {EXPENSE_CATEGORIES.find((c) => c.value === expense.category)
                          ?.label || expense.category}{' '}
                        • {formatTime(expense.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-red-600">
                        -฿{formatCurrency(expense.amount)}
                      </span>
                      <button
                        onClick={() => handleRemoveExpense(expense._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shift History (Admin Only) */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">ประวัติกะทั้งหมด</h2>
          </div>

          {/* Filters */}
          <div className="p-4 border-b bg-gray-50">
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
                  className="px-3 py-2 border rounded-lg text-sm"
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
                  className="px-3 py-2 border rounded-lg text-sm"
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
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">ทั้งหมด</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สถานะ
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="open">เปิดอยู่</option>
                  <option value="closed">ปิดแล้ว</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setPagination((prev) => ({ ...prev, page: 1 }));
                  fetchShiftHistory();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Search className="w-4 h-4" />
                ค้นหา
              </button>
            </div>
          </div>

          {historyLoading ? (
            <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
          ) : shifts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">ไม่พบข้อมูล</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        รหัสกะ
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        พนักงาน
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        วันที่
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                        ยอดขาย
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                        ส่วนต่างเงินสด
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                        ส่วนต่างโอน
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                        สถานะ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {shifts.map((shift) => (
                      <tr key={shift._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-blue-600">
                          {shift.shiftCode}
                        </td>
                        <td className="px-4 py-3">
                          {shift.user?.name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div>{formatDate(shift.date)}</div>
                          <div className="text-sm text-gray-500">
                            {formatTime(shift.startTime)} -{' '}
                            {formatTime(shift.endTime)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          ฿{formatCurrency(shift.summary?.totalSales || 0)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {shift.status === 'closed' ? (
                            <span
                              className={
                                (shift.closingCash?.difference || 0) >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              {(shift.closingCash?.difference || 0) >= 0 ? '+' : ''}
                              ฿{formatCurrency(shift.closingCash?.difference || 0)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {shift.status === 'closed' ? (
                            <span
                              className={
                                (shift.closingNonCash?.difference || 0) >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              {(shift.closingNonCash?.difference || 0) >= 0 ? '+' : ''}
                              ฿{formatCurrency(shift.closingNonCash?.difference || 0)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              shift.status === 'open'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {shift.status === 'open' ? 'เปิดอยู่' : 'ปิดแล้ว'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-4 py-3 border-t flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    แสดง {shifts.length} จาก {pagination.total} รายการ
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
      )}

      {/* Open Shift Modal */}
      {openShiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">เปิดกะ</h3>
              <button
                onClick={() => setOpenShiftModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนเงินเปิดกะ (บาท)
              </label>
              <input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                กรอกจำนวนเงินสดที่มีในลิ้นชักก่อนเริ่มกะ
              </p>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setOpenShiftModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleOpenShift}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                เปิดกะ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {closeShiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">ปิดกะ</h3>
              <button
                onClick={() => setCloseShiftModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Expected Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  ยอดที่ควรมี (คำนวณจากระบบ)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">เงินสด</div>
                    <div className="text-xl font-bold text-gray-900">
                      ฿{formatCurrency(expected.cash)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">ยอดโอน</div>
                    <div className="text-xl font-bold text-gray-900">
                      ฿{formatCurrency(expected.nonCash)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actual Amounts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ยอดเงินสดจริง (นับจากลิ้นชัก)
                </label>
                <input
                  type="number"
                  value={closeForm.actualCash}
                  onChange={(e) =>
                    setCloseForm({ ...closeForm, actualCash: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ยอดโอนจริง (เช็คจาก app ธนาคาร)
                </label>
                <input
                  type="number"
                  value={closeForm.actualNonCash}
                  onChange={(e) =>
                    setCloseForm({ ...closeForm, actualNonCash: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Difference Preview */}
              {closeForm.actualCash && closeForm.actualNonCash && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">ส่วนต่าง</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">เงินสด</div>
                      <div
                        className={`text-xl font-bold ${
                          parseFloat(closeForm.actualCash) - expected.cash >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {parseFloat(closeForm.actualCash) - expected.cash >= 0
                          ? '+'
                          : ''}
                        ฿
                        {formatCurrency(
                          parseFloat(closeForm.actualCash) - expected.cash
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">ยอดโอน</div>
                      <div
                        className={`text-xl font-bold ${
                          parseFloat(closeForm.actualNonCash) - expected.nonCash >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {parseFloat(closeForm.actualNonCash) - expected.nonCash >= 0
                          ? '+'
                          : ''}
                        ฿
                        {formatCurrency(
                          parseFloat(closeForm.actualNonCash) - expected.nonCash
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมายเหตุ (ถ้ามี)
                </label>
                <textarea
                  value={closeForm.note}
                  onChange={(e) =>
                    setCloseForm({ ...closeForm, note: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="อธิบายเหตุผลถ้ามีส่วนต่าง..."
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setCloseShiftModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCloseShift}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                ปิดกะ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {addExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">เพิ่มรายจ่าย</h3>
              <button
                onClick={() => setAddExpenseModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภท
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รายละเอียด
                </label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น ซื้อน้ำแข็ง 2 ถุง"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนเงิน (บาท)
                </label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setAddExpenseModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                เพิ่มรายจ่าย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
