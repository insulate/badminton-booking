import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Users, Plus, Search, RefreshCw, Trash2, Edit2, Phone, Calendar, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { playersAPI } from '../../lib/api';
import { getAllLevels } from '../../constants/playerLevels';
import PlayerLevelBadge from '../../components/players/PlayerLevelBadge';
import PlayerStatsCard from '../../components/players/PlayerStatsCard';
import PlayerForm from '../../components/players/PlayerForm';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const levels = getAllLevels();

  // Fetch players
  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (levelFilter) params.level = levelFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await playersAPI.getAll(params);
      if (response.success) {
        setPlayers(response.data);
        // Don't set filteredPlayers here - let useEffect handle filtering
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [levelFilter, statusFilter]);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Filter, sort and paginate players
  const processedPlayers = useMemo(() => {
    // Step 1: Filter
    let filtered = players;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const searchNumbers = searchTerm.replace(/\D/g, '');

      filtered = players.filter((player) => {
        const nameMatch = player.name.toLowerCase().includes(searchLower);
        const phoneMatch = searchNumbers && player.phone.includes(searchNumbers);
        return nameMatch || phoneMatch;
      });
    }

    // Step 2: Sort
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'level':
          // Sort by level value (C, B-, B, B+, A-, A, A+, S)
          const levelOrder = { 'C': 0, 'B-': 1, 'B': 2, 'B+': 3, 'A-': 4, 'A': 5, 'A+': 6, 'S': 7 };
          aValue = levelOrder[a.level] ?? -1;
          bValue = levelOrder[b.level] ?? -1;
          break;
        case 'gamesPlayed':
          aValue = a.stats?.gamesPlayed ?? 0;
          bValue = b.stats?.gamesPlayed ?? 0;
          break;
        case 'lastPlayed':
          aValue = a.stats?.lastPlayed ? new Date(a.stats.lastPlayed).getTime() : 0;
          bValue = b.stats?.lastPlayed ? new Date(b.stats.lastPlayed).getTime() : 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [searchTerm, players, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(processedPlayers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlayers = processedPlayers.slice(startIndex, endIndex);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, levelFilter, statusFilter]);

  // Open create form
  const handleOpenCreateForm = () => {
    setSelectedPlayer(null);
    setShowForm(true);
  };

  // Open edit form
  const handleOpenEditForm = (player) => {
    setSelectedPlayer(player);
    setShowForm(true);
  };

  // Close form
  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedPlayer(null);
  };

  // Handle submit (create or edit)
  const handleSubmit = async (data) => {
    try {
      setFormLoading(true);

      if (selectedPlayer) {
        // Edit mode
        const response = await playersAPI.update(selectedPlayer._id, data);
        if (response.success) {
          toast.success('อัปเดตข้อมูลผู้เล่นสำเร็จ');
          fetchPlayers();
          handleCloseForm();
        }
      } else {
        // Create mode
        const response = await playersAPI.create(data);
        if (response.success) {
          toast.success('เพิ่มผู้เล่นสำเร็จ');
          fetchPlayers();
          handleCloseForm();
        }
      }
    } catch (error) {
      console.error('Error saving player:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (player) => {
    if (!confirm(`ต้องการลบผู้เล่น "${player.name}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      const response = await playersAPI.delete(player._id);
      if (response.success) {
        toast.success('ลบผู้เล่นสำเร็จ');
        fetchPlayers();
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบผู้เล่น');
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format phone number
  const formatPhone = (phone) => {
    if (!phone || phone.length !== 10) return phone;
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ข้อมูลลูกค้า</h1>
              <p className="text-sm text-gray-500">
                ทั้งหมด {processedPlayers.length} คน
                {searchTerm && ` (กรองจาก ${players.length} คน)`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchPlayers}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
            <button
              onClick={handleOpenCreateForm}
              className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              เพิ่มผู้เล่นใหม่
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหา</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อหรือเบอร์โทร..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ระดับมือ</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทั้งหมด</option>
              {levels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">ทั้งหมด</option>
              <option value="active">ใช้งาน</option>
              <option value="inactive">ระงับ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : processedPlayers.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {searchTerm ? 'ไม่พบผู้เล่นที่ค้นหา' : 'ยังไม่มีผู้เล่นในระบบ'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenCreateForm}
              className="mt-4 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              เพิ่มผู้เล่นคนแรก
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors group"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        ผู้เล่น
                        <ArrowUpDown className={`w-4 h-4 ${sortField === 'name' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors group"
                      onClick={() => handleSort('level')}
                    >
                      <div className="flex items-center gap-2">
                        ระดับมือ
                        <ArrowUpDown className={`w-4 h-4 ${sortField === 'level' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors group"
                      onClick={() => handleSort('gamesPlayed')}
                    >
                      <div className="flex items-center gap-2">
                        สถิติ
                        <ArrowUpDown className={`w-4 h-4 ${sortField === 'gamesPlayed' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors group"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        สถานะ
                        <ArrowUpDown className={`w-4 h-4 ${sortField === 'status' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedPlayers.map((player, index) => (
                    <tr
                      key={player._id}
                      className={`hover:bg-blue-50 transition-all duration-150 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{player.name}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Phone className="w-3.5 h-3.5" />
                            {formatPhone(player.phone)}
                          </div>
                          {player.stats?.lastPlayed && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Calendar className="w-3.5 h-3.5" />
                              เล่นล่าสุด: {formatDate(player.stats.lastPlayed)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {player.level ? (
                          <PlayerLevelBadge level={player.level} size="sm" />
                        ) : (
                          <span className="text-sm text-gray-400">ไม่ระบุ</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <PlayerStatsCard stats={player.stats} compact={true} />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            player.status === 'active'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {player.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditForm(player)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(player)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  แสดง <span className="font-semibold">{startIndex + 1}</span> ถึง{' '}
                  <span className="font-semibold">{Math.min(endIndex, processedPlayers.length)}</span> จาก{' '}
                  <span className="font-semibold">{processedPlayers.length}</span> รายการ
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm">ก่อนหน้า</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg border font-medium text-sm transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm">ถัดไป</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Player Form Modal */}
      {showForm && (
        <PlayerForm
          player={selectedPlayer}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          isLoading={formLoading}
        />
      )}
    </div>
  );
}
