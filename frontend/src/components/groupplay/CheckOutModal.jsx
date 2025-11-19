import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckOutModal({ session, onClose, onSuccess }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkedInPlayers = session.players?.filter(p => p.checkedIn && !p.checkedOut) || [];

  const handleCheckOut = async () => {
    if (!selectedPlayer) {
      toast.error('กรุณาเลือกผู้เล่น');
      return;
    }

    setLoading(true);
    try {
      await onSuccess(session._id, selectedPlayer._id);
      toast.success('Check-out สำเร็จ!');
      onClose();
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการ check-out');
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
            <h2 className="text-xl font-semibold text-text-primary">Check-out ผู้เล่น</h2>
            <p className="text-sm text-text-secondary mt-1">
              เลือกผู้เล่นเพื่อดูสรุปยอดและชำระเงิน
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
            <div className="space-y-3 mb-6">
              {checkedInPlayers.map((player, index) => {
                const isSelected = selectedPlayer?.phone === player.phone;
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedPlayer(player)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'border-primary-blue bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-text-primary mb-1">{player.name}</p>
                        <p className="text-sm text-text-secondary">{player.phone}</p>
                        {player.level && (
                          <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {player.levelName || `Level ${player.level}`}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary mb-1">เกม: {player.games?.length || 0}</p>
                        <p className="text-lg font-semibold text-green-600">฿{player.totalCost || 0}</p>
                        <p className={`text-xs mt-1 ${
                          player.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {player.paymentStatus === 'paid' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Payment Summary */}
          {selectedPlayer && (
            <div className="p-4 bg-slate-50 rounded-lg mb-6">
              <h3 className="font-medium text-text-primary mb-3">สรุปยอดเงิน</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">ค่าเข้าร่วม:</span>
                  <span className="font-medium">฿{session.entryFee || 0}</span>
                </div>
                {selectedPlayer.games?.map((game, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">เกมที่ {game.gameNumber}:</span>
                    <span className="font-medium">฿{game.costPerPlayer || 0}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">รวมทั้งหมด:</span>
                    <span className="text-xl font-bold text-green-600">
                      ฿{selectedPlayer.totalCost || 0}
                    </span>
                  </div>
                </div>
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
              onClick={handleCheckOut}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !selectedPlayer}
            >
              {loading ? 'กำลัง Check-out...' : 'Check-out และชำระเงิน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
