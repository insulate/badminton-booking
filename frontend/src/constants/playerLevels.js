/**
 * Player Level System for Badminton
 * Based on MK Badminton 2025 Standard
 * 11 levels (0-10) from beginner to professional
 */

export const PLAYER_LEVELS = {
  0: {
    value: '0',
    name: 'เปาะแปะ',
    nameEn: 'Beginner',
    description: 'เริ่มต้นเล่น ยังไม่คุ้นเคยกับกีฬา',
    color: '#94a3b8', // slate-400
  },
  1: {
    value: '1',
    name: 'หน้าบ้าน',
    nameEn: 'Casual',
    description: 'เล่นได้เบื้องต้น เล่นเพื่อสุขภาพ',
    color: '#60a5fa', // blue-400
  },
  2: {
    value: '2',
    name: 'S-',
    nameEn: 'S Minus',
    description: 'เริ่มมีพื้นฐาน รู้จักเทคนิคพื้นฐาน',
    color: '#34d399', // emerald-400
  },
  3: {
    value: '3',
    name: 'S',
    nameEn: 'S',
    description: 'พื้นฐานดี เล่นได้คล่อง',
    color: '#22c55e', // green-500
  },
  4: {
    value: '4',
    name: 'S+',
    nameEn: 'S Plus',
    description: 'เล่นได้ดี มีเทคนิคหลากหลาย',
    color: '#84cc16', // lime-500
  },
  5: {
    value: '5',
    name: 'A-',
    nameEn: 'A Minus',
    description: 'เล่นได้ดีมาก เริ่มมีกลยุทธ์',
    color: '#eab308', // yellow-500
  },
  6: {
    value: '6',
    name: 'A',
    nameEn: 'A',
    description: 'นักกีฬาระดับดี มีกลยุทธ์ชัดเจน',
    color: '#f59e0b', // amber-500
  },
  7: {
    value: '7',
    name: 'A+',
    nameEn: 'A Plus',
    description: 'นักกีฬาระดับสูง ทักษะครบถ้วน',
    color: '#f97316', // orange-500
  },
  8: {
    value: '8',
    name: 'B',
    nameEn: 'B',
    description: 'นักกีฬาระดับแนวหน้า เคยแข่งขันระดับจังหวัด',
    color: '#ef4444', // red-500
  },
  9: {
    value: '9',
    name: 'B+',
    nameEn: 'B Plus',
    description: 'นักกีฬาระดับสูงมาก เคยแข่งขันระดับภาค/ประเทศ',
    color: '#dc2626', // red-600
  },
  10: {
    value: '10',
    name: 'Pro',
    nameEn: 'Professional',
    description: 'นักกีฬาอาชีพ ระดับทีมชาติ',
    color: '#991b1b', // red-800
  },
};

/**
 * Get level info by level value
 * @param {string|number} level - Level value (0-10)
 * @returns {object|null} Level info or null if not found
 */
export const getLevelInfo = (level) => {
  const levelKey = String(level);
  return PLAYER_LEVELS[levelKey] || null;
};

/**
 * Get level name by level value
 * @param {string|number} level - Level value (0-10)
 * @returns {string} Level name
 */
export const getLevelName = (level) => {
  const info = getLevelInfo(level);
  return info ? info.name : 'ไม่ระบุ';
};

/**
 * Get all levels as array
 * @returns {array} Array of level objects
 */
export const getAllLevels = () => {
  return Object.keys(PLAYER_LEVELS).map((key) => ({
    value: PLAYER_LEVELS[key].value,
    name: PLAYER_LEVELS[key].name,
    nameEn: PLAYER_LEVELS[key].nameEn,
    description: PLAYER_LEVELS[key].description,
    color: PLAYER_LEVELS[key].color,
  }));
};

/**
 * Validate level value
 * @param {string|number} level - Level value to validate
 * @returns {boolean} True if valid
 */
export const isValidLevel = (level) => {
  const levelKey = String(level);
  return PLAYER_LEVELS.hasOwnProperty(levelKey);
};

/**
 * Get level color for UI display
 * @param {string|number} level - Level value
 * @returns {string} Color hex code
 */
export const getLevelColor = (level) => {
  const info = getLevelInfo(level);
  return info ? info.color : '#6b7280'; // gray-500 as default
};
