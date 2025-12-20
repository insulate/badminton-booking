/**
 * Date utility functions
 * ใช้สำหรับจัดการวันที่ในระบบเพื่อหลีกเลี่ยงปัญหา timezone
 */

/**
 * Format date to YYYY-MM-DD string using local timezone
 * @param {Date|string} date - Date object or date string
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDateToString = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Get today's date as YYYY-MM-DD string using local timezone
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayString = () => {
  return formatDateToString(new Date());
};

/**
 * Get date N days from today as YYYY-MM-DD string
 * @param {number} days - Number of days from today (can be negative)
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getDateFromToday = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateToString(date);
};

/**
 * Get first day of month as YYYY-MM-DD string
 * @param {Date} date - Reference date
 * @returns {string} First day of month in YYYY-MM-DD format
 */
export const getFirstDayOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(1);
  return formatDateToString(d);
};

/**
 * Get last day of month as YYYY-MM-DD string
 * @param {Date} date - Reference date
 * @returns {string} Last day of month in YYYY-MM-DD format
 */
export const getLastDayOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return formatDateToString(d);
};

export default {
  formatDateToString,
  getTodayString,
  getDateFromToday,
  getFirstDayOfMonth,
  getLastDayOfMonth,
};
