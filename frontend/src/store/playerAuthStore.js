import { create } from 'zustand';

const usePlayerAuthStore = create((set) => ({
  player: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize auth from localStorage
  initAuth: () => {
    const token = localStorage.getItem('playerToken');
    const playerStr = localStorage.getItem('player');

    if (token && playerStr) {
      try {
        const player = JSON.parse(playerStr);
        set({
          player,
          token,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to parse player data:', error);
        localStorage.removeItem('playerToken');
        localStorage.removeItem('player');
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  // Login
  login: (playerData, token) => {
    localStorage.setItem('playerToken', token);
    localStorage.setItem('player', JSON.stringify(playerData));
    set({
      player: playerData,
      token,
      isAuthenticated: true
    });
  },

  // Logout
  logout: () => {
    localStorage.removeItem('playerToken');
    localStorage.removeItem('player');
    set({
      player: null,
      token: null,
      isAuthenticated: false
    });
  },

  // Update player
  updatePlayer: (playerData) => {
    localStorage.setItem('player', JSON.stringify(playerData));
    set({ player: playerData });
  },
}));

export default usePlayerAuthStore;
