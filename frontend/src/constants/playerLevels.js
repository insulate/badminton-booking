/**
 * Player Level System for Badminton
 * Fetches levels from API with hardcoded fallback
 */

import { settingsAPI } from '../lib/api';

// Hardcoded default levels (fallback when API is unavailable)
const DEFAULT_LEVELS = {
  0: {
    value: '0',
    name: 'เริ่มต้น',
    nameEn: 'Beginner',
    description: 'เริ่มต้นเล่น ยังไม่คุ้นเคยกับกีฬา',
    color: '#94a3b8',
  },
  1: {
    value: '1',
    name: 'มือBG',
    nameEn: 'BG',
    description: 'เล่นได้เบื้องต้น เล่นเพื่อสุขภาพ',
    color: '#60a5fa',
  },
  2: {
    value: '2',
    name: 'มือS-',
    nameEn: 'S Minus',
    description: 'เริ่มมีพื้นฐาน รู้จักเทคนิคพื้นฐาน',
    color: '#34d399',
  },
  3: {
    value: '3',
    name: 'มือS',
    nameEn: 'S',
    description: 'พื้นฐานดี เล่นได้คล่อง',
    color: '#22c55e',
  },
  4: {
    value: '4',
    name: 'มือN',
    nameEn: 'N',
    description: 'เล่นได้ดี มีเทคนิคหลากหลาย',
    color: '#f59e0b',
  },
  5: {
    value: '5',
    name: 'มือP-',
    nameEn: 'P Minus',
    description: 'นักกีฬาระดับดี มีกลยุทธ์ชัดเจน',
    color: '#f97316',
  },
  6: {
    value: '6',
    name: 'มือP',
    nameEn: 'P',
    description: 'นักกีฬาระดับสูง ทักษะครบถ้วน',
    color: '#ef4444',
  },
};

// Module-level cache for API-fetched levels
let _cachedLevels = null;
let _fetchPromise = null;

/**
 * Fetch player levels from API and cache them
 * @returns {Promise<array>} Array of level objects
 */
export const fetchPlayerLevels = async () => {
  // Return cached if available
  if (_cachedLevels) return _cachedLevels;

  // Deduplicate concurrent requests
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      const response = await settingsAPI.getPlayerLevels();
      if (response.success && response.data && response.data.length > 0) {
        _cachedLevels = response.data;
        return _cachedLevels;
      }
    } catch (error) {
      console.error('Error fetching player levels, using defaults:', error);
    }
    // Fallback to defaults
    _cachedLevels = getAllLevelsDefault();
    return _cachedLevels;
  })();

  const result = await _fetchPromise;
  _fetchPromise = null;
  return result;
};

/**
 * Clear the cached levels (call after updating levels in settings)
 */
export const clearLevelsCache = () => {
  _cachedLevels = null;
  _fetchPromise = null;
};

/**
 * Get all levels from cache or hardcoded default (sync)
 */
const getAllLevelsDefault = () => {
  return Object.keys(DEFAULT_LEVELS).map((key) => ({
    value: DEFAULT_LEVELS[key].value,
    name: DEFAULT_LEVELS[key].name,
    nameEn: DEFAULT_LEVELS[key].nameEn,
    description: DEFAULT_LEVELS[key].description,
    color: DEFAULT_LEVELS[key].color,
  }));
};

/**
 * Get level info by level value (uses cache if available, fallback to hardcoded)
 * @param {string|number} level - Level value
 * @param {array} [levelsFromApi] - Optional levels array from API
 * @returns {object|null} Level info or null if not found
 */
export const getLevelInfo = (level, levelsFromApi) => {
  const levelStr = String(level);
  const source = levelsFromApi || _cachedLevels;

  if (source) {
    const found = source.find((l) => String(l.value) === levelStr);
    return found || null;
  }

  // Fallback to hardcoded
  return DEFAULT_LEVELS[levelStr] || null;
};

/**
 * Get level name by level value
 * @param {string|number} level - Level value
 * @param {array} [levelsFromApi] - Optional levels array from API
 * @returns {string} Level name
 */
export const getLevelName = (level, levelsFromApi) => {
  const info = getLevelInfo(level, levelsFromApi);
  return info ? info.name : 'ไม่ระบุ';
};

/**
 * Get all levels as array (sync - from cache or hardcoded)
 * @returns {array} Array of level objects
 */
export const getAllLevels = () => {
  if (_cachedLevels) return _cachedLevels;
  return getAllLevelsDefault();
};

/**
 * Validate level value
 * @param {string|number} level - Level value to validate
 * @returns {boolean} True if valid
 */
export const isValidLevel = (level) => {
  const levelStr = String(level);
  if (_cachedLevels) {
    return _cachedLevels.some((l) => String(l.value) === levelStr);
  }
  return DEFAULT_LEVELS.hasOwnProperty(levelStr);
};

/**
 * Get level color for UI display
 * @param {string|number} level - Level value
 * @param {array} [levelsFromApi] - Optional levels array from API
 * @returns {string} Color hex code
 */
export const getLevelColor = (level, levelsFromApi) => {
  const info = getLevelInfo(level, levelsFromApi);
  return info ? info.color : '#6b7280';
};

// Keep PLAYER_LEVELS export for backwards compat (but prefer getAllLevels/getLevelInfo)
export const PLAYER_LEVELS = DEFAULT_LEVELS;
