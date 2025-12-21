import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  Play,
  UserPlus,
  Plus,
  RefreshCw,
  CheckCircle,
  Edit,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  ShoppingCart,
  Receipt
} from 'lucide-react';
import { groupPlayAPI, courtsAPI } from '../../lib/api';
import { ROUTES } from '../../constants';
import CreateSessionModal from '../../components/groupplay/CreateSessionModal';
import PlayerCheckInModal from '../../components/groupplay/PlayerCheckInModal';
import StartGameModal from '../../components/groupplay/StartGameModal';
import FinishGameModal from '../../components/groupplay/FinishGameModal';
import EditGamePlayersModal from '../../components/groupplay/EditGamePlayersModal';
import PlayerCostDetailModal from '../../components/groupplay/PlayerCostDetailModal';
import AddProductCostModal from '../../components/groupplay/AddProductCostModal';
import CheckoutConfirmModal from '../../components/groupplay/CheckoutConfirmModal';
import { PageContainer, PageHeader } from '../../components/common';

const DAYS_LABELS = {
  monday: 'จันทร์',
  tuesday: 'อังคาร',
  wednesday: 'พุธ',
  thursday: 'พฤหัสบดี',
  friday: 'ศุกร์',
  saturday: 'เสาร์',
  sunday: 'อาทิตย์',
};

