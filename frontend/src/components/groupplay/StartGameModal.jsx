import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StartGameModal({ session, onClose, onSuccess }) {
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [loading, setLoading] = useState(false);

  const checkedInPlayers = session.players?.filter(p => p.checkedIn && !p.checkedOut) || [];
  const courts = session.courts || [];

  // Get courts that are currently in use
  const courtsInUse = new Set();
  session.players?.forEach(p => {
    p.games?.forEach(g => {
      if (g.status === 'playing' && g.court) {
        courtsInUse.add(g.court._id || g.court);
      }
    });
  });

  // Check if a court is available
  const isCourtAvailable = (courtId) => {
    return !courtsInUse.has(courtId);
  };

  // Check if a player is currently playing
  const isPlayerPlaying = (player) => {
    return player.games?.some(g => g.status === 'playing') || false;
  };

  const togglePlayer = (player) => {
    // Don't allow selecting players who are currently playing
    if (isPlayerPlaying(player)) {
      toast.error('ผู้เล่นนี้กำลังเล่นอยู่ในสนาม');
      return;
    }

    if (selectedPlayers.find(p => p.phone === player.phone)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.phone !== player.phone));
    } else {
      if (selectedPlayers.length >= 4) {
        toast.error('สามารถเลือกได้สูงสุด 4 คน');
        return;
      }
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleStartGame = async () => {
    if (selectedPlayers.length < 2) {
      toast.error('กรุณาเลือกผู้เล่นอย่างน้อย 2 คน');
      return;
    }

    if (!selectedCourt) {
      toast.error('กรุณาเลือกสนาม');
      return;
    }

    setLoading(true);
    try {
      const playerIds = selectedPlayers.map(p => p._id);
      await onSuccess(session._id, { playerIds, courtId: selectedCourt });
      toast.success('เริ่มเกมสำเร็จ!');
      onClose();
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเริ่มเกม');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">เริ่มเกมใหม่</h2>
            <p className="text-sm text-text-secondary mt-1">
              เลือกผู้เล่น 2-4 คน ({selectedPlayers.length}/4)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Court Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-3">
              เลือกสนาม <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {courts.map((court) => {
                const isSelected = selectedCourt === court._id;
                const isAvailable = isCourtAvailable(court._id);
                const courtLabel = court.name || `สนาม ${court.courtNumber}`;

                return (
                  <button
                    key={court._id}
                    type="button"
                    onClick={() => isAvailable && setSelectedCourt(court._id)}
                    disabled={!isAvailable}
                    className={`
                      px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all
                      ${isSelected && isAvailable
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : isAvailable
                        ? 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-text-primary'
                        : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{courtLabel}</div>
                      {!isAvailable && (
                        <div className="text-xs text-red-500 mt-1">สนามไม่ว่าง</div>
                      )}
                      {isSelected && isAvailable && (
                        <div className="text-xs text-blue-600 mt-1">✓ เลือกแล้ว</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player Selection */}
          {checkedInPlayers.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              ไม่มีผู้เล่นที่ check-in
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {checkedInPlayers
                .sort((a, b) => {
                  // Sort: available players first, then playing players
                  const aPlaying = isPlayerPlaying(a);
                  const bPlaying = isPlayerPlaying(b);
                  if (aPlaying === bPlaying) return 0;
                  return aPlaying ? 1 : -1;
                })
                .map((player, index) => {
                const isSelected = selectedPlayers.find(p => p.phone === player.phone);
                const isPlaying = isPlayerPlaying(player);
                return (
                  <button
                    key={index}
                    onClick={() => togglePlayer(player)}
                    disabled={isPlaying}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      isPlaying
                        ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'border-primary-blue bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text-primary">{player.name}</p>
                        <p className="text-sm text-text-secondary">{player.phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {player.level && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {player.levelName || `Level ${player.level}`}
                          </span>
                        )}
                        {isPlaying ? (
                          <span className="text-orange-600 text-xs font-medium">
                            🎾 กำลังเล่น
                          </span>
                        ) : isSelected ? (
                          <span className="text-primary-blue text-xs font-medium">
                            ✓ เลือกแล้ว
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Match Recommendation */}
          {selectedPlayers.length >= 2 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <p className="text-sm font-medium text-blue-900 mb-2">ผู้เล่นที่เลือก:</p>
              <div className="flex flex-wrap gap-2">
                {selectedPlayers.map((player, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm"
                  >
                    {player.name}
                    {player.level && (
                      <span className="ml-1 text-blue-600">
                        ({player.levelName || `L${player.level}`})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-text-primary rounded-lg hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleStartGame}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || selectedPlayers.length < 2 || !selectedCourt}
            >
              {loading ? 'กำลังเริ่มเกม...' : 'เริ่มเกม'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
