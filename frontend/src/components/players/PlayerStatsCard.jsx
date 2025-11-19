import PropTypes from 'prop-types';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

/**
 * PlayerStatsCard - แสดงสถิติของผู้เล่นแบบ Card
 * @param {object} stats - สถิติผู้เล่น { totalGames, totalSpent, lastPlayed }
 * @param {boolean} compact - แสดงแบบกะทัดรัด
 */
export default function PlayerStatsCard({ stats, compact = false }) {
  const { totalGames = 0, totalSpent = 0, lastPlayed } = stats || {};

  // Format date
  const formatDate = (date) => {
    if (!date) return 'ไม่เคยเล่น';
    const d = new Date(date);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          <span>{totalGames} เกม</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          <span>{formatCurrency(totalSpent)}</span>
        </div>
        {lastPlayed && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(lastPlayed)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">สถิติผู้เล่น</h3>
      <div className="grid grid-cols-3 gap-4">
        {/* Total Games */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500">จำนวนเกม</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{totalGames}</span>
        </div>

        {/* Total Spent */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500">ค่าใช้จ่าย</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</span>
        </div>

        {/* Last Played */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500">เล่นล่าสุด</span>
          </div>
          <span className="text-sm font-medium text-gray-900">{formatDate(lastPlayed)}</span>
        </div>
      </div>
    </div>
  );
}

PlayerStatsCard.propTypes = {
  stats: PropTypes.shape({
    totalGames: PropTypes.number,
    totalSpent: PropTypes.number,
    lastPlayed: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
  compact: PropTypes.bool,
};
