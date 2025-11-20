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

      // Fetch other reports
      const [bookings, products, courts] = await Promise.all([
        reportsAPI.getBookingsSummary(),
        reportsAPI.getProductsSales(null, null, 10),
        reportsAPI.getCourtsUsage(),
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงานและสถิติ</h1>
          <p className="text-gray-600">สรุปรายได้และข้อมูลการดำเนินงาน</p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('day')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              รายวัน
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              รายเดือน
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              รายปี
            </button>
          </div>

          {/* Date Picker */}
          <div>
            {selectedPeriod === 'day' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {selectedPeriod === 'month' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {selectedPeriod === 'year' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">รายได้รวม</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(revenueData?.totalRevenue || 0)}</p>
            </div>
            <svg className="w-12 h-12 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {selectedPeriod === 'day' && revenueData?.breakdown && (
          <>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">การจองสนาม</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(revenueData.breakdown.bookings.revenue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{revenueData.breakdown.bookings.count} รายการ</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">ขายสินค้า (POS)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(revenueData.breakdown.sales.revenue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{revenueData.breakdown.sales.count} รายการ</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">ก๊วนสนาม</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(revenueData.breakdown.groupPlay.revenue)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{revenueData.breakdown.groupPlay.count} คน</p>
            </div>
          </>
        )}

        {selectedPeriod !== 'day' && (
          <>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">การจองทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {bookingsSummary?.summary.totalBookings || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">รายการ</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">ยอดขายสินค้า</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(productsSales?.summary.totalRevenue || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{productsSales?.summary.totalQuantity || 0} ชิ้น</p>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <p className="text-gray-600 text-sm">สนามทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{courtsUsage?.summary.totalCourts || 0}</p>
              <p className="text-sm text-gray-500 mt-1">
                {courtsUsage?.summary.totalHours || 0} ชั่วโมง
              </p>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedPeriod === 'day' ? 'แยกตามประเภทรายได้' : 'แนวโน้มรายได้'}
          </h2>
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
                  {getRevenueChartData().map((entry, index) => (
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
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">สถานะการจอง</h2>
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
                  {getBookingsStatusData().map((entry, index) => (
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
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">สินค้าขายดี (Top 10)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    อันดับ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สินค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หมวดหมู่
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จำนวน
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดขาย
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ราคาเฉลี่ย
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productsSales.products.map((product, index) => (
                  <tr key={product.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {product.totalQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
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
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">การใช้งานสนาม</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courtsUsage.courts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="courtName" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value, name) => [name === 'รายได้' ? formatCurrency(value) : value, name]} />
              <Legend />
              <Bar yAxisId="left" dataKey="totalBookings" fill="#3b82f6" name="จำนวนการจอง" />
              <Bar yAxisId="right" dataKey="totalRevenue" fill="#10b981" name="รายได้" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
