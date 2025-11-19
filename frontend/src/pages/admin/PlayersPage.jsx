import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Users, Plus, Search, RefreshCw, Trash2, Edit2, Phone, Calendar } from 'lucide-react';
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

  // Filter players using useMemo for better performance and reliability
  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) {
      return players;
    }

    const searchLower = searchTerm.toLowerCase();
    const searchNumbers = searchTerm.replace(/\D/g, '');

    return players.filter((player) => {
      const nameMatch = player.name.toLowerCase().includes(searchLower);
      const phoneMatch = searchNumbers && player.phone.includes(searchNumbers);
      return nameMatch || phoneMatch;
    });
  }, [searchTerm, players]);

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
                ทั้งหมด {filteredPlayers.length} คน
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
      ) : filteredPlayers.length === 0 ? (
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้เล่น
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ระดับมือ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถิติ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPlayers.map((player) => (
                  <tr key={player._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{player.name}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Phone className="w-3 h-3" />
                          {formatPhone(player.phone)}
                        </div>
                        {player.stats?.lastPlayed && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <Calendar className="w-3 h-3" />
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
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          player.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {player.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditForm(player)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(player)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
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