export default function GroupPlayPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [selectedRule, setSelectedRule] = useState(null);
  const [courts, setCourts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showStartGameModal, setShowStartGameModal] = useState(false);
  const [showFinishGameModal, setShowFinishGameModal] = useState(false);
  const [showEditPlayersModal, setShowEditPlayersModal] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [selectedGameForEdit, setSelectedGameForEdit] = useState(null);
  const [showPlayerCostModal, setShowPlayerCostModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedPlayerForProduct, setSelectedPlayerForProduct] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlayerForCheckout, setSelectedPlayerForCheckout] = useState(null);

  // Players table state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, courtsRes] = await Promise.all([
        groupPlayAPI.getAll(),
        courtsAPI.getAll({ status: 'available' })
      ]);

      const allRules = rulesRes.data || [];
      setRules(allRules);
      setCourts(courtsRes.data || []);

      // Since we only support one rule, select the first one (or null if none exists)
      if (allRules.length > 0) {
        setSelectedRule(allRules[0]);
      } else {
        setSelectedRule(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const refreshRule = async () => {
    if (!selectedRule) return;

    try {
      const response = await groupPlayAPI.getById(selectedRule._id);
      const session = response.data.session;
      setSelectedRule(session);

      // Update in rules list
      setRules(prev =>
        prev.map(r => r._id === session._id ? session : r)
      );
    } catch (error) {
      console.error('Error refreshing rule:', error);
      toast.error('เกิดข้อผิดพลาดในการรีเฟรชข้อมูล');
    }
  };

  const handleToggleActive = async () => {
    if (!selectedRule) return;

    try {
      const newStatus = !selectedRule.isActive;
      await groupPlayAPI.update(selectedRule._id, { isActive: newStatus });
      toast.success(newStatus ? 'เปิดกฎก๊วนสนามแล้ว' : 'ปิดกฎก๊วนสนามแล้ว');
      await fetchData();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const handleCreateRule = () => {
    setShowCreateModal(true);
  };

  const handleEditRule = () => {
    if (!selectedRule) {
      toast.error('ไม่มีกฎก๊วนให้แก้ไข');
      return;
    }
    setShowEditModal(true);
  };

  const handleCheckIn = () => {
    if (!selectedRule) {
      toast.error('กรุณาเลือกกฎก๊วนสนามก่อน');
      return;
    }
    setShowCheckInModal(true);
  };

  const handleStartGame = () => {
    if (!selectedRule) {
      toast.error('กรุณาเลือกกฎก๊วนสนามก่อน');
      return;
    }

    const checkedInPlayers = selectedRule.players?.filter(p => p.checkedIn && !p.checkedOut) || [];
    if (checkedInPlayers.length < 2) {
      toast.error('ต้องมีผู้เล่นที่ check-in แล้วอย่างน้อย 2 คน');
      return;
    }

    setShowStartGameModal(true);
  };

  const handleCheckout = (player) => {
    if (!selectedRule) {
      toast.error('กรุณาเลือกกฎก๊วนสนามก่อน');
      return;
    }

    // Check if player has any playing games
    const hasPlayingGames = player.games?.some(g => g.status === 'playing');
    if (hasPlayingGames) {
      toast.error('ผู้เล่นกำลังอยู่ในเกม กรุณาจบเกมก่อน Check Out');
      return;
    }

    setSelectedPlayerForCheckout(player);
    setShowCheckoutModal(true);
  };

  const confirmCheckout = async () => {
    if (!selectedRule || !selectedPlayerForCheckout) {
      return;
    }

    try {
      await groupPlayAPI.checkOut(selectedRule._id, selectedPlayerForCheckout._id);
      toast.success('Check Out สำเร็จ');
      await refreshRule();
    } catch (error) {
      console.error('Error checking out player:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการ Check Out');
    }
  };

  // Calculate derived state before early return (to satisfy Rules of Hooks)
  const checkedInPlayers = selectedRule?.players?.filter(p => p.checkedIn && !p.checkedOut) || [];

  // Collect all playing games from all players
  const allGames = selectedRule?.players?.flatMap(p =>
    (p.games?.filter(g => g.status === 'playing') || []).map(g => ({
      ...g,
      playerId: p._id,  // Add player reference for API calls
      playerInfo: p.player,  // Add player info (name, phone, etc.)
    }))
  ) || [];

  // Deduplicate games by gameNumber and collect all players in each game
  const gamesMap = new Map();
  allGames.forEach(game => {
    if (!gamesMap.has(game.gameNumber)) {
      gamesMap.set(game.gameNumber, {
        ...game,
        players: []
      });
    }
    const gameData = gamesMap.get(game.gameNumber);

    // Update court info if current game has populated court data
    if (game.court && typeof game.court === 'object' && game.court.name) {
      gameData.court = game.court;
    }

    gameData.players.push({
      _id: game.playerId,
      name: game.playerInfo?.name || 'Unknown',
      phone: game.playerInfo?.phone,
      level: game.playerInfo?.level,
      levelName: game.playerInfo?.levelName
    });
  });

  const currentGames = Array.from(gamesMap.values());

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filter, sort and paginate players
  const processedPlayers = useMemo(() => {
    // Step 1: Filter
    let filtered = checkedInPlayers;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const searchNumbers = searchTerm.replace(/\D/g, '');

      filtered = checkedInPlayers.filter((player) => {
        const nameMatch = player.name?.toLowerCase().includes(searchLower);
        const phoneMatch = searchNumbers && player.phone?.includes(searchNumbers);
        return nameMatch || phoneMatch;
      });
    }

    // Step 2: Sort
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'level':
          const levelOrder = { 'C': 0, 'B-': 1, 'B': 2, 'B+': 3, 'A-': 4, 'A': 5, 'A+': 6, 'S': 7 };
          aValue = levelOrder[a.level] ?? -1;
          bValue = levelOrder[b.level] ?? -1;
          break;
        case 'games':
          aValue = a.games?.length || 0;
          bValue = b.games?.length || 0;
          break;
        case 'totalCost':
          aValue = a.totalCost || 0;
          bValue = b.totalCost || 0;
          break;
        case 'paymentStatus':
          aValue = a.paymentStatus === 'paid' ? 1 : 0;
          bValue = b.paymentStatus === 'paid' ? 1 : 0;
          break;
        case 'status':
          const playingGameA = a.games?.find(g => g.status === 'playing');
          const playingGameB = b.games?.find(g => g.status === 'playing');
          aValue = playingGameA ? 1 : 0;
          bValue = playingGameB ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [searchTerm, checkedInPlayers, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(processedPlayers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlayers = processedPlayers.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer variant="full"><div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="ระบบตีก๊วน (Group Play)"
        subtitle="จัดการกฎก๊วนสนาม ผู้เล่น เกม และการชำระเงิน"
        icon={Users}
        iconColor="blue"
        actions={
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white border border-slate-300 text-text-primary rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={18} />
            รีเฟรช
          </button>
        }
      />

      {/* Rule Display */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">กฎก๊วนสนาม</h2>
          {selectedRule && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleActive}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  selectedRule.isActive
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {selectedRule.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
              </button>
              <button
                onClick={handleEditRule}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Edit size={14} />
                แก้ไขกฎก๊วน
              </button>
            </div>
          )}
        </div>

        {!selectedRule ? (
          <div className="text-center py-8 text-text-secondary">
            <Users size={48} className="mx-auto mb-3 opacity-50" />
            <p className="mb-2">ยังไม่มีกฎก๊วนสนาม</p>
            <p className="text-sm mb-4">สร้างกฎก๊วนเพื่อเริ่มต้นใช้งานระบบตีก๊วน</p>
            <button
              onClick={handleCreateRule}
              className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus size={18} />
              สร้างกฎก๊วนใหม่
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-text-secondary">ชื่อ Session</label>
              <p className="text-sm font-medium text-text-primary mt-1">{selectedRule.sessionName}</p>
            </div>
            <div>
              <label className="text-xs text-text-secondary">สนาม</label>
              <p className="text-sm font-medium text-text-primary mt-1">
                {selectedRule.courts?.map(c => c.name || c.courtNumber).join(', ') || '-'}
              </p>
            </div>
            <div>
              <label className="text-xs text-text-secondary">วัน</label>
              <p className="text-sm font-medium text-text-primary mt-1">
                {selectedRule.daysOfWeek?.map(d => DAYS_LABELS[d]).join(', ') || '-'}
              </p>
            </div>
            <div>
              <label className="text-xs text-text-secondary">เวลา</label>
              <p className="text-sm font-medium text-text-primary mt-1">
                {selectedRule.startTime} - {selectedRule.endTime}
              </p>
            </div>
            <div>
              <label className="text-xs text-text-secondary">ค่าเข้าร่วม</label>
              <p className="text-sm font-medium text-text-primary mt-1">
                ฿{selectedRule.entryFee}
              </p>
            </div>
            <div>
              <label className="text-xs text-text-secondary">สถานะ</label>
              <p className="text-sm font-medium mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                  selectedRule.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedRule.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedRule && (
        <>
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleCheckIn}
              className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus size={20} />
              Check-in ผู้เล่น
            </button>
            <button
              onClick={handleStartGame}
              disabled={checkedInPlayers.length < 2}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={20} />
              เริ่มเกม
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">ผู้เล่นทั้งหมด</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {checkedInPlayers.length}
                  </p>
                </div>
                <Users className="text-primary-blue" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">เกมที่กำลังเล่น</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    {currentGames.length}
                  </p>
                </div>
                <Play className="text-green-500" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">ค่าเข้าร่วม</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">
                    ฿{selectedRule.entryFee || 0}
                  </p>
                </div>
                <Users className="text-yellow-500" size={32} />
              </div>
            </div>
          </div>

          {/* Players List */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                รายชื่อผู้เล่น ({processedPlayers.length} คน)
              </h2>
            </div>

            {/* Search Bar */}
            {checkedInPlayers.length > 0 && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาชื่อหรือเบอร์โทร..."
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {checkedInPlayers.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p>ยังไม่มีผู้เล่น check-in</p>
              </div>
            ) : processedPlayers.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p>ไม่พบผู้เล่นที่ค้นหา</p>
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
                              ระดับ
                              <ArrowUpDown className={`w-4 h-4 ${sortField === 'level' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
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
                          <th
                            className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors group"
                            onClick={() => handleSort('games')}
                          >
                            <div className="flex items-center justify-center gap-2">
                              เกม
                              <ArrowUpDown className={`w-4 h-4 ${sortField === 'games' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors group"
                            onClick={() => handleSort('totalCost')}
                          >
                            <div className="flex items-center justify-end gap-2">
                              ค่าใช้จ่าย
                              <ArrowUpDown className={`w-4 h-4 ${sortField === 'totalCost' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors group"
                            onClick={() => handleSort('paymentStatus')}
                          >
                            <div className="flex items-center justify-center gap-2">
                              การชำระ
                              <ArrowUpDown className={`w-4 h-4 ${sortField === 'paymentStatus' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            </div>
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            จัดการ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedPlayers.map((player, index) => {
                          const playingGame = player.games?.find(g => g.status === 'playing');
                          return (
                            <tr
                              key={index}
                              className={`transition-all duration-150 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <div className="font-semibold text-gray-900">{player.name}</div>
                                  <div className="text-sm text-gray-600 mt-1">{player.phone}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {player.level ? (
                                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                                    {player.levelName || `Level ${player.level}`}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400">ไม่ระบุ</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {playingGame ? (
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-sm font-medium text-green-600">
                                      กำลังเล่น
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                                    <span className="text-sm font-medium text-slate-500">
                                      ว่าง
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-semibold text-gray-900">{player.games?.length || 0}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="font-semibold text-green-600">฿{player.totalCost || 0}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                    player.paymentStatus === 'paid'
                                      ? 'bg-green-100 text-green-800 border border-green-200'
                                      : 'bg-red-100 text-red-800 border border-red-200'
                                  }`}
                                >
                                  {player.paymentStatus === 'paid' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedPlayer(player);
                                      setShowPlayerCostModal(true);
                                    }}
                                    className="tooltip inline-flex items-center justify-center p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    data-tooltip="ดูรายละเอียด"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedPlayerForProduct(player);
                                      setShowAddProductModal(true);
                                    }}
                                    className="tooltip inline-flex items-center justify-center p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                    data-tooltip="เพิ่มสินค้า"
                                  >
                                    <ShoppingCart size={16} />
                                  </button>
                                  {(() => {
                                    const hasPlayingGames = player.games?.some(g => g.status === 'playing');
                                    const isDisabled = player.checkedOut || hasPlayingGames;
                                    const tooltipText = player.checkedOut
                                      ? 'Check Out แล้ว'
                                      : hasPlayingGames
                                        ? 'กำลังอยู่ในเกม'
                                        : 'Check Out คิดเงิน';

                                    return (
                                      <button
                                        onClick={() => handleCheckout(player)}
                                        disabled={isDisabled}
                                        className={`tooltip inline-flex items-center justify-center p-2 rounded-lg transition-colors ${
                                          isDisabled
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-purple-500 text-white hover:bg-purple-600'
                                        }`}
                                        data-tooltip={tooltipText}
                                      >
                                        <Receipt size={16} />
                                      </button>
                                    );
                                  })()}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
          </div>

          {/* Current Games */}
          {currentGames.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                เกมที่กำลังเล่น ({currentGames.length})
              </h2>
              <div className="space-y-4">
                {currentGames.map((game, index) => (
                  <div
                    key={index}
                    className="border border-green-200 bg-green-50 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <span className="font-medium text-text-primary">
                          {game.court?.name || `สนาม ${game.court?.courtNumber || game.gameNumber}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          กำลังเล่น
                        </span>
                        <button
                          onClick={() => {
                            setSelectedGameForEdit(game);
                            setShowEditPlayersModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                        >
                          <Edit size={14} />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGameId({ playerId: game.playerId, gameNumber: game.gameNumber });
                            setShowFinishGameModal(true);
                          }}
                          className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle size={14} />
                          จบเกม
                        </button>
                      </div>
                    </div>

                    {/* Players List */}
                    {game.players && game.players.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-text-secondary mb-1">ผู้เล่น:</p>
                        <div className="flex flex-wrap gap-2">
                          {game.players.map((player, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white border border-green-200 rounded-full text-xs text-text-primary"
                            >
                              {player.name}
                              {player.levelName && (
                                <span className="ml-1 text-blue-600">
                                  ({player.levelName})
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-text-secondary">
                      เริ่มเมื่อ: {new Date(game.startTime).toLocaleTimeString('th-TH')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateSessionModal
          courts={courts}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async (data) => {
            await groupPlayAPI.create(data);
            await fetchData();
          }}
        />
      )}

      {showEditModal && selectedRule && (
        <CreateSessionModal
          courts={courts}
          rule={selectedRule}
          onClose={() => setShowEditModal(false)}
          onSuccess={async (data) => {
            await groupPlayAPI.update(selectedRule._id, data);
            await fetchData();
          }}
        />
      )}

      {showCheckInModal && (
        <PlayerCheckInModal
          sessionId={selectedRule._id}
          onClose={() => setShowCheckInModal(false)}
          onSuccess={async (sessionId, playerData) => {
            await groupPlayAPI.checkIn(sessionId, playerData);
            await refreshRule();
          }}
        />
      )}

      {showStartGameModal && (
        <StartGameModal
          session={selectedRule}
          onClose={() => setShowStartGameModal(false)}
          onSuccess={async (sessionId, gameData) => {
            await groupPlayAPI.startGame(sessionId, gameData);
            await refreshRule();
          }}
        />
      )}

      {showFinishGameModal && selectedGameId && (
        <FinishGameModal
          session={selectedRule}
          gameId={selectedGameId}
          onClose={() => {
            setShowFinishGameModal(false);
            setSelectedGameId(null);
          }}
          onSuccess={async (sessionId, gameId, gameData) => {
            await groupPlayAPI.finishGame(sessionId, gameId.playerId, gameId.gameNumber, gameData);
            await refreshRule();
          }}
        />
      )}

      {showEditPlayersModal && selectedGameForEdit && (
        <EditGamePlayersModal
          session={selectedRule}
          game={selectedGameForEdit}
          onClose={() => {
            setShowEditPlayersModal(false);
            setSelectedGameForEdit(null);
          }}
          onSuccess={async (sessionId, gameNumber, data) => {
            await groupPlayAPI.updateGamePlayers(sessionId, gameNumber, data);
            await refreshRule();
          }}
        />
      )}

      {showPlayerCostModal && selectedPlayer && (
        <PlayerCostDetailModal
          player={selectedPlayer}
          entryFee={selectedRule?.entryFee || 0}
          sessionPlayers={selectedRule?.players || []}
          onClose={() => {
            setShowPlayerCostModal(false);
            setSelectedPlayer(null);
          }}
        />
      )}

      {showAddProductModal && selectedPlayerForProduct && (
        <AddProductCostModal
          player={selectedPlayerForProduct}
          sessionId={selectedRule?._id}
          onClose={() => {
            setShowAddProductModal(false);
            setSelectedPlayerForProduct(null);
          }}
          onSuccess={async (sessionId, playerId, data) => {
            await groupPlayAPI.addPlayerProducts(sessionId, playerId, data);
            await refreshRule();
          }}
        />
      )}

      {showCheckoutModal && selectedPlayerForCheckout && (
        <CheckoutConfirmModal
          player={selectedPlayerForCheckout}
          onConfirm={confirmCheckout}
          onClose={() => {
            setShowCheckoutModal(false);
            setSelectedPlayerForCheckout(null);
          }}
        />
      )}
    </div></PageContainer>
  );
}
