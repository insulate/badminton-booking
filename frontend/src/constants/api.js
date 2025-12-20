/**
 * API Endpoint Constants
 * ใช้สำหรับจัดการ API endpoints ทั้งหมด
 */

// Base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    ME: '/auth/me',
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/password',
    // Player Auth
    PLAYER_REGISTER: '/auth/player/register',
    PLAYER_LOGIN: '/auth/player/login',
    PLAYER_ME: '/auth/player/me',
  },

  // User Management (Admin)
  USERS: {
    LIST: '/users',
    GET: (id) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    RESTORE: (id) => `/users/${id}/restore`,
  },

  // Settings (Admin)
  SETTINGS: {
    GET: '/settings',
    UPDATE_ALL: '/settings',
    UPDATE_VENUE: '/settings/venue',
    UPDATE_OPERATING: '/settings/operating',
    UPDATE_BOOKING: '/settings/booking',
    UPDATE_PAYMENT: '/settings/payment',
    UPDATE_GENERAL: '/settings/general',
    RESET: '/settings/reset',
    FLOOR_PLAN: '/settings/floor-plan',
    PAYMENT_INFO: '/settings/payment-info', // Public
    BLOCKED_DATES: '/settings/blocked-dates', // Public GET, Admin POST/DELETE
    BLOCKED_DATE: (date) => `/settings/blocked-dates/${date}`, // Admin DELETE
  },

  // Courts Management (Admin)
  COURTS: {
    LIST: '/courts',
    GET: (id) => `/courts/${id}`,
    CREATE: '/courts',
    UPDATE: (id) => `/courts/${id}`,
    DELETE: (id) => `/courts/${id}`,
  },

  // TimeSlots Management (Admin)
  TIMESLOTS: {
    LIST: '/timeslots',
    ACTIVE: '/timeslots/active',
    GET: (id) => `/timeslots/${id}`,
    CREATE: '/timeslots',
    UPDATE: (id) => `/timeslots/${id}`,
    UPDATE_PRICING: (id) => `/timeslots/${id}/pricing`,
    BULK_UPDATE_PRICING: '/timeslots/bulk-update-pricing',
    DELETE: (id) => `/timeslots/${id}`,
  },

  // Bookings Management (Admin)
  BOOKINGS: {
    LIST: '/bookings',
    DAILY_SCHEDULE: '/bookings/schedule/daily',
    GET: (id) => `/bookings/${id}`,
    CREATE: '/bookings',
    UPDATE: (id) => `/bookings/${id}`,
    CHECK_AVAILABILITY: '/bookings/check-availability',
    CALCULATE_PRICE: '/bookings/calculate-price',
    CHECKIN: (id) => `/bookings/${id}/checkin`,
    CHECKOUT: (id) => `/bookings/${id}/checkout`,
    CANCEL: (id) => `/bookings/${id}/cancel`,
    UPDATE_PAYMENT: (id) => `/bookings/${id}/payment`,
    // Customer booking
    PUBLIC_AVAILABILITY: '/bookings/public/availability',
    CUSTOMER_CREATE: '/bookings/customer',
    CUSTOMER_MY_BOOKINGS: '/bookings/customer/my-bookings',
    CUSTOMER_GET: (id) => `/bookings/customer/${id}`,
    ASSIGN_COURT: (id) => `/bookings/${id}/assign-court`,
    // Payment slip
    UPLOAD_SLIP: (id) => `/bookings/${id}/upload-slip`,
    VERIFY_SLIP: (id) => `/bookings/${id}/verify-slip`,
  },

  // Products Management (Admin)
  PRODUCTS: {
    LIST: '/products',
    GENERATE_SKU: '/products/generate-sku',
    GET: (id) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id) => `/products/${id}`,
    UPDATE_STOCK: (id) => `/products/${id}/stock`,
    DELETE: (id) => `/products/${id}`,
  },

  // Sales Management (Admin)
  SALES: {
    LIST: '/sales',
    DAILY: '/sales/daily',
    GET: (id) => `/sales/${id}`,
    CREATE: '/sales',
  },

  // Categories Management (Admin)
  CATEGORIES: {
    LIST: '/categories',
    GET: (id) => `/categories/${id}`,
    CREATE: '/categories',
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },

  // Players Management (Admin)
  PLAYERS: {
    LIST: '/players',
    GET: (id) => `/players/${id}`,
    STATS: (id) => `/players/stats/${id}`,
    CREATE: '/players',
    UPDATE: (id) => `/players/${id}`,
    DELETE: (id) => `/players/${id}`,
    RESTORE: (id) => `/players/${id}/restore`,
  },

  // Group Play Management (Admin)
  GROUPPLAY: {
    LIST: '/groupplay',
    GET: (id) => `/groupplay/${id}`,
    CREATE: '/groupplay',
    UPDATE: (id) => `/groupplay/${id}`,
    CHECKIN: (id) => `/groupplay/${id}/checkin`,
    START_GAME: (id) => `/groupplay/${id}/game/start`,
    FINISH_GAME: (id, playerId, gameNumber) => `/groupplay/${id}/game/${playerId}/${gameNumber}/finish`,
    CHECKOUT: (id, playerId) => `/groupplay/${id}/checkout/${playerId}`,
    ADD_PLAYER_PRODUCTS: (id, playerId) => `/groupplay/${id}/player/${playerId}/products`,
  },

  // Reports & Analytics (Admin)
  REPORTS: {
    REVENUE_DAILY: '/reports/revenue/daily',
    REVENUE_MONTHLY: '/reports/revenue/monthly',
    REVENUE_YEARLY: '/reports/revenue/yearly',
    BOOKINGS_SUMMARY: '/reports/bookings/summary',
    PRODUCTS_SALES: '/reports/products/sales',
    COURTS_USAGE: '/reports/courts/usage',
  },
};

export default API_ENDPOINTS;
