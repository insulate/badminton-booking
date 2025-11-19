import PropTypes from 'prop-types';
import { getLevelInfo } from '../../constants/playerLevels';

/**
 * PlayerLevelBadge - แสดงระดับมือของผู้เล่นแบบ Badge พร้อมสี
 * @param {string|number} level - ระดับมือ (0-10)
 * @param {string} size - ขนาด badge (sm, md, lg)
 * @param {boolean} showDescription - แสดงคำอธิบาย
 */
export default function PlayerLevelBadge({ level, size = 'md', showDescription = false }) {
  const levelInfo = getLevelInfo(level);

  if (!levelInfo) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        ไม่ระบุ
      </span>
    );
  }

  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full font-medium text-white ${sizeClass}`}
        style={{ backgroundColor: levelInfo.color }}
        title={levelInfo.description}
      >
        {levelInfo.name}
      </span>
      {showDescription && (
        <span className="text-xs text-gray-500">{levelInfo.description}</span>
      )}
    </div>
  );
}

PlayerLevelBadge.propTypes = {
  level: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showDescription: PropTypes.bool,
};
