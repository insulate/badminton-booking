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
import { groupPlayAPI, courtsAPI, salesAPI } from '../../lib/api';
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

  // POS pending sales
  const [pendingSales, setPendingSales] = useState([]);

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

  const fetchPendingSales = async () => {
    try {
      const res = await salesAPI.getAll({ paymentStatus: 'pending' });
      setPendingSales(res.data || []);
    } catch (error) {
      console.error('Error fetching pending sales:', error);
    }
  };

  const getPlayerSales = (player) => {
    if (!player || !pendingSales.length) return [];
    return pendingSales.filter(sale => {
      if (player.phone && sale.customer?.phone && sale.customer.phone === player.phone) return true;
      if (sale.customer?.name && sale.customer.name === player.name) return true;
      return false;
    });
  };

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

      // Fetch pending sales from POS
      fetchPendingSales();
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
      fetchPendingSales();

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

  const confirmCheckout = async ({ paymentMethod, receivedAmount, posSaleIds } = {}) => {
    if (!selectedRule || !selectedPlayerForCheckout) {
      return;
    }

    try {
      // 1. Check out player in GroupPlay
      await groupPlayAPI.checkOut(selectedRule._id, selectedPlayerForCheckout._id);

      // 2. Settle POS pending sales if any
      if (posSaleIds && posSaleIds.length > 0 && paymentMethod) {
        try {
          // Send POS total as receivedAmount (not the full checkout amount)
          // so backend calculates change correctly for POS portion only
          const posSalesTotal = posSaleIds.reduce((sum, id) => {
            const sale = pendingSales.find(s => s._id === id);
            return sum + (sale?.total || 0);
          }, 0);
          await salesAPI.settle({
            mode: 'individual',
            saleIds: posSaleIds,
            paymentMethod,
            receivedAmount: paymentMethod === 'cash' ? posSalesTotal : undefined,
          });
        } catch (posError) {
          console.error('Error settling POS sales:', posError);
          toast.error('Check Out สำเร็จ แต่ปิดบิล POS ไม่สำเร็จ');
          await refreshRule();
          await fetchPendingSales();
          return;
        }
      }

      toast.success('Check Out สำเร็จ');
      await refreshRule();
      await fetchPendingSales();
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

  // Deduplicate games by gameNumber + court combination
  const gamesMap = new Map();
  allGames.forEach(game => {
    const courtId = typeof game.court === 'object' ? game.court?._id : game.court;
    const gameKey = `${game.gameNumber}_${courtId || 'unknown'}`;

    if (!gamesMap.has(gameKey)) {
      gamesMap.set(gameKey, {
        ...game,
        players: []
      });
    }
    const gameData = gamesMap.get(gameKey);

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
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl text-3xl">
              🏸
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ระบบตีก๊วน (Group Play)</h1>
              <p className="text-emerald-100 text-sm mt-1">จัดการกฎก๊วนสนาม ผู้เล่น เกม และการชำระเงิน</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30"
          >
            <RefreshCw size={18} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Rule Display */}
      <div className="bg-white rounded-xl shadow-sm border border-emerald-200 border-l-4 border-l-emerald-500 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">🏸 กฎก๊วนสนาม</h2>
          {selectedRule && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleActive}
                className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
                  selectedRule.isActive
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {selectedRule.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
              </button>
              <button
                onClick={handleEditRule}
                className="px-3 py-1 text-sm bg-teal-100 text-teal-700 hover:bg-teal-200 rounded-lg transition-colors flex items-center gap-1 font-medium"
              >
                <Edit size={14} />
                แก้ไขกฎก๊วน
              </button>
            </div>
          )}
        </div>

        {!selectedRule ? (
          <div className="text-center py-8 text-text-secondary">
            <div className="text-5xl mb-3">🏸</div>
            <p className="mb-2 font-medium">ยังไม่มีกฎก๊วนสนาม</p>
            <p className="text-sm mb-4">สร้างกฎก๊วนเพื่อเริ่มต้นเล่นกันเลย!</p>
            <button
              onClick={handleCreateRule}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all inline-flex items-center gap-2 shadow-md"
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
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedRule.isActive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedRule.isActive ? '🟢 เปิดใช้งาน' : 'ปิดใช้งาน'}
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
              className="px-4 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg font-semibold text-lg"
            >
              <UserPlus size={22} />
              Check-in ผู้เล่น
            </button>
            <button
              onClick={handleStartGame}
              disabled={checkedInPlayers.length < 2}
              className="px-4 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Play size={22} />
              เริ่มเกม
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-5 relative overflow-hidden">
              <Users className="absolute -right-2 -bottom-2 text-white/10" size={72} />
              <div className="relative">
                <p className="text-sm text-emerald-100">ผู้เล่นทั้งหมด</p>
                <p className="text-3xl font-black text-white mt-1">
                  {checkedInPlayers.length}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg p-5 relative overflow-hidden">
              <Play className="absolute -right-2 -bottom-2 text-white/10" size={72} />
              <div className="relative">
                <p className="text-sm text-orange-100">เกมที่กำลังเล่น</p>
                <p className="text-3xl font-black text-white mt-1">
                  {currentGames.length}
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg p-5 relative overflow-hidden">
              <Users className="absolute -right-2 -bottom-2 text-white/10" size={72} />
              <div className="relative">
                <p className="text-sm text-cyan-100">ค่าเข้าร่วม</p>
                <p className="text-3xl font-black text-white mt-1">
                  ฿{selectedRule.entryFee || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Players List */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
                👥 รายชื่อผู้เล่น ({processedPlayers.length} คน)
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
                    className="w-full pl-10 pr-3 py-2 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {checkedInPlayers.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <div className="text-5xl mb-3">🏸</div>
                <p className="font-medium">ยังไม่มีผู้เล่น check-in</p>
                <p className="text-sm mt-1">กด Check-in เพื่อเพิ่มผู้เล่นเข้าก๊วน!</p>
              </div>
            ) : processedPlayers.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <Search size={48} className="mx-auto mb-3 opacity-50" />
                <p>ไม่พบผู้เล่นที่ค้นหา</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
                        <tr>
                          <th
                            className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors group"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center gap-2">
                              ผู้เล่น
                              <ArrowUpDown className={`w-4 h-4 ${sortField === 'name' ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-500'}`} />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors group"
                            onClick={() => handleSort('level')}
                          >
                            <div className="flex items-center gap-2">
                              ระดับ
                              <ArrowUpDown className={`w-4 h-4 ${sortField === 'level' ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-500'}`} />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors group"
                            onClick={() => handleSort('status')}
                          >
                            <div className="flex items-center gap-2">
                              สถานะ
                              <ArrowUpDown className={`w-4 h-4 ${sortField === 'status' ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-500'}`} />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors group"
                            onClick={() => handleSort('games')}
                          >
                            <div className="flex items-center justify-center gap-2">
                              เกม
                              <ArrowUpDown className={`w-4 h-4 ${sortField === 'games' ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-500'}`} />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-right text-xs font-semibold text-emerald-800 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors group"
                            onClick={() => handleSort('totalCost')}
                          >
                            <div className="flex items-center justify-end gap-2">
                              ค่าใช้จ่าย
                              <ArrowUpDown className={`w-4 h-4 ${sortField === 'totalCost' ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-500'}`} />
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors group"
                            onClick={() => handleSort('paymentStatus')}
                          >
                            <div className="flex items-center justify-center gap-2">
                              การชำระ
                              <ArrowUpDown className={`w-4 h-4 ${sortField === 'paymentStatus' ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-500'}`} />
                            </div>
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">
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
                              className={`transition-all duration-150 hover:bg-emerald-50/50 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'
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
                                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
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
                                    <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                                    <span className="text-sm font-medium text-teal-600">
                                      ว่าง
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-semibold text-gray-900">{player.games?.length || 0}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {(() => {
                                  const playerSales = getPlayerSales(player);
                                  const posSalesTotal = playerSales.reduce((sum, s) => sum + (s.total || 0), 0);
                                  return (
                                    <>
                                      <div className="font-semibold text-emerald-600">฿{(player.totalCost || 0) + posSalesTotal}</div>
                                      {posSalesTotal > 0 && (
                                        <div className="text-xs text-orange-600 mt-1">
                                          รวมสินค้า POS ฿{posSalesTotal}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                    player.paymentStatus === 'paid'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
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
                                    className="tooltip inline-flex items-center justify-center p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                                    data-tooltip="ดูรายละเอียด"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedPlayerForProduct(player);
                                      setShowAddProductModal(true);
                                    }}
                                    className="tooltip inline-flex items-center justify-center p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
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
                                            : 'bg-orange-500 text-white hover:bg-orange-600'
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
                                      ? 'bg-emerald-600 text-white border-emerald-600'
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
            <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6">
              <h2 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                🏸 เกมที่กำลังเล่น ({currentGames.length})
              </h2>
              <div className="space-y-4">
                {currentGames.map((game, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <span className="font-semibold text-emerald-800">
                          🏟️ {game.court?.name || `สนาม ${game.court?.courtNumber || game.gameNumber}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs rounded-full font-medium animate-pulse">
                          กำลังเล่น
                        </span>
                        <button
                          onClick={() => {
                            setSelectedGameForEdit(game);
                            setShowEditPlayersModal(true);
                          }}
                          className="px-3 py-1 bg-teal-500 text-white text-xs rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-1 font-medium"
                        >
                          <Edit size={14} />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGameId({ playerId: game.playerId, gameNumber: game.gameNumber });
                            setShowFinishGameModal(true);
                          }}
                          className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1 font-medium"
                        >
                          <CheckCircle size={14} />
                          จบเกม
                        </button>
                      </div>
                    </div>

                    {/* Players List */}
                    {game.players && game.players.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-emerald-700 mb-1 font-medium">ผู้เล่น:</p>
                        <div className="flex flex-wrap gap-2">
                          {game.players.map((player, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white border border-emerald-200 rounded-full text-xs text-text-primary shadow-sm"
                            >
                              {player.name}
                              {player.levelName && (
                                <span className="ml-1 text-amber-600 font-medium">
                                  ({player.levelName})
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-emerald-600">
                      ⏱️ เริ่มเมื่อ: {new Date(game.startTime).toLocaleTimeString('th-TH')}
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
          posSales={getPlayerSales(selectedPlayer)}
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
          posSales={getPlayerSales(selectedPlayerForCheckout)}
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
