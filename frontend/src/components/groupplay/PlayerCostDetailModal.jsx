import { useState } from 'react';
import { X, User, Phone, Trophy, Calendar, Clock, DollarSign, Package, Users, ChevronDown, ChevronUp, ShoppingCart, ShoppingBag } from 'lucide-react';

export default function PlayerCostDetailModal({ player, entryFee, sessionPlayers, posSales = [], onClose }) {
  const [showFinishedGames, setShowFinishedGames] = useState(false);

  if (!player) return null;

  const finishedGames = player.games?.filter(g => g.status === 'finished') || [];
  const playingGames = player.games?.filter(g => g.status === 'playing') || [];
  const otherGames = player.games?.filter(g => g.status !== 'finished' && g.status !== 'playing') || [];
  const standaloneItems = player.standaloneItems || [];

  // Calculate total cost from finished games
  const finishedGamesCost = finishedGames.reduce((sum, game) => sum + (game.costPerPlayer || 0), 0);

  // Calculate total cost from standalone items
  const standaloneItemsCost = standaloneItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Calculate total cost from POS sales
  const posSalesTotal = posSales.reduce((sum, sale) => sum + (sale.total || 0), 0);

  // Helper function to get players in a specific game
  const getPlayersInGame = (gameNumber) => {
    if (!sessionPlayers) return [];

    const playersInGame = [];
    sessionPlayers.forEach(p => {
      const game = p.games?.find(g => g.gameNumber === gameNumber);
      if (game) {
        playersInGame.push({
          name: p.name,
          phone: p.phone,
          level: p.level,
          levelName: p.levelName
        });
      }
    });
    return playersInGame;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <User className="text-primary-blue" size={24} />
              รายละเอียดค่าใช้จ่าย
            </h2>
            <div className="mt-2 space-y-1">
              <p className="text-text-primary font-medium">{player.name}</p>
              <p className="text-sm text-text-secondary flex items-center gap-1">
                <Phone size={14} />
                {player.phone}
              </p>
              {player.level && (
                <p className="text-sm flex items-center gap-1">
                  <Trophy size={14} className="text-yellow-500" />
                  <span className="text-text-secondary">
                    {player.levelName || `Level ${player.level}`}
                  </span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Entry Fee */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="text-blue-600" size={20} />
                <span className="font-medium text-text-primary">ค่าเข้าร่วม</span>
              </div>
              <span className="text-lg font-semibold text-blue-600">
                ฿{entryFee || 0}
              </span>
            </div>
          </div>

          {/* Finished Games */}
          {finishedGames.length > 0 && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-green-600" size={20} />
                    <span className="font-semibold text-text-primary">
                      เกมที่เล่นจบแล้ว
                    </span>
                  </div>
                  <button
                    onClick={() => setShowFinishedGames(!showFinishedGames)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {showFinishedGames ? (
                      <>
                        <ChevronUp size={16} />
                        ซ่อนรายละเอียด
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        ดูรายละเอียด
                      </>
                    )}
                  </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-green-700">จำนวนเกม</p>
                    <p className="text-2xl font-bold text-green-800">{finishedGames.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">ค่าใช้จ่ายรวม</p>
                    <p className="text-2xl font-bold text-green-800">฿{finishedGamesCost.toFixed(2)}</p>
                  </div>
                </div>

                {/* Detailed Games List */}
                {showFinishedGames && (
                  <div className="mt-4 pt-4 border-t border-green-200 space-y-3">
                    {finishedGames.map((game, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-white">
                        {/* Game Header */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-text-primary">
                            เกมที่ {game.gameNumber}
                          </span>
                          <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            เล่นจบแล้ว
                          </span>
                        </div>

                        {/* Court Info */}
                        {game.court && (
                          <p className="text-sm text-text-secondary mb-2">
                            สนาม: {game.court.name || `สนาม ${game.court.courtNumber}`}
                          </p>
                        )}

                        {/* Time Info */}
                        <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                          <Clock size={14} />
                          <span>
                            {new Date(game.startTime).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {game.endTime && (
                              <> - {new Date(game.endTime).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</>
                            )}
                          </span>
                        </div>

                        {/* Players in Game */}
                        {(() => {
                          const playersInGame = getPlayersInGame(game.gameNumber);
                          if (playersInGame.length > 0) {
                            return (
                              <div className="mb-3 pb-3 border-b border-slate-200">
                                <p className="text-sm font-medium text-text-primary mb-2 flex items-center gap-1">
                                  <Users size={14} />
                                  ผู้เล่น ({playersInGame.length} คน):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {playersInGame.map((p, pIdx) => (
                                    <span
                                      key={pIdx}
                                      className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-text-primary"
                                    >
                                      {p.name}
                                      {p.levelName && p.levelName !== 'ไม่ระบุ' && (
                                        <span className="ml-1 text-blue-600">
                                          ({p.levelName})
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Items Used */}
                        {game.items && game.items.length > 0 && (
                          <div className="mb-3 pb-3 border-b border-slate-200">
                            <p className="text-sm font-medium text-text-primary mb-2 flex items-center gap-1">
                              <Package size={14} />
                              สินค้าที่ใช้:
                            </p>
                            <div className="space-y-1">
                              {game.items.map((item, itemIdx) => (
                                <div key={itemIdx} className="flex items-center justify-between text-sm">
                                  <span className="text-text-secondary">
                                    {item.product?.name || 'สินค้า'} x {item.quantity}
                                  </span>
                                  <span className="text-text-primary">
                                    ฿{(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              {game.totalItemsCost > 0 && (
                                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-medium">
                                  <span className="text-text-secondary">รวมค่าสินค้า</span>
                                  <span className="text-text-primary">
                                    ฿{game.totalItemsCost.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Cost Per Player */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-300">
                          <span className="font-medium text-text-primary">ค่าใช้จ่ายของคุณ</span>
                          <span className="text-lg font-semibold text-green-600">
                            ฿{game.costPerPlayer?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Playing Games */}
          {playingGames.length > 0 && (
            <div>
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-yellow-600" />
                เกมที่กำลังเล่น ({playingGames.length} เกม)
              </h3>
              <div className="space-y-3">
                {playingGames.map((game, idx) => (
                  <div key={idx} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-text-primary">
                        เกมที่ {game.gameNumber}
                      </span>
                      <span className="text-sm px-2 py-1 bg-yellow-500 text-white rounded-full">
                        กำลังเล่น
                      </span>
                    </div>
                    {game.court && (
                      <p className="text-sm text-text-secondary mb-2">
                        สนาม: {game.court.name || `สนาม ${game.court.courtNumber}`}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Clock size={14} />
                      <span>
                        เริ่มเมื่อ: {new Date(game.startTime).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Games (without proper status) */}
          {otherGames.length > 0 && (
            <div>
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-slate-600" />
                เกมอื่นๆ ({otherGames.length} เกม)
              </h3>
              <div className="space-y-3">
                {otherGames.map((game, idx) => {
                  const playersInGame = getPlayersInGame(game.gameNumber);
                  return (
                    <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      {/* Game Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-text-primary">
                          เกมที่ {game.gameNumber}
                        </span>
                        {game.status && (
                          <span className="text-sm px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                            {game.status}
                          </span>
                        )}
                      </div>

                      {/* Court Info */}
                      {game.court && (
                        <p className="text-sm text-text-secondary mb-2">
                          สนาม: {game.court.name || `สนาม ${game.court.courtNumber}`}
                        </p>
                      )}

                      {/* Time Info */}
                      {game.startTime && (
                        <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                          <Clock size={14} />
                          <span>
                            {new Date(game.startTime).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {game.endTime && (
                              <> - {new Date(game.endTime).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Players in Game */}
                      {playersInGame.length > 0 && (
                        <div className="mb-3 pb-3 border-b border-slate-200">
                          <p className="text-sm font-medium text-text-primary mb-2 flex items-center gap-1">
                            <Users size={14} />
                            ผู้เล่น ({playersInGame.length} คน):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {playersInGame.map((p, pIdx) => (
                              <span
                                key={pIdx}
                                className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-text-primary"
                              >
                                {p.name}
                                {p.levelName && p.levelName !== 'ไม่ระบุ' && (
                                  <span className="ml-1 text-blue-600">
                                    ({p.levelName})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Items Used */}
                      {game.items && game.items.length > 0 && (
                        <div className="mb-3 pb-3 border-b border-slate-200">
                          <p className="text-sm font-medium text-text-primary mb-2 flex items-center gap-1">
                            <Package size={14} />
                            สินค้าที่ใช้:
                          </p>
                          <div className="space-y-1">
                            {game.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center justify-between text-sm">
                                <span className="text-text-secondary">
                                  {item.product?.name || 'สินค้า'} x {item.quantity}
                                </span>
                                <span className="text-text-primary">
                                  ฿{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                            {game.totalItemsCost > 0 && (
                              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-medium">
                                <span className="text-text-secondary">รวมค่าสินค้า</span>
                                <span className="text-text-primary">
                                  ฿{game.totalItemsCost.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Cost Per Player */}
                      {game.costPerPlayer !== undefined && game.costPerPlayer > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-300">
                          <span className="font-medium text-text-primary">ค่าใช้จ่ายของคุณ</span>
                          <span className="text-lg font-semibold text-green-600">
                            ฿{game.costPerPlayer?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standalone Items */}
          {standaloneItems.length > 0 && (
            <div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="text-purple-600" size={20} />
                    <span className="font-semibold text-text-primary">
                      สินค้าเพิ่มเติม
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-purple-600">
                    ฿{standaloneItemsCost.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2">
                  {standaloneItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-purple-100 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">
                          {item.product?.name || 'สินค้า'}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {item.product?.sku && <span className="mr-2">รหัส: {item.product.sku}</span>}
                          จำนวน: {item.quantity}
                        </p>
                        {item.addedAt && (
                          <p className="text-xs text-text-secondary mt-1">
                            เพิ่มเมื่อ: {new Date(item.addedAt).toLocaleString('th-TH', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-text-secondary">
                          ฿{item.price} x {item.quantity}
                        </p>
                        <p className="font-semibold text-purple-600">
                          ฿{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* POS Sales */}
          {posSales.length > 0 && (
            <div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="text-orange-600" size={20} />
                    <span className="font-semibold text-text-primary">
                      สินค้าจาก POS
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-orange-600">
                    ฿{posSalesTotal.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-3">
                  {posSales.map((sale, saleIdx) => (
                    <div key={saleIdx} className="bg-white border border-orange-100 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">
                          {sale.saleCode}
                        </span>
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                          ค้างชำระ
                        </span>
                      </div>
                      <div className="space-y-1">
                        {sale.items?.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center justify-between text-sm">
                            <span className="text-text-secondary">
                              {item.product?.name || 'สินค้า'} x {item.quantity}
                            </span>
                            <span className="text-text-primary">
                              ฿{(item.subtotal || item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-orange-100 flex items-center justify-between text-sm font-medium">
                        <span className="text-text-secondary">รวม</span>
                        <span className="text-orange-600">฿{(sale.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No Games */}
          {(!player.games || player.games.length === 0) && standaloneItems.length === 0 && posSales.length === 0 && (
            <div className="text-center py-8 text-text-secondary">
              <Package size={48} className="mx-auto mb-3 opacity-50" />
              <p>ยังไม่มีข้อมูลเกมและสินค้า</p>
            </div>
          )}
        </div>

        {/* Footer - Summary */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">ค่าเข้าร่วม</span>
              <span className="text-text-primary">฿{entryFee || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">ค่าใช้จ่ายจากเกม</span>
              <span className="text-text-primary">
                ฿{((player.totalCost || 0) - (entryFee || 0) - standaloneItemsCost).toFixed(2)}
              </span>
            </div>
            {standaloneItemsCost > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">ค่าสินค้าเพิ่มเติม</span>
                <span className="text-text-primary">
                  ฿{standaloneItemsCost.toFixed(2)}
                </span>
              </div>
            )}
            {posSalesTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">สินค้าจาก POS</span>
                <span className="text-orange-600">
                  ฿{posSalesTotal.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-300">
              <span className="text-lg font-semibold text-text-primary">ยอดรวมทั้งหมด</span>
              <span className="text-2xl font-bold text-primary-blue">
                ฿{((player.totalCost || 0) + posSalesTotal).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-text-secondary">สถานะการชำระเงิน</span>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                player.paymentStatus === 'paid'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {player.paymentStatus === 'paid' ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
