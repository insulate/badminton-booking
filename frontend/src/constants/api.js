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
    CHECKIN: (id) => `/bookings/${id}/checkin`,
    CHECKOUT: (id) => `/bookings/${id}/checkout`,
    CANCEL: (id) => `/bookings/${id}/cancel`,
    UPDATE_PAYMENT: (id) => `/bookings/${id}/payment`,
  },
};

export default API_ENDPOINTS;
