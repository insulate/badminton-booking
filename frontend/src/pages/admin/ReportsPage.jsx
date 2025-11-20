import { useState, useEffect } from 'react';
import { reportsAPI } from '../../lib/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Award,
} from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/common';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'day', 'month', 'year'
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());

  // Data states
  const [revenueData, setRevenueData] = useState(null);
  const [bookingsSummary, setBookingsSummary] = useState(null);
  const [productsSales, setProductsSales] = useState(null);
  const [courtsUsage, setCourtsUsage] = useState(null);

  // Fetch revenue data based on selected period
  useEffect(() => {
    fetchReports();
  }, [selectedPeriod, selectedDate, selectedMonth, selectedYear]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      // Calculate date range based on selected period
      let startDate, endDate;

      if (selectedPeriod === 'day') {
        startDate = selectedDate;
        endDate = selectedDate;
      } else if (selectedPeriod === 'month') {
        const [year, month] = selectedMonth.split('-');
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
      } else {
        startDate = `${selectedYear}-01-01`;
        endDate = `${selectedYear}-12-31`;
      }

      // Fetch revenue based on period
      let revenueResponse;
      if (selectedPeriod === 'day') {
        revenueResponse = await reportsAPI.getDailyRevenue(selectedDate);
      } else if (selectedPeriod === 'month') {
        revenueResponse = await reportsAPI.getMonthlyRevenue(selectedMonth);
      } else {
        revenueResponse = await reportsAPI.getYearlyRevenue(selectedYear);
      }
      setRevenueData(revenueResponse.data);

      // Fetch other reports with date range
      const [bookings, products, courts] = await Promise.all([
        reportsAPI.getBookingsSummary(startDate, endDate),
        reportsAPI.getProductsSales(startDate, endDate, 10),
        reportsAPI.getCourtsUsage(startDate, endDate),
      ]);

      setBookingsSummary(bookings.data);
      setProductsSales(products.data);
      setCourtsUsage(courts.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Prepare revenue chart data
  const getRevenueChartData = () => {
    if (!revenueData) return [];

    if (selectedPeriod === 'day') {
      // Add safety check for breakdown
      if (!revenueData.breakdown) return [];

      return [
        {
          name: 'Bookings',
          value: revenueData.breakdown.bookings?.revenue || 0,
        },
        {
          name: 'Sales',
          value: revenueData.breakdown.sales?.revenue || 0,
        },
        {
          name: 'Group Play',
          value: revenueData.breakdown.groupPlay?.revenue || 0,
        },
      ].filter((item) => item.value > 0);
    } else if (selectedPeriod === 'month') {
      return revenueData.dailyData || [];
    } else {
      return revenueData.monthlyData || [];
    }
  };

  // Prepare bookings status chart data
  const getBookingsStatusData = () => {
    if (!bookingsSummary?.byStatus) return [];
    return bookingsSummary.byStatus.map((item) => ({
      name: item._id === 'confirmed' ? 'ยืนยันแล้ว' : item._id === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก',
      value: item.count,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded"></div>
            <div className="h-4 w-48 bg-gray-100 rounded mt-2"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-96 bg-white rounded-xl border border-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageContainer variant="full"><div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="รายงานและสถิติ"
        subtitle="สรุปรายได้และข้อมูลการดำเนินงาน"
        icon={BarChart3}
        iconColor="purple"
        actions={
          /* Period Selector */
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedPeriod('day')}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                selectedPeriod === 'day'
                  ? 'bg-white text-blue-600 shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>รายวัน</span>
              </div>
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                selectedPeriod === 'month'
                  ? 'bg-white text-blue-600 shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>รายเดือน</span>
              </div>
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                selectedPeriod === 'year'
                  ? 'bg-white text-blue-600 shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>รายปี</span>
              </div>
            </button>
          </div>

          {/* Date Picker */}
          <div>
            {selectedPeriod === 'day' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:border-gray-300"
              />
            )}
            {selectedPeriod === 'month' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:border-gray-300"
              />
            )}
            {selectedPeriod === 'year' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:border-gray-300 cursor-pointer"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year + 543}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        }
      />

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <div className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="p-2 bg-white/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">รายได้รวม</p>
            <p className="text-3xl font-bold tracking-tight">{formatCurrency(revenueData?.totalRevenue || 0)}</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-blue-100">
                {selectedPeriod === 'day' && `วันที่ ${new Date(selectedDate).toLocaleDateString('th-TH')}`}
                {selectedPeriod === 'month' && `เดือน ${new Date(selectedMonth).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`}
                {selectedPeriod === 'year' && `ปี ${parseInt(selectedYear) + 543}`}
              </p>
            </div>
          </div>
        </div>

        {selectedPeriod === 'day' && revenueData?.breakdown && (
          <>
            {/* Bookings Card */}
            <div className="group relative bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">การจองสนาม</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {formatCurrency(revenueData.breakdown.bookings.revenue)}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="px-3 py-1 bg-emerald-50 rounded-full">
                    <p className="text-sm text-emerald-700 font-medium">{revenueData.breakdown.bookings.count} รายการ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Card */}
            <div className="group relative bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-50 rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">ขายสินค้า (POS)</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {formatCurrency(revenueData.breakdown.sales.revenue)}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="px-3 py-1 bg-amber-50 rounded-full">
                    <p className="text-sm text-amber-700 font-medium">{revenueData.breakdown.sales.count} รายการ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Group Play Card */}
            <div className="group relative bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-200 overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-50 rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-purple-600 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">ก๊วนสนาม</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {formatCurrency(revenueData.breakdown.groupPlay.revenue)}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="px-3 py-1 bg-purple-50 rounded-full">
                    <p className="text-sm text-purple-700 font-medium">{revenueData.breakdown.groupPlay.count} คน</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedPeriod !== 'day' && (
          <>
            {/* Total Bookings Card */}
            <div className="group relative bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">การจองทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {bookingsSummary?.summary.totalBookings || 0}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="px-3 py-1 bg-emerald-50 rounded-full">
                    <p className="text-sm text-emerald-700 font-medium">รายการ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Sales Card */}
            <div className="group relative bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-50 rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">ยอดขายสินค้า</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {formatCurrency(productsSales?.summary.totalRevenue || 0)}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="px-3 py-1 bg-amber-50 rounded-full">
                    <p className="text-sm text-amber-700 font-medium">{productsSales?.summary.totalQuantity || 0} ชิ้น</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Courts Usage Card */}
            <div className="group relative bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-200 overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-50 rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-purple-600 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">สนามทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {courtsUsage?.summary.totalCourts || 0}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="px-3 py-1 bg-purple-50 rounded-full">
                    <p className="text-sm text-purple-700 font-medium">{courtsUsage?.summary.totalHours || 0} ชั่วโมง</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                {selectedPeriod === 'day' ? (
                  <PieChartIcon className="w-5 h-5 text-white" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-white" />
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedPeriod === 'day' ? 'แยกตามประเภทรายได้' : 'แนวโน้มรายได้'}
              </h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {selectedPeriod === 'day' ? (
              <PieChart>
                <Pie
                  data={getRevenueChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getRevenueChartData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            ) : (
              <LineChart data={getRevenueChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={selectedPeriod === 'month' ? 'date' : 'month'}
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" name="รวม" strokeWidth={2} />
                <Line type="monotone" dataKey="bookings" stroke="#10b981" name="จองสนาม" />
                <Line type="monotone" dataKey="sales" stroke="#f59e0b" name="ขายสินค้า" />
                <Line type="monotone" dataKey="groupPlay" stroke="#ef4444" name="ก๊วนสนาม" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Bookings Status Chart */}
        {bookingsSummary && getBookingsStatusData().length > 0 && (
          <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                <PieChartIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">สถานะการจอง</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getBookingsStatusData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getBookingsStatusData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Products Sales Table */}
      {productsSales && productsSales.products.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
          <div className="p-8 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">สินค้าขายดี (Top 10)</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    อันดับ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    สินค้า
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    หมวดหมู่
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    จำนวน
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ยอดขาย
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ราคาเฉลี่ย
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {productsSales.products.map((product, index) => (
                  <tr key={product.productId} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                        index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-md' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-semibold text-gray-900">{product.productName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{product.sku}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {product.totalQuantity}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-emerald-600 text-right">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 text-right">
                      {formatCurrency(product.averagePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Courts Usage Chart */}
      {courtsUsage && courtsUsage.courts.length > 0 && (
        <div className="bg-white rounded-2xl p-8 border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">การใช้งานสนาม</h2>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={courtsUsage.courts}>
              <defs>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="courtName"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#3b82f6"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                formatter={(value, name) => [name === 'รายได้' ? formatCurrency(value) : value, name]}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar
                yAxisId="left"
                dataKey="totalBookings"
                fill="url(#colorBookings)"
                name="จำนวนการจอง"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="totalRevenue"
                fill="url(#colorRevenue)"
                name="รายได้"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div></PageContainer>
  );
};

export default ReportsPage;
