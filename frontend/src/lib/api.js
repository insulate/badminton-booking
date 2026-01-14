import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS, ROUTES } from '../constants';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    // Only add admin token if Authorization header is not already set
    // This allows customerBookingsAPI to use playerToken without being overridden
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // If data is FormData, remove Content-Type header to let axios set it automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if this is a customer or admin request
      const isCustomerPath = window.location.pathname.startsWith('/booking') ||
        window.location.pathname.startsWith('/my-bookings') ||
        window.location.pathname.startsWith('/payment') ||
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register') ||
        window.location.pathname === '/' ||
        window.location.pathname === '/rules';

      if (isCustomerPath) {
        // Customer token expired - clear customer data and redirect to customer login
        localStorage.removeItem('playerToken');
        localStorage.removeItem('player');
        window.location.href = ROUTES.CUSTOMER.LOGIN;
      } else {
        // Admin token expired - clear admin data and redirect to admin login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = ROUTES.LOGIN;
      }
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
    return response.data;
  },
};

// Player Authentication API
export const playerAuthAPI = {
  register: async (data) => {
    const response = await api.post(API_ENDPOINTS.AUTH.PLAYER_REGISTER, data);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.AUTH.PLAYER_LOGIN, credentials);
    return response.data;
  },

  getMe: async () => {
    const token = localStorage.getItem('playerToken');
    const response = await api.get(API_ENDPOINTS.AUTH.PLAYER_ME, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
};

// Customer Bookings API
export const customerBookingsAPI = {
  getAvailability: async (date) => {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.PUBLIC_AVAILABILITY, {
      params: { date }
    });
    return response.data;
  },

  create: async (data) => {
    const token = localStorage.getItem('playerToken');
    const response = await api.post(API_ENDPOINTS.BOOKINGS.CUSTOMER_CREATE, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getMyBookings: async (params) => {
    const token = localStorage.getItem('playerToken');
    const response = await api.get(API_ENDPOINTS.BOOKINGS.CUSTOMER_MY_BOOKINGS, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  getBookingById: async (id) => {
    const token = localStorage.getItem('playerToken');
    const response = await api.get(API_ENDPOINTS.BOOKINGS.CUSTOMER_GET(id), {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Public - get booking for payment page (no auth required)
  getBookingForPayment: async (id) => {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.PAYMENT_GET(id));
    return response.data;
  },

  uploadSlip: async (bookingId, formData) => {
    const token = localStorage.getItem('playerToken');
    const response = await api.post(API_ENDPOINTS.BOOKINGS.UPLOAD_SLIP(bookingId), formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Public - upload slip for payment page (no auth required)
  uploadSlipPublic: async (bookingId, formData) => {
    const response = await api.post(API_ENDPOINTS.BOOKINGS.PAYMENT_UPLOAD_SLIP(bookingId), formData);
    return response.data;
  },

  getPaymentInfo: async () => {
    const response = await api.get(API_ENDPOINTS.SETTINGS.PAYMENT_INFO);
    return response.data;
  },
};

// User API (Admin only)
export const userAPI = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.USERS.LIST, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.USERS.GET(id));
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.USERS.CREATE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(API_ENDPOINTS.USERS.UPDATE(id), data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(API_ENDPOINTS.USERS.DELETE(id));
    return response.data;
  },

  restore: async (id) => {
    const response = await api.patch(API_ENDPOINTS.USERS.RESTORE(id));
    return response.data;
  },
};

// Settings API (Admin only)
export const settingsAPI = {
  get: async () => {
    const response = await api.get(API_ENDPOINTS.SETTINGS.GET);
    return response.data;
  },

  updateAll: async (data) => {
    const response = await api.put(API_ENDPOINTS.SETTINGS.UPDATE_ALL, data);
    return response.data;
  },

  updateVenue: async (data) => {
    const response = await api.patch(API_ENDPOINTS.SETTINGS.UPDATE_VENUE, data);
    return response.data;
  },

  updateOperating: async (data) => {
    const response = await api.patch(API_ENDPOINTS.SETTINGS.UPDATE_OPERATING, data);
    return response.data;
  },

  updateBooking: async (data) => {
    const response = await api.patch(API_ENDPOINTS.SETTINGS.UPDATE_BOOKING, data);
    return response.data;
  },

  updatePayment: async (data) => {
    const response = await api.patch(API_ENDPOINTS.SETTINGS.UPDATE_PAYMENT, data);
    return response.data;
  },

  updateGeneral: async (data) => {
    const response = await api.patch(API_ENDPOINTS.SETTINGS.UPDATE_GENERAL, data);
    return response.data;
  },

  reset: async () => {
    const response = await api.post(API_ENDPOINTS.SETTINGS.RESET);
    return response.data;
  },

  getFloorPlan: async () => {
    const response = await api.get(API_ENDPOINTS.SETTINGS.FLOOR_PLAN);
    return response.data;
  },

  uploadFloorPlan: async (formData) => {
    const response = await api.post(API_ENDPOINTS.SETTINGS.FLOOR_PLAN, formData);
    return response.data;
  },

  deleteFloorPlan: async () => {
    const response = await api.delete(API_ENDPOINTS.SETTINGS.FLOOR_PLAN);
    return response.data;
  },

  // QR Code upload
  uploadQRCode: async (formData) => {
    const response = await api.post(API_ENDPOINTS.SETTINGS.QR_CODE, formData);
    return response.data;
  },

  deleteQRCode: async () => {
    const response = await api.delete(API_ENDPOINTS.SETTINGS.QR_CODE);
    return response.data;
  },

  // Blocked Dates (วันปิดการจอง)
  getBlockedDates: async () => {
    const response = await api.get(API_ENDPOINTS.SETTINGS.BLOCKED_DATES);
    return response.data;
  },

  addBlockedDate: async (date, reason = '') => {
    const response = await api.post(API_ENDPOINTS.SETTINGS.BLOCKED_DATES, { date, reason });
    return response.data;
  },

  removeBlockedDate: async (date) => {
    const response = await api.delete(API_ENDPOINTS.SETTINGS.BLOCKED_DATE(date));
    return response.data;
  },
};

// Courts API (Admin only)
export const courtsAPI = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.COURTS.LIST, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.COURTS.GET(id));
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.COURTS.CREATE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(API_ENDPOINTS.COURTS.UPDATE(id), data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(API_ENDPOINTS.COURTS.DELETE(id));
    return response.data;
  },
};

// TimeSlots API (Admin only)
export const timeslotsAPI = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.TIMESLOTS.LIST, { params });
    return response.data;
  },

  getActive: async (params) => {
    const response = await api.get(API_ENDPOINTS.TIMESLOTS.ACTIVE, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.TIMESLOTS.GET(id));
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.TIMESLOTS.CREATE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(API_ENDPOINTS.TIMESLOTS.UPDATE(id), data);
    return response.data;
  },

  updatePricing: async (id, pricing) => {
    const response = await api.patch(API_ENDPOINTS.TIMESLOTS.UPDATE_PRICING(id), { pricing });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(API_ENDPOINTS.TIMESLOTS.DELETE(id));
    return response.data;
  },

  bulkUpdatePricing: async (data) => {
    const response = await api.patch(API_ENDPOINTS.TIMESLOTS.BULK_UPDATE_PRICING, data);
    return response.data;
  },
};

// Bookings API
export const bookingsAPI = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.LIST, { params });
    return response.data;
  },

  getDailySchedule: async (date) => {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.DAILY_SCHEDULE, {
      params: { date },
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.BOOKINGS.GET(id));
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.BOOKINGS.CREATE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(API_ENDPOINTS.BOOKINGS.UPDATE(id), data);
    return response.data;
  },

  checkAvailability: async (data) => {
    const response = await api.post(API_ENDPOINTS.BOOKINGS.CHECK_AVAILABILITY, data);
    return response.data;
  },

  calculatePrice: async (data) => {
    const response = await api.post(API_ENDPOINTS.BOOKINGS.CALCULATE_PRICE, data);
    return response.data;
  },

  checkin: async (id) => {
    const response = await api.patch(API_ENDPOINTS.BOOKINGS.CHECKIN(id));
    return response.data;
  },

  checkout: async (id) => {
    const response = await api.patch(API_ENDPOINTS.BOOKINGS.CHECKOUT(id));
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.patch(API_ENDPOINTS.BOOKINGS.CANCEL(id));
    return response.data;
  },

  updatePayment: async (id, data) => {
    const response = await api.patch(API_ENDPOINTS.BOOKINGS.UPDATE_PAYMENT(id), data);
    return response.data;
  },

  assignCourt: async (id, courtId) => {
    const response = await api.patch(API_ENDPOINTS.BOOKINGS.ASSIGN_COURT(id), { courtId });
    return response.data;
  },

  verifySlip: async (id, action, rejectReason = '') => {
    const response = await api.patch(API_ENDPOINTS.BOOKINGS.VERIFY_SLIP(id), { action, rejectReason });
    return response.data;
  },
};

