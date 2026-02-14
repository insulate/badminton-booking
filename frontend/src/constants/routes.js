/**
 * Application Route Constants
 * ใช้สำหรับจัดการ path ของระบบทั้งหมด
 */

// Public Routes
export const ROUTES = {
  // Customer Routes (Public)
  CUSTOMER: {
    HOME: '/',
    RULES: '/rules',
    BOOKING: '/booking',
    LOGIN: '/login',
    REGISTER: '/register',
    MY_BOOKINGS: '/my-bookings',
    PAYMENT: (bookingId) => `/payment/${bookingId}`,
  },

  // Admin Authentication (ย้ายจาก /login)
  LOGIN: '/admin/login',

  // Admin Routes
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    PLAYERS: '/admin/players',
    GROUPPLAY: '/admin/groupplay',
    POS: '/admin/pos',
    SALES: '/admin/sales',
    BOOKING: '/admin/booking',
    BOOKINGS: '/admin/bookings',
    REPORTS: '/admin/reports',
    CATEGORIES: '/admin/settings/categories',
    COURTS: '/admin/settings/courts',
    COURTS_ADD: '/admin/settings/courts/add',
    COURTS_EDIT: (id) => `/admin/settings/courts/edit/${id}`,
    TIMESLOTS: '/admin/settings/timeslots',
    PRODUCTS: '/admin/settings/products',
    SETTINGS_VENUE: '/admin/settings/venue',
    SETTINGS_OPERATING: '/admin/settings/operating',
    SETTINGS_BOOKING: '/admin/settings/booking',
    SETTINGS_PAYMENT: '/admin/settings/payment',
    SETTINGS_GENERAL: '/admin/settings/general',
    SETTINGS_FLOOR_PLAN: '/admin/settings/floor-plan',
    SETTINGS_PLAYER_LEVELS: '/admin/settings/player-levels',
    // Shift Management
    ATTENDANCE: '/admin/attendance',
    SHIFTS: '/admin/shifts',
  },

  // Redirect
  ROOT: '/',
};

// Helper function to get admin route
export const getAdminRoute = (page) => {
  return ROUTES.ADMIN[page.toUpperCase()] || ROUTES.ADMIN.DASHBOARD;
};

export default ROUTES;
