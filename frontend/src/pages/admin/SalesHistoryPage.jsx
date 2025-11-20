import { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { salesAPI } from '../../lib/api';

/**
 * SalesHistoryPage
 * หน้าประวัติการขาย (Sales History)
 */
const SalesHistoryPage = () => {
  // Get date helpers
  const getToday = () => new Date().toISOString().split('T')[0];
  const getYesterday = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  };
  const getThisWeekStart = () => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day;
    date.setDate(diff);
    return date.toISOString().split('T')[0];
  };
  const getThisMonthStart = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  };

  // State
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState('today');
  const [customDateFrom, setCustomDateFrom] = useState(getToday());
  const [customDateTo, setCustomDateTo] = useState(getToday());
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Load sales on mount and filter change
  useEffect(() => {
    loadSales();
  }, [dateRange, customDateFrom, customDateTo, paymentMethod, pagination.page]);

  // Get date filter values
  const getDateFilter = () => {
    switch (dateRange) {
      case 'today':
        return { startDate: getToday(), endDate: getToday() };
      case 'yesterday':
        return { startDate: getYesterday(), endDate: getYesterday() };
      case 'week':
        return { startDate: getThisWeekStart(), endDate: getToday() };
      case 'month':
        return { startDate: getThisMonthStart(), endDate: getToday() };
      case 'custom':
        return { startDate: customDateFrom, endDate: customDateTo };
      default:
        return {};
    }
  };

  // Load sales from API
  const loadSales = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateFilter();
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (paymentMethod !== 'all') params.paymentMethod = paymentMethod;
      if (searchQuery) params.search = searchQuery;

      const response = await salesAPI.getAll(params);

      if (response.success) {
        setSales(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        }));
      }
    } catch (error) {
      console.error('Load sales error:', error);
      toast.error('ไม่สามารถโหลดรายการขายได้');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadSales();
  };

  // Handle view details
  const handleViewDetails = async (sale) => {
    try {
      const response = await salesAPI.getById(sale._id);
      if (response.success) {
        setSelectedSale(response.data);
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error('Load sale details error:', error);
      toast.error('ไม่สามารถโหลดรายละเอียดได้');
    }
  };

  // Format date/time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} ${timeStr} น.`;
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Get payment method badge
  const getPaymentMethodBadge = (method) => {
    const badges = {
      cash: { bg: 'bg-green-100', text: 'text-green-800', label: 'เงินสด' },
      promptpay: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'พร้อมเพย์' },
      transfer: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'โอนเงิน' },
      credit_card: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'บัตรเครดิต' },
    };
    const badge = badges[method] || badges.cash;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Receipt className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ประวัติการขาย</h1>
            <p className="text-sm text-gray-600">ดูรายการขายทั้งหมดและรายละเอียด</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              ช่วงเวลา
            </label>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">วันนี้</option>
              <option value="yesterday">เมื่อวาน</option>
              <option value="week">สัปดาห์นี้</option>
              <option value="month">เดือนนี้</option>
              <option value="custom">กำหนดเอง</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จากวันที่
                </label>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ถึงวันที่
                </label>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              วิธีชำระเงิน
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="cash">เงินสด</option>
              <option value="promptpay">พร้อมเพย์</option>
              <option value="transfer">โอนเงิน</option>
              <option value="credit_card">บัตรเครดิต</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              ค้นหา Sale Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="S-00001"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">จำนวนรายการ</p>
          <p className="text-2xl font-bold text-gray-900">{pagination.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">ยอดขายรวม</p>
          <p className="text-2xl font-bold text-blue-600">
            ฿{formatPrice(sales.reduce((sum, sale) => sum + sale.total, 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">ค่าเฉลี่ยต่อรายการ</p>
          <p className="text-2xl font-bold text-gray-900">
            ฿{formatPrice(sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0)}
          </p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ไม่พบรายการขายในช่วงเวลาที่เลือก</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่/เวลา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ลูกค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รายการ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ยอดรวม
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วิธีชำระเงิน
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-semibold text-blue-600">
                          {sale.saleCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(sale.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {sale.customer ? (
                          <div>
                            <p className="font-medium">{sale.customer.name || '-'}</p>
                            <p className="text-gray-500 text-xs">{sale.customer.phone || '-'}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.items?.length || 0} รายการ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ฿{formatPrice(sale.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentMethodBadge(sale.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleViewDetails(sale)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                          <span>ดูรายละเอียด</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  แสดง {(pagination.page - 1) * pagination.limit + 1} ถึง{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    หน้า {pagination.page} จาก {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">รายละเอียดการขาย</h2>
                <p className="text-sm text-gray-600 mt-1 font-mono">{selectedSale.saleCode}</p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">วันที่/เวลา</p>
                  <p className="font-medium">{formatDateTime(selectedSale.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">วิธีชำระเงิน</p>
                  <div className="mt-1">{getPaymentMethodBadge(selectedSale.paymentMethod)}</div>
                </div>
              </div>

              {/* Customer Info */}
              {selectedSale.customer && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">ข้อมูลลูกค้า</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-600">ชื่อ:</span>{' '}
                      <span className="font-medium">{selectedSale.customer.name || '-'}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">เบอร์:</span>{' '}
                      <span className="font-medium">{selectedSale.customer.phone || '-'}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">ประเภท:</span>{' '}
                      <span className="font-medium">
                        {selectedSale.customer.type === 'member' ? 'สมาชิก' : 'ลูกค้าทั่วไป'}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">รายการสินค้า</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          สินค้า
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          จำนวน
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          ราคา
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          รวม
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedSale.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm">
                            <p className="font-medium text-gray-900">
                              {item.product?.name || 'ไม่ระบุชื่อ'}
                            </p>
                            {item.product?.sku && (
                              <p className="text-xs text-gray-500">{item.product.sku}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">฿{formatPrice(item.price)}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">
                            ฿{formatPrice(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">ยอดรวมทั้งหมด</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ฿{formatPrice(selectedSale.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;