// Products API (Admin only)
export const productsAPI = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.PRODUCTS.LIST, { params });
    return response.data;
  },

  generateSKU: async (category) => {
    const response = await api.get(API_ENDPOINTS.PRODUCTS.GENERATE_SKU, {
      params: { category },
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.PRODUCTS.GET(id));
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.PRODUCTS.CREATE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(API_ENDPOINTS.PRODUCTS.UPDATE(id), data);
    return response.data;
  },

  updateStock: async (id, stock) => {
    const response = await api.patch(API_ENDPOINTS.PRODUCTS.UPDATE_STOCK(id), { stock });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(API_ENDPOINTS.PRODUCTS.DELETE(id));
    return response.data;
  },
};

// Sales API (Admin only)
export const salesAPI = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.SALES.LIST, { params });
    return response.data;
  },

  getDaily: async (date) => {
    const response = await api.get(API_ENDPOINTS.SALES.DAILY, {
      params: { date },
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.SALES.GET(id));
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.SALES.CREATE, data);
    return response.data;
  },
};

// Categories API (Admin only)
export const categoriesAPI = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.CATEGORIES.LIST, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.CATEGORIES.GET(id));
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.CATEGORIES.CREATE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(API_ENDPOINTS.CATEGORIES.UPDATE(id), data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(API_ENDPOINTS.CATEGORIES.DELETE(id));
    return response.data;
  },
};

