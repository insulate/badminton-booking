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
import { PageContainer, PageHeader } from '../../components/common';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * SalesHistoryPage
 * หน้าประวัติการขาย (Sales History)
 */
const SalesHistoryPage = () => {
  // Get today's date
  const getToday = () => new Date().toISOString().split('T')[0];

  // State
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters - Default to today's date
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
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
  }, [startDate, endDate, paymentMethod, pagination.page]);

  // Load sales from API
  const loadSales = async () => {
    setLoading(true);
    try {
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
    <PageContainer variant="full">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="ประวัติการขาย"
          subtitle="ดูรายการขายทั้งหมดและรายละเอียด"
          icon={Receipt}
          iconColor="orange"
          actions={
            <div className="flex items-center gap-3 bg-orange-50 px-6 py-3 rounded-xl border border-orange-200">
              <Receipt className="w-6 h-6 text-orange-600" />
              <div className="text-right">
                <div className="text-orange-600 text-xs">ทั้งหมด</div>
                <div className="text-orange-600 font-bold text-xl">{pagination.total || 0}</div>
              </div>
            </div>
          }
        />

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                จากวันที่
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                ถึงวันที่
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
              />
            </div>

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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="S-00001"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm hover:shadow-md"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-white to-blue-50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">จำนวนรายการ</p>
            <p className="text-3xl font-bold text-gray-900">{pagination.total || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-purple-50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-purple-100">
            <p className="text-sm text-gray-600 mb-1">ยอดขายรวม</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ฿{formatPrice(sales.reduce((sum, sale) => sum + sale.total, 0))}
            </p>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">ค่าเฉลี่ยต่อรายการ</p>
            <p className="text-3xl font-bold text-gray-900">
              ฿{formatPrice(sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0)}
            </p>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
              <p className="text-gray-600 font-medium">กำลังโหลดรายการขาย...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-16">
              <Receipt className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">ไม่พบรายการขาย</p>
              <p className="text-gray-400 text-sm mt-2">ลองเปลี่ยนช่วงวันที่หรือตัวกรองอื่น</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Sale Code
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        วันที่/เวลา
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ลูกค้า
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        รายการ
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        ยอดรวม
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        วิธีชำระเงิน
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 divide-y divide-gray-200">
                    {sales.map((sale) => (
                      <tr key={sale._id} className="hover:bg-blue-50/50 transition-colors">
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
                            className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white/50">
                  <div className="text-sm text-gray-700">
                    แสดง {(pagination.page - 1) * pagination.limit + 1} ถึง{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} จาก {pagination.total} รายการ
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 px-3">
                      หน้า {pagination.page} จาก {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">รายละเอียดการขาย</h2>
                  <p className="text-blue-100 text-sm mt-1 font-mono">{selectedSale.saleCode}</p>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">วันที่/เวลา</p>
                  <p className="font-medium text-gray-900">{formatDateTime(selectedSale.createdAt)}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">วิธีชำระเงิน</p>
                  <div className="mt-1">{getPaymentMethodBadge(selectedSale.paymentMethod)}</div>
                </div>
              </div>

              {/* Customer Info */}
              {selectedSale.customer && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1 rounded-lg">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    ข้อมูลลูกค้า
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">ชื่อ:</span>{' '}
                      <span className="font-medium text-gray-900">{selectedSale.customer.name || '-'}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">เบอร์:</span>{' '}
                      <span className="font-medium text-gray-900">{selectedSale.customer.phone || '-'}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">ประเภท:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {selectedSale.customer.type === 'member' ? 'สมาชิก' : 'ลูกค้าทั่วไป'}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1 rounded-lg">
                    <Receipt className="w-4 h-4 text-white" />
                  </div>
                  รายการสินค้า
                </h3>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          สินค้า
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          จำนวน
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          ราคา
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          รวม
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {selectedSale.items?.map((item, index) => (
                        <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {/* Product Image */}
                              <div className="flex-shrink-0">
                                {item.product?.image ? (
                                  <img
                                    src={item.product.image.startsWith('data:') ? item.product.image : `${API_URL.replace('/api', '')}${item.product.image}`}
                                    alt={item.product?.name || 'Product'}
                                    className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                                    <Receipt className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              {/* Product Name & SKU */}
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 text-sm">
                                  {item.product?.name || 'ไม่ระบุชื่อ'}
                                </p>
                                {item.product?.sku && (
                                  <p className="text-xs text-gray-500 mt-0.5">SKU: {item.product.sku}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">฿{formatPrice(item.price)}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                            ฿{formatPrice(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-5">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">ยอดรวมทั้งหมด</span>
                  <span className="text-3xl font-bold text-white">
                    ฿{formatPrice(selectedSale.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default SalesHistoryPage;
