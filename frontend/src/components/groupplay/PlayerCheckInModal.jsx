import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { playersAPI } from '../../lib/api';
import { getAllLevels } from '../../constants/playerLevels';

export default function PlayerCheckInModal({ sessionId, onClose, onSuccess }) {
  const [searchMode, setSearchMode] = useState('database'); // 'database' or 'walkin'
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(false);

  // Walk-in form
  const [walkinData, setWalkinData] = useState({
    name: '',
    phone: '',
    level: '',
  });

  const levels = getAllLevels();

  useEffect(() => {
    if (searchMode === 'database' && searchTerm.length >= 2) {
      searchPlayers();
    }
  }, [searchTerm, searchMode]);

  const searchPlayers = async () => {
    try {
      const response = await playersAPI.getAll({ search: searchTerm });
      setPlayers(response.data || []);
    } catch (error) {
      console.error('Error searching players:', error);
    }
  };

  const handleCheckIn = async () => {
    let checkInData;

    if (searchMode === 'database') {
      if (!selectedPlayer) {
        toast.error('กรุณาเลือกผู้เล่น');
        return;
      }
      checkInData = {
        playerId: selectedPlayer._id,
        name: selectedPlayer.name,
        phone: selectedPlayer.phone,
        level: selectedPlayer.level,
      };
    } else {
      if (!walkinData.name || !walkinData.phone) {
        toast.error('กรุณากรอกชื่อและเบอร์โทร');
        return;
      }
      checkInData = walkinData;
    }

    setLoading(true);
    try {
      await onSuccess(sessionId, checkInData);
      toast.success('Check-in สำเร็จ!');
      onClose();
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการ check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-text-primary">Check-in ผู้เล่น</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Mode Selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSearchMode('database')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                searchMode === 'database'
                  ? 'bg-primary-blue text-white'
                  : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
              }`}
            >
              จาก Database
            </button>
            <button
              onClick={() => setSearchMode('walkin')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                searchMode === 'walkin'
                  ? 'bg-primary-blue text-white'
                  : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
              }`}
            >
              Walk-in
            </button>
          </div>

          {/* Database Search Mode */}
          {searchMode === 'database' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  ค้นหาผู้เล่น (ชื่อ หรือ เบอร์โทร)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    placeholder="พิมพ์เพื่อค้นหา..."
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchTerm.length >= 2 && (
                <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                  {players.length === 0 ? (
                    <div className="p-4 text-center text-text-secondary">
                      ไม่พบผู้เล่น
                    </div>
                  ) : (
                    players.map(player => (
                      <button
                        key={player._id}
                        onClick={() => setSelectedPlayer(player)}
                        className={`w-full p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                          selectedPlayer?._id === player._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-text-primary">{player.name}</p>
                            <p className="text-sm text-text-secondary">{player.phone}</p>
                          </div>
                          {player.level && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {levels.find(l => l.value === player.level)?.label || player.level}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Selected Player */}
              {selectedPlayer && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">ผู้เล่นที่เลือก:</p>
                  <p className="font-medium text-text-primary">{selectedPlayer.name}</p>
                  <p className="text-sm text-text-secondary">{selectedPlayer.phone}</p>
                </div>
              )}
            </div>
          )}

          {/* Walk-in Mode */}
          {searchMode === 'walkin' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  ชื่อ *
                </label>
                <input
                  type="text"
                  value={walkinData.name}
                  onChange={(e) => setWalkinData({ ...walkinData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="กรอกชื่อผู้เล่น"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  เบอร์โทร *
                </label>
                <input
                  type="tel"
                  value={walkinData.phone}
                  onChange={(e) => setWalkinData({ ...walkinData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="0812345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  ระดับมือ (ไม่บังคับ)
                </label>
                <select
                  value={walkinData.level}
                  onChange={(e) => setWalkinData({ ...walkinData, level: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value="">ไม่ระบุ</option>
                  {levels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-text-primary rounded-lg hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCheckIn}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || (searchMode === 'database' && !selectedPlayer)}
            >
              {loading ? 'กำลัง Check-in...' : 'Check-in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