// Players API (Admin only)
export const playersAPI = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.PLAYERS.LIST, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.PLAYERS.GET(id));
    return response.data;
  },

  getStats: async (id) => {
    const response = await api.get(API_ENDPOINTS.PLAYERS.STATS(id));
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.PLAYERS.CREATE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(API_ENDPOINTS.PLAYERS.UPDATE(id), data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(API_ENDPOINTS.PLAYERS.DELETE(id));
    return response.data;
  },

  restore: async (id) => {
    const response = await api.post(API_ENDPOINTS.PLAYERS.RESTORE(id));
    return response.data;
  },
};

// Group Play API (Admin only)
export const groupPlayAPI = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.GROUPPLAY.LIST, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.GROUPPLAY.GET(id));
    return response.data;
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.GROUPPLAY.CREATE, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.patch(API_ENDPOINTS.GROUPPLAY.UPDATE(id), data);
    return response.data;
  },

  checkIn: async (id, playerData) => {
    const response = await api.post(API_ENDPOINTS.GROUPPLAY.CHECKIN(id), playerData);
    return response.data;
  },

  startGame: async (id, gameData) => {
    const response = await api.post(API_ENDPOINTS.GROUPPLAY.START_GAME(id), gameData);
    return response.data;
  },

  finishGame: async (id, playerId, gameNumber, gameData) => {
    const response = await api.patch(API_ENDPOINTS.GROUPPLAY.FINISH_GAME(id, playerId, gameNumber), gameData);
    return response.data;
  },

  updateGamePlayers: async (sessionId, gameNumber, data) => {
    const response = await api.patch(`/groupplay/${sessionId}/game/${gameNumber}/players`, data);
    return response.data;
  },

  addPlayerProducts: async (sessionId, playerId, data) => {
    const response = await api.post(API_ENDPOINTS.GROUPPLAY.ADD_PLAYER_PRODUCTS(sessionId, playerId), data);
    return response.data;
  },

  checkOut: async (id, playerId) => {
    const response = await api.post(API_ENDPOINTS.GROUPPLAY.CHECKOUT(id, playerId));
    return response.data;
  },
};

