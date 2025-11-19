import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  Play,
  UserPlus,
  LogOut,
  Calendar,
  Plus,
  RefreshCw
} from 'lucide-react';
import { groupPlayAPI, courtsAPI } from '../../lib/api';
import { ROUTES } from '../../constants';
import CreateSessionModal from '../../components/groupplay/CreateSessionModal';
import PlayerCheckInModal from '../../components/groupplay/PlayerCheckInModal';
import StartGameModal from '../../components/groupplay/StartGameModal';
import FinishGameModal from '../../components/groupplay/FinishGameModal';
import CheckOutModal from '../../components/groupplay/CheckOutModal';

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
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showStartGameModal, setShowStartGameModal] = useState(false);
  const [showFinishGameModal, setShowFinishGameModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, courtsRes] = await Promise.all([
        groupPlayAPI.getAll(), // Remove isActive filter to show all rules
        courtsAPI.getAll({ status: 'available' })
      ]);

      setRules(rulesRes.data || []);
      setCourts(courtsRes.data || []);

      // Auto-select first rule if available
      if (rulesRes.data && rulesRes.data.length > 0) {
        setSelectedRule(rulesRes.data[0]);
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

  const handleCheckOut = () => {
    if (!selectedRule) {
      toast.error('กรุณาเลือกกฎก๊วนสนามก่อน');
      return;
    }
    setShowCheckOutModal(true);
  };

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

  const checkedInPlayers = selectedRule?.players?.filter(p => p.checkedIn && !p.checkedOut) || [];

  // Collect all playing games from all players
  const allGames = selectedRule?.players?.flatMap(p =>
    (p.games?.filter(g => g.status === 'playing') || []).map(g => ({
      ...g,
      playerId: p._id,  // Add player reference for API calls
    }))
  ) || [];

  // Deduplicate games by gameNumber (each game is stored per player, so we need to show it only once)
  const currentGames = Array.from(
    new Map(allGames.map(game => [game.gameNumber, game])).values()
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Users className="text-primary-blue" size={28} />
              ระบบตีก๊วน (Group Play)
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              จัดการกฎก๊วนสนาม ผู้เล่น เกม และการชำระเงิน
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-white border border-slate-300 text-text-primary rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} />
              รีเฟรช
            </button>
            <button
              onClick={handleCreateRule}
              className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              สร้างกฎก๊วนใหม่
            </button>
          </div>
        </div>
      </div>

      {/* Rule Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-text-primary">
            เลือกกฎก๊วนสนาม
          </label>
          {selectedRule && (
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
          )}
        </div>
        {rules.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <Calendar size={48} className="mx-auto mb-3 opacity-50" />
            <p>ยังไม่มีกฎก๊วนสนาม</p>
            <button
              onClick={handleCreateRule}
              className="mt-3 text-primary-blue hover:underline"
            >
              สร้างกฎก๊วนใหม่
            </button>
          </div>
        ) : (
          <select
            value={selectedRule?._id || ''}
            onChange={(e) => {
              const rule = rules.find(r => r._id === e.target.value);
              setSelectedRule(rule);
            }}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            {rules.map(rule => {
              const courtNames = rule.courts?.map(c => c.name || c.courtNumber).join(', ') || 'ไม่ระบุสนาม';
              const daysText = rule.daysOfWeek?.map(d => DAYS_LABELS[d]).join(', ') || 'ไม่ระบุวัน';
              return (
                <option key={rule._id} value={rule._id}>
                  {rule.sessionName} - {courtNames} ({daysText} {rule.startTime}-{rule.endTime})
                </option>
              );
            })}
          </select>
        )}
      </div>

      {selectedRule && (
        <>
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <button
              onClick={() => {
                if (currentGames.length > 0) {
                  // Select first playing game
                  const game = currentGames[0];
                  setSelectedGameId({ playerId: game.playerId, gameNumber: game.gameNumber });
                  setShowFinishGameModal(true);
                }
              }}
              disabled={currentGames.length === 0}
              className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar size={20} />
              จบเกม
            </button>
            <button
              onClick={handleCheckOut}
              disabled={checkedInPlayers.length === 0}
              className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut size={20} />
              Check-out
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
                <Calendar className="text-yellow-500" size={32} />
              </div>
            </div>
          </div>

          {/* Players List */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              รายชื่อผู้เล่น ({checkedInPlayers.length} คน)
            </h2>
            {checkedInPlayers.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <Users size={48} className="mx-auto mb-3 opacity-50" />
                <p>ยังไม่มีผู้เล่น check-in</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checkedInPlayers.map((player, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-text-primary">{player.name}</p>
                        <p className="text-sm text-text-secondary">{player.phone}</p>
                      </div>
                      {player.level && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {player.levelName || `Level ${player.level}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-slate-200">
                      <span className="text-text-secondary">เกม:</span>
                      <span className="font-medium">{player.games?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-text-secondary">ค่าใช้จ่าย:</span>
                      <span className="font-medium text-green-600">฿{player.totalCost || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-text-secondary">สถานะ:</span>
                      <span className={`font-medium ${player.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                        {player.paymentStatus === 'paid' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-text-primary">
                          เกมที่ {game.gameNumber}
                        </span>
                        {game.court && (
                          <span className="ml-2 text-sm text-blue-600">
                            • {game.court.name || `สนาม ${game.court.courtNumber}`}
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                        กำลังเล่น
                      </span>
                    </div>
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

      {showCheckOutModal && (
        <CheckOutModal
          session={selectedRule}
          onClose={() => setShowCheckOutModal(false)}
          onSuccess={async (sessionId, playerPhone) => {
            await groupPlayAPI.checkOut(sessionId, playerPhone);
            await refreshRule();
          }}
        />
      )}
    </div>
  );
}
