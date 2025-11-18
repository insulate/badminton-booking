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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = ROUTES.LOGIN;
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
};

export default api;
