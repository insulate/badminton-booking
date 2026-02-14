/**
 * Player Level System for Badminton
 * 7 levels (0-6) from beginner to professional
 */

const PLAYER_LEVELS = {
  0: {
    value: '0',
    name: 'เริ่มต้น',
    nameEn: 'Beginner',
    description: 'เริ่มต้นเล่น ยังไม่คุ้นเคยกับกีฬา',
    color: '#94a3b8', // slate-400
  },
  1: {
    value: '1',
    name: 'มือBG',
    nameEn: 'BG',
    description: 'เล่นได้เบื้องต้น เล่นเพื่อสุขภาพ',
    color: '#60a5fa', // blue-400
  },
  2: {
    value: '2',
    name: 'มือS-',
    nameEn: 'S Minus',
    description: 'เริ่มมีพื้นฐาน รู้จักเทคนิคพื้นฐาน',
    color: '#34d399', // emerald-400
  },
  3: {
    value: '3',
    name: 'มือS',
    nameEn: 'S',
    description: 'พื้นฐานดี เล่นได้คล่อง',
    color: '#22c55e', // green-500
  },
  4: {
    value: '4',
    name: 'มือN',
    nameEn: 'N',
    description: 'เล่นได้ดี มีเทคนิคหลากหลาย',
    color: '#f59e0b', // amber-500
  },
  5: {
    value: '5',
    name: 'มือP-',
    nameEn: 'P Minus',
    description: 'นักกีฬาระดับดี มีกลยุทธ์ชัดเจน',
    color: '#f97316', // orange-500
  },
  6: {
    value: '6',
    name: 'มือP',
    nameEn: 'P',
    description: 'นักกีฬาระดับสูง ทักษะครบถ้วน',
    color: '#ef4444', // red-500
  },
};

/**
 * Get levels from DB (async) with hardcoded fallback
 * @returns {Promise<array>} Array of level objects from DB
 */
const getLevelsFromDB = async () => {
  try {
    const Setting = require('../models/setting.model');
    const settings = await Setting.getSettings();
    if (settings.playerLevels && settings.playerLevels.length > 0) {
      return settings.playerLevels;
    }
  } catch (error) {
    // Fallback to hardcoded levels
  }
  return getAllLevels();
};

/**
 * Get level info by level value (uses hardcoded fallback)
 * @param {string|number} level - Level value
 * @returns {object|null} Level info or null if not found
 */
const getLevelInfo = (level) => {
  const levelKey = String(level);
  return PLAYER_LEVELS[levelKey] || null;
};

/**
 * Get level name by level value (uses hardcoded fallback)
 * @param {string|number} level - Level value
 * @returns {string} Level name
 */
const getLevelName = (level) => {
  const info = getLevelInfo(level);
  return info ? info.name : 'ไม่ระบุ';
};

/**
 * Get level name from DB levels array
 * @param {string|number} level - Level value
 * @param {array} dbLevels - Levels array from DB
 * @returns {string} Level name
 */
const getLevelNameFromList = (level, dbLevels) => {
  const found = dbLevels.find((l) => String(l.value) === String(level));
  return found ? found.name : 'ไม่ระบุ';
};

/**
 * Get all levels as array (hardcoded fallback)
 * @returns {array} Array of level objects
 */
const getAllLevels = () => {
  return Object.keys(PLAYER_LEVELS).map((key) => ({
    value: PLAYER_LEVELS[key].value,
    name: PLAYER_LEVELS[key].name,
    nameEn: PLAYER_LEVELS[key].nameEn,
    description: PLAYER_LEVELS[key].description,
    color: PLAYER_LEVELS[key].color,
  }));
};

/**
 * Validate level value (uses hardcoded fallback)
 * @param {string|number} level - Level value to validate
 * @returns {boolean} True if valid
 */
const isValidLevel = (level) => {
  const levelKey = String(level);
  return PLAYER_LEVELS.hasOwnProperty(levelKey);
};

/**
 * Get level difference (for match balancing)
 * @param {string|number} level1 - First player level
 * @param {string|number} level2 - Second player level
 * @returns {number} Absolute difference
 */
const getLevelDifference = (level1, level2) => {
  return Math.abs(Number(level1) - Number(level2));
};

/**
 * Check if levels are balanced for a match
 * @param {array} team1Levels - Array of level values for team 1
 * @param {array} team2Levels - Array of level values for team 2
 * @returns {object} Balance info
 */
const checkMatchBalance = (team1Levels, team2Levels) => {
  const team1Avg = team1Levels.reduce((sum, l) => sum + Number(l), 0) / team1Levels.length;
  const team2Avg = team2Levels.reduce((sum, l) => sum + Number(l), 0) / team2Levels.length;
  const difference = Math.abs(team1Avg - team2Avg);

  let balance = 'balanced';
  let message = 'การจับคู่สมดุล เหมาะสมสำหรับการแข่งขัน';

  if (difference > 2) {
    balance = 'unbalanced';
    message = 'ทีมไม่สมดุล แนะนำให้ปรับการจับคู่';
  } else if (difference > 1) {
    balance = 'slightly_unbalanced';
    message = 'ทีมสมดุลพอใช้ แต่อาจมีความได้เปรียบเล็กน้อย';
  }

  return {
    team1Average: team1Avg.toFixed(1),
    team2Average: team2Avg.toFixed(1),
    difference: difference.toFixed(1),
    balance,
    message,
  };
};

/**
 * Suggest match pairing based on levels
 * @param {array} players - Array of player objects with level property
 * @returns {object} Suggested pairing
 */
const suggestMatchPairing = (players) => {
  if (players.length < 2 || players.length > 4) {
    return null;
  }

  // Sort by level
  const sorted = [...players].sort((a, b) => Number(a.level) - Number(b.level));

  if (players.length === 2) {
    // Singles match
    return {
      type: 'singles',
      player1: sorted[0],
      player2: sorted[1],
      balanced: getLevelDifference(sorted[0].level, sorted[1].level) <= 2,
    };
  }

  if (players.length === 4) {
    // Doubles match - pair highest with lowest for balance
    const pairing1 = {
      team1: [sorted[0], sorted[3]], // Lowest + Highest
      team2: [sorted[1], sorted[2]], // Middle two
    };

    const pairing2 = {
      team1: [sorted[0], sorted[1]], // Two lowest
      team2: [sorted[2], sorted[3]], // Two highest
    };

    const balance1 = checkMatchBalance(
      pairing1.team1.map((p) => p.level),
      pairing1.team2.map((p) => p.level)
    );

    const balance2 = checkMatchBalance(
      pairing2.team1.map((p) => p.level),
      pairing2.team2.map((p) => p.level)
    );

    // Choose more balanced pairing
    const bestPairing = Number(balance1.difference) <= Number(balance2.difference) ? pairing1 : pairing2;
    const bestBalance = Number(balance1.difference) <= Number(balance2.difference) ? balance1 : balance2;

    return {
      type: 'doubles',
      pairing: bestPairing,
      balance: bestBalance,
    };
  }

  return null;
};

module.exports = {
  PLAYER_LEVELS,
  getLevelInfo,
  getLevelName,
  getLevelNameFromList,
  getAllLevels,
  getLevelsFromDB,
  isValidLevel,
  getLevelDifference,
  checkMatchBalance,
  suggestMatchPairing,
};
