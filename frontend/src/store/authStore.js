import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize auth from localStorage
  initAuth: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  // Login
  login: (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    set({
      user: userData,
      token,
      isAuthenticated: true
    });
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  },

  // Update user profile
  updateUser: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData });
  },
}));

export default useAuthStore;
