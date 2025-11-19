import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditGamePlayersModal({ session, game, onClose, onSuccess }) {
  const [selectedPlayers, setSelectedPlayers] = useState(game.players || []);
  const [loading, setLoading] = useState(false);

  // Get all checked-in players
  const checkedInPlayers = session.players?.filter(p => p.checkedIn && !p.checkedOut) || [];

  // Check if a player is currently playing in another game
  const isPlayerPlayingInOtherGame = (player) => {
    return player.games?.some(g =>
      g.status === 'playing' && g.gameNumber !== game.gameNumber
    ) || false;
  };

  const togglePlayer = (player) => {
    const isSelected = selectedPlayers.find(p => p.phone === player.phone);

    if (isSelected) {
      if (selectedPlayers.length <= 2) {
        toast.error('ต้องมีผู้เล่นอย่างน้อย 2 คน');
        return;
      }
      setSelectedPlayers(selectedPlayers.filter(p => p.phone !== player.phone));
    } else {
      if (selectedPlayers.length >= 4) {
        toast.error('สามารถเลือกได้สูงสุด 4 คน');
        return;
      }
      if (isPlayerPlayingInOtherGame(player)) {
        toast.error('ผู้เล่นนี้กำลังเล่นอยู่ในเกมอื่น');
        return;
      }
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleSave = async () => {
    if (selectedPlayers.length < 2) {
      toast.error('กรุณาเลือกผู้เล่นอย่างน้อย 2 คน');
      return;
    }

    setLoading(true);
    try {
      const playerIds = selectedPlayers.map(p => p._id);
      await onSuccess(session._id, game.gameNumber, { playerIds });
      toast.success('อัปเดตผู้เล่นสำเร็จ!');
      onClose();
    } catch (error) {
      console.error('Error updating players:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตผู้เล่น');
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
            <h2 className="text-xl font-semibold text-text-primary">แก้ไขผู้เล่น</h2>
            <p className="text-sm text-text-secondary mt-1">
              เกมที่ {game.gameNumber} • เลือกผู้เล่น 2-4 คน ({selectedPlayers.length}/4)
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
          {/* Player Selection */}
          {checkedInPlayers.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              ไม่มีผู้เล่นที่ check-in
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {checkedInPlayers
                .sort((a, b) => {
                  const aPlaying = isPlayerPlayingInOtherGame(a);
                  const bPlaying = isPlayerPlayingInOtherGame(b);
                  if (aPlaying === bPlaying) return 0;
                  return aPlaying ? 1 : -1;
                })
                .map((player, index) => {
                  const isSelected = selectedPlayers.find(p => p.phone === player.phone);
                  const isPlayingOther = isPlayerPlayingInOtherGame(player);
                  return (
                    <button
                      key={index}
                      onClick={() => togglePlayer(player)}
                      disabled={isPlayingOther}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        isPlayingOther
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
                          {isPlayingOther ? (
                            <span className="text-orange-600 text-xs font-medium">
                              🎾 กำลังเล่นเกมอื่น
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

          {/* Selected Players Summary */}
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
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || selectedPlayers.length < 2}
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
