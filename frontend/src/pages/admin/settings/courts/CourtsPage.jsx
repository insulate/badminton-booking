import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, ArrowLeft } from 'lucide-react';
import { courtsAPI } from '../../../../lib/api';
import { ROUTES } from '../../../../constants';
import toast from 'react-hot-toast';

const CourtsPage = () => {
  const navigate = useNavigate();
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const response = await courtsAPI.getAll();
      if (response.success) {
        setCourts(response.data);
      }
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast.error('ไม่สามารถโหลดข้อมูลสนามได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (court) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบสนาม "${court.name}"?`)) {
      return;
    }

    try {
      const response = await courtsAPI.delete(court._id);
      if (response.success) {
        toast.success('ลบสนามสำเร็จ');
        fetchCourts();
      }
    } catch (error) {
      console.error('Error deleting court:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบสนาม');
    }
  };

  // Filter courts
  const filteredCourts = courts.filter((court) => {
    const matchSearch =
      court.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      court.courtNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !filterType || court.type === filterType;
    const matchStatus = !filterStatus || court.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  // Type badge color
  const getTypeBadge = (type) => {
    const badges = {
      normal: 'bg-blue-100 text-blue-800',
      premium: 'bg-yellow-100 text-yellow-800',
      tournament: 'bg-purple-100 text-purple-800',
    };
    const labels = {
      normal: 'ธรรมดา',
      premium: 'พรีเมี่ยม',
      tournament: 'แข่งขัน',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[type]}`}>
        {labels[type]}
      </span>
    );
  };

  // Status badge color
  const getStatusBadge = (status) => {
    const badges = {
      available: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-red-100 text-red-800',
    };
    const labels = {
      available: 'พร้อมใช้งาน',
      maintenance: 'ปิดปรับปรุง',
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(ROUTES.ADMIN.DASHBOARD)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">จัดการสนาม</h1>
            <p className="text-gray-600 text-sm">
              จัดการข้อมูลสนามแบดมินตันทั้งหมด ({filteredCourts.length} สนาม)
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(ROUTES.ADMIN.COURTS_ADD)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          เพิ่มสนามใหม่
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหาสนาม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter by Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ประเภททั้งหมด</option>
            <option value="normal">ธรรมดา</option>
            <option value="premium">พรีเมี่ยม</option>
            <option value="tournament">แข่งขัน</option>
          </select>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">สถานะทั้งหมด</option>
            <option value="available">พร้อมใช้งาน</option>
            <option value="maintenance">ปิดปรับปรุง</option>
            <option value="inactive">ปิดใช้งาน</option>
          </select>
        </div>
      </div>

      {/* Courts Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รหัสสนาม
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อสนาม
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ราคา (บาท/ชม.)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCourts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || filterType || filterStatus
                      ? 'ไม่พบข้อมูลสนามที่ตรงกับเงื่อนไขการค้นหา'
                      : 'ยังไม่มีข้อมูลสนาม'}
                  </td>
                </tr>
              ) : (
                filteredCourts.map((court) => (
                  <tr key={court._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{court.courtNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{court.name}</div>
                      {court.description && (
                        <div className="text-sm text-gray-500">{court.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(court.type)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(court.status)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div>จ.-ศ.: {court.hourlyRate.weekday} ฿</div>
                        <div>ส.-อา.: {court.hourlyRate.weekend} ฿</div>
                        <div>หยุด: {court.hourlyRate.holiday} ฿</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              typeof ROUTES.ADMIN.COURTS_EDIT === 'function'
                                ? ROUTES.ADMIN.COURTS_EDIT(court._id)
                                : `/admin/settings/courts/edit/${court._id}`
                            )
                          }
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition"
                          title="แก้ไข"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(court)}
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
      </div>
    </div>
  );
};

export default CourtsPage;
