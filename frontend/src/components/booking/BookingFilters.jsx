import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { Search, X } from 'lucide-react';

/**
 * BookingFilters Component
 * ฟิลเตอร์สำหรับค้นหาและกรองรายการจอง
 */
const BookingFilters = ({ filters, onFilterChange }) => {
  const [courts, setCourts] = useState([]);
  const [localFilters, setLocalFilters] = useState(filters);

  // Load courts for filter dropdown
  useEffect(() => {
    loadCourts();
  }, []);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Load courts
  const loadCourts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.COURTS.LIST}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setCourts(response.data.data || []);
      }
    } catch (error) {
      console.error('Load courts error:', error);
    }
  };

  // Handle filter change
  const handleChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
  };

  // Apply filters
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters = {
      dateFrom: '',
      dateTo: '',
      status: 'all',
      courtId: 'all',
      search: '',
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Check if any filter is active
  const hasActiveFilters = () => {
    return (
      localFilters.dateFrom ||
      localFilters.dateTo ||
      localFilters.status !== 'all' ||
      localFilters.courtId !== 'all' ||
      localFilters.search
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date From */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
            วันที่เริ่มต้น
          </label>
          <input
            type="date"
            id="dateFrom"
            value={localFilters.dateFrom}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
            วันที่สิ้นสุด
          </label>
          <input
            type="date"
            id="dateTo"
            value={localFilters.dateTo}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            สถานะ
          </label>
          <select
            id="status"
            value={localFilters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">ทั้งหมด</option>
            <option value="payment_pending">รอชำระเงิน</option>
            <option value="pending">รอยืนยัน</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="checked-in">เช็คอินแล้ว</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
        </div>

        {/* Court */}
        <div>
          <label htmlFor="courtId" className="block text-sm font-medium text-gray-700 mb-1">
            สนาม
          </label>
          <select
            id="courtId"
            value={localFilters.courtId}
            onChange={(e) => handleChange('courtId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">ทุกสนาม</option>
            {courts.map((court) => (
              <option key={court._id} value={court._id}>
                {court.courtNumber} - {court.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-4">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
          ค้นหา
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            id="search"
            placeholder="รหัสจอง, ชื่อลูกค้า, เบอร์โทร..."
            value={localFilters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-end gap-3">
        {hasActiveFilters() && (
          <button
            onClick={handleClearFilters}
            className="tooltip tooltip-bottom inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            data-tooltip="ล้างฟิลเตอร์ทั้งหมด"
          >
            <X size={16} className="mr-2" />
            ล้างฟิลเตอร์
          </button>
        )}
        <button
          onClick={handleApplyFilters}
          className="tooltip tooltip-bottom inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          data-tooltip="ค้นหารายการจอง"
        >
          <Search size={16} className="mr-2" />
          ค้นหา
        </button>
      </div>
    </div>
  );
};

export default BookingFilters;
