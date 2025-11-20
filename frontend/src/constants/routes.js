/**
 * Application Route Constants
 * ใช้สำหรับจัดการ path ของระบบทั้งหมด
 */

// Public Routes
export const ROUTES = {
  // Authentication
  LOGIN: '/login',

  // Admin Routes
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    PLAYERS: '/admin/players',
    GROUPPLAY: '/admin/groupplay',
    POS: '/admin/pos',
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
  },

  // Redirect
  ROOT: '/',
};

// Helper function to get admin route
export const getAdminRoute = (page) => {
  return ROUTES.ADMIN[page.toUpperCase()] || ROUTES.ADMIN.DASHBOARD;
};

export default ROUTES;
