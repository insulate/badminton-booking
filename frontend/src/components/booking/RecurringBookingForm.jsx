import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { courtsAPI, timeslotsAPI, playersAPI } from '../../lib/api';

const DAY_OPTIONS = [
  { value: 0, label: 'อา', fullLabel: 'อาทิตย์' },
  { value: 1, label: 'จ', fullLabel: 'จันทร์' },
  { value: 2, label: 'อ', fullLabel: 'อังคาร' },
  { value: 3, label: 'พ', fullLabel: 'พุธ' },
  { value: 4, label: 'พฤ', fullLabel: 'พฤหัสบดี' },
  { value: 5, label: 'ศ', fullLabel: 'ศุกร์' },
  { value: 6, label: 'ส', fullLabel: 'เสาร์' },
];

const RecurringBookingForm = ({ onPreview, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerNickname: '',
    customerPhone: '',
    customerEmail: '',
    customerId: '', // เพิ่มสำหรับเก็บ ID ของลูกค้าที่เลือก
    court: '',
    timeSlot: '',
    duration: 1,
    daysOfWeek: [],
    startDate: '',
    endDate: '',
    paymentMode: 'per_session',
    notes: '',
  });

  const [courts, setCourts] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingData, setLoadingData] = useState(true);

  // Customer search states
  const [players, setPlayers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const customerSearchRef = useRef(null);

  // Fetch courts, timeslots, and players
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [courtsRes, timeSlotsRes, playersRes] = await Promise.all([
          courtsAPI.getAll(),
          timeslotsAPI.getAll(),
          playersAPI.getAll({ status: 'active', limit: 1000 }),
        ]);

        if (courtsRes.success) {
          setCourts(courtsRes.data.filter((c) => c.status === 'available'));
        }
        if (timeSlotsRes.success) {
          // Filter active weekday timeslots only (recurring bookings use weekday pricing)
          setTimeSlots(
            timeSlotsRes.data.filter((ts) => ts.status === 'active' && ts.dayType === 'weekday')
          );
        }
        if (playersRes.success) {
          setPlayers(playersRes.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter players based on search
  const filteredPlayers = players.filter((player) => {
    if (!customerSearch.trim()) return true;
    const search = customerSearch.toLowerCase();
    return (
      player.name?.toLowerCase().includes(search) ||
      player.phone?.includes(search) ||
      player.email?.toLowerCase().includes(search)
    );
  }).slice(0, 10); // Limit to 10 results

  // Handle customer selection
  const handleSelectCustomer = (player) => {
    setSelectedCustomer(player);
    setCustomerSearch(player.name);
    setFormData((prev) => ({
      ...prev,
      customerId: player._id,
      customerName: player.name,
      customerNickname: player.nickname || '',
      customerPhone: player.phone || '',
      customerEmail: player.email || '',
    }));
    setShowCustomerDropdown(false);
    setIsNewCustomer(false);
    // Clear customer errors
    setErrors((prev) => ({ ...prev, customerName: '', customerPhone: '' }));
  };

  // Handle new customer mode
  const handleNewCustomer = () => {
    setIsNewCustomer(true);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setFormData((prev) => ({
      ...prev,
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
    }));
    setShowCustomerDropdown(false);
  };

  // Clear selected customer
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setIsNewCustomer(false);
    setFormData((prev) => ({
      ...prev,
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
    }));
  };

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    setFormData((prev) => ({
      ...prev,
      startDate: today.toISOString().split('T')[0],
      endDate: threeMonthsLater.toISOString().split('T')[0],
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const newDays = prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort((a, b) => a - b);
      return { ...prev, daysOfWeek: newDays };
    });
    if (errors.daysOfWeek) {
      setErrors((prev) => ({ ...prev, daysOfWeek: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'กรุณากรอกชื่อลูกค้า';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else if (!/^0[0-9]{9}$/.test(formData.customerPhone.replace(/[-\s]/g, ''))) {
      newErrors.customerPhone = 'รูปแบบเบอร์โทรไม่ถูกต้อง';
    }

    if (!formData.court) {
      newErrors.court = 'กรุณาเลือกสนาม';
    }

    if (!formData.timeSlot) {
      newErrors.timeSlot = 'กรุณาเลือกช่วงเวลา';
    }

    if (formData.daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'กรุณาเลือกวันอย่างน้อย 1 วัน';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'กรุณาเลือกวันเริ่มต้น';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'กรุณาเลือกวันสิ้นสุด';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        newErrors.startDate = 'วันเริ่มต้นต้องไม่น้อยกว่าวันนี้';
      }

      if (end < start) {
        newErrors.endDate = 'วันสิ้นสุดต้องมากกว่าวันเริ่มต้น';
      }

      // Check max 3 months
      const maxEnd = new Date(start);
      maxEnd.setMonth(maxEnd.getMonth() + 3);
      if (end > maxEnd) {
        newErrors.endDate = 'ระยะเวลาต้องไม่เกิน 3 เดือน';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const selectedCourt = courts.find((c) => c._id === formData.court);
    const selectedTimeSlot = timeSlots.find((ts) => ts._id === formData.timeSlot);

    onPreview({
      customer: {
        name: formData.customerName,
        nickname: formData.customerNickname,
        phone: formData.customerPhone,
        email: formData.customerEmail,
      },
      court: formData.court,
      courtInfo: selectedCourt,
      timeSlot: formData.timeSlot,
      timeSlotInfo: selectedTimeSlot,
      duration: parseFloat(formData.duration),
      daysOfWeek: formData.daysOfWeek,
      startDate: formData.startDate,
      endDate: formData.endDate,
      paymentMode: formData.paymentMode,
      notes: formData.notes,
    });
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ลูกค้า <span className="text-red-500">*</span>
        </label>

        {/* Show selected customer or search */}
        {selectedCustomer ? (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <div className="font-medium text-blue-900">
                {selectedCustomer.name}
                {selectedCustomer.nickname && <span className="text-blue-700 font-normal"> ({selectedCustomer.nickname})</span>}
              </div>
              <div className="text-sm text-blue-700">
                {selectedCustomer.phone}
                {selectedCustomer.email && ` • ${selectedCustomer.email}`}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClearCustomer}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              เปลี่ยน
            </button>
          </div>
        ) : isNewCustomer ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">กรอกข้อมูลลูกค้าใหม่</span>
              <button
                type="button"
                onClick={handleClearCustomer}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                เลือกจากระบบแทน
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.customerName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="ชื่อจริง *"
                />
                {errors.customerName && <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>}
              </div>
              <div>
                <input
                  type="text"
                  name="customerNickname"
                  value={formData.customerNickname}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ชื่อเล่น (ไม่บังคับ)"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.customerPhone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="เบอร์โทร * (08XXXXXXXX)"
                />
                {errors.customerPhone && <p className="mt-1 text-xs text-red-600">{errors.customerPhone}</p>}
              </div>
              <div>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="อีเมล (ไม่บังคับ)"
                />
              </div>
            </div>
          </div>
        ) : (
          <div ref={customerSearchRef} className="relative">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerDropdown(true);
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.customerName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์โทร, อีเมล)..."
            />

            {/* Dropdown */}
            {showCustomerDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredPlayers.length > 0 ? (
                  <>
                    {filteredPlayers.map((player) => (
                      <button
                        key={player._id}
                        type="button"
                        onClick={() => handleSelectCustomer(player)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 flex justify-between items-center border-b border-gray-100 last:border-b-0"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{player.name}</div>
                          <div className="text-sm text-gray-500">
                            {player.phone}
                            {player.email && ` • ${player.email}`}
                          </div>
                        </div>
                        {player.membershipType && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            player.membershipType === 'member'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {player.membershipType === 'member' ? 'สมาชิก' : 'ทั่วไป'}
                          </span>
                        )}
                      </button>
                    ))}
                  </>
                ) : customerSearch.trim() ? (
                  <div className="px-4 py-3 text-gray-500 text-sm">ไม่พบลูกค้าที่ค้นหา</div>
                ) : null}

                {/* Add new customer option */}
                <button
                  type="button"
                  onClick={handleNewCustomer}
                  className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium flex items-center gap-2 border-t"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  เพิ่มลูกค้าใหม่ (กรอกเอง)
                </button>
              </div>
            )}
            {errors.customerName && <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>}
          </div>
        )}
      </div>

      {/* Court & TimeSlot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            สนาม <span className="text-red-500">*</span>
          </label>
          <select
            name="court"
            value={formData.court}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.court ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">เลือกสนาม</option>
            {courts.map((court) => (
              <option key={court._id} value={court._id}>
                สนาม {court.courtNumber} - {court.name}
              </option>
            ))}
          </select>
          {errors.court && <p className="mt-1 text-xs text-red-600">{errors.court}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ช่วงเวลา <span className="text-red-500">*</span>
          </label>
          <select
            name="timeSlot"
            value={formData.timeSlot}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.timeSlot ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">เลือกช่วงเวลา</option>
            {timeSlots.map((ts) => (
              <option key={ts._id} value={ts._id}>
                {ts.startTime} - {ts.endTime}
                {ts.peakHour && ' (Peak)'}
              </option>
            ))}
          </select>
          {errors.timeSlot && <p className="mt-1 text-xs text-red-600">{errors.timeSlot}</p>}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ระยะเวลา (ชั่วโมง) <span className="text-red-500">*</span>
        </label>
        <select
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Array.from({ length: 8 }, (_, i) => (i + 1) * 0.5).map((hours) => (
            <option key={hours} value={hours}>
              {hours === 0.5 ? '30 นาที' : hours % 1 === 0 ? `${hours} ชั่วโมง` : `${Math.floor(hours)} ชม. 30 นาที`}
            </option>
          ))}
        </select>
      </div>

      {/* Days of Week Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          วันที่ต้องการจองประจำ <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => handleDayToggle(day.value)}
              className={`tooltip px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.daysOfWeek.includes(day.value)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
              }`}
              data-tooltip={day.fullLabel}
            >
              {day.label}
            </button>
          ))}
        </div>
        {errors.daysOfWeek && <p className="mt-1 text-xs text-red-600">{errors.daysOfWeek}</p>}
        {formData.daysOfWeek.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            เลือกแล้ว: {formData.daysOfWeek.map((d) => DAY_OPTIONS.find((o) => o.value === d)?.fullLabel).join(', ')}
          </p>
        )}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันเริ่มต้น <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.startDate ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันสิ้นสุด <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            min={formData.startDate}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.endDate ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
        </div>
      </div>

      {/* Payment Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">รูปแบบการชำระเงิน</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMode"
              value="per_session"
              checked={formData.paymentMode === 'per_session'}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">จ่ายทีละครั้ง</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMode"
              value="bulk"
              checked={formData.paymentMode === 'bulk'}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">จ่ายรวมทั้งหมด</span>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="หมายเหตุเพิ่มเติม"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'กำลังตรวจสอบ...' : 'ดูตัวอย่าง'}
        </button>
      </div>
    </form>
  );
};

export default RecurringBookingForm;