// Reports API
export const reportsAPI = {
  getDailyRevenue: async (date) => {
    const response = await api.get(`${API_ENDPOINTS.REPORTS.REVENUE_DAILY}?date=${date}`);
    return response.data;
  },

  getMonthlyRevenue: async (month) => {
    const response = await api.get(`${API_ENDPOINTS.REPORTS.REVENUE_MONTHLY}?month=${month}`);
    return response.data;
  },

  getYearlyRevenue: async (year) => {
    const response = await api.get(`${API_ENDPOINTS.REPORTS.REVENUE_YEARLY}?year=${year}`);
    return response.data;
  },

  getBookingsSummary: async (startDate, endDate) => {
    let url = API_ENDPOINTS.REPORTS.BOOKINGS_SUMMARY;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  getProductsSales: async (startDate, endDate, limit = 10) => {
    let url = `${API_ENDPOINTS.REPORTS.PRODUCTS_SALES}?limit=${limit}`;
    if (startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  getCourtsUsage: async (startDate, endDate) => {
    let url = API_ENDPOINTS.REPORTS.COURTS_USAGE;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await api.get(url);
    return response.data;
  },
};

// Attendance API
export const attendanceAPI = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.ATTENDANCE.LIST, { params });
    return response.data;
  },

  getMy: async (params) => {
    const response = await api.get(API_ENDPOINTS.ATTENDANCE.MY, { params });
    return response.data;
  },

  getToday: async () => {
    const response = await api.get(API_ENDPOINTS.ATTENDANCE.TODAY);
    return response.data;
  },

  clockIn: async (note = '') => {
    const response = await api.post(API_ENDPOINTS.ATTENDANCE.CLOCK_IN, { note });
    return response.data;
  },

  clockOut: async (note = '') => {
    const response = await api.post(API_ENDPOINTS.ATTENDANCE.CLOCK_OUT, { note });
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(API_ENDPOINTS.ATTENDANCE.UPDATE(id), data);
    return response.data;
  },

  getReport: async (params) => {
    const response = await api.get(API_ENDPOINTS.ATTENDANCE.REPORT, { params });
    return response.data;
  },
};

// Shifts API
export const shiftsAPI = {
  getAll: async (params) => {
    const response = await api.get(API_ENDPOINTS.SHIFTS.LIST, { params });
    return response.data;
  },

  getCurrent: async () => {
    const response = await api.get(API_ENDPOINTS.SHIFTS.CURRENT);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.SHIFTS.GET(id));
    return response.data;
  },

  open: async (openingCash) => {
    const response = await api.post(API_ENDPOINTS.SHIFTS.OPEN, { openingCash });
    return response.data;
  },

  addExpense: async (id, data) => {
    const response = await api.post(API_ENDPOINTS.SHIFTS.ADD_EXPENSE(id), data);
    return response.data;
  },

  removeExpense: async (id, expenseId) => {
    const response = await api.delete(API_ENDPOINTS.SHIFTS.REMOVE_EXPENSE(id, expenseId));
    return response.data;
  },

  close: async (id, data) => {
    const response = await api.post(API_ENDPOINTS.SHIFTS.CLOSE(id), data);
    return response.data;
  },

  getSummary: async (id) => {
    const response = await api.get(API_ENDPOINTS.SHIFTS.SUMMARY(id));
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(API_ENDPOINTS.SHIFTS.UPDATE(id), data);
    return response.data;
  },

  getReport: async (params) => {
    const response = await api.get(API_ENDPOINTS.SHIFTS.REPORT, { params });
    return response.data;
  },
};

// Recurring Bookings API
export const recurringBookingsAPI = {
  preview: async (data) => {
    const response = await api.post('/recurring-bookings/preview', data);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/recurring-bookings', data);
    return response.data;
  },

  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const url = `/recurring-bookings${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/recurring-bookings/${id}`);
    return response.data;
  },

  getBookingsInGroup: async (id) => {
    const response = await api.get(`/recurring-bookings/${id}/bookings`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.patch(`/recurring-bookings/${id}/cancel`);
    return response.data;
  },

  updatePayment: async (id, data) => {
    const response = await api.patch(`/recurring-bookings/${id}/payment`, data);
    return response.data;
  },
};

export default api;
