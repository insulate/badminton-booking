/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066CC',
          blue: '#0066CC',
          'light-blue': '#4D94FF',
          'dark-blue': '#004080',
          'sky': '#00AAFF',
          'navy': '#003366',
          dark: '#1A1A2E',
          light: '#F5F7FA',
        },
        bg: {
          dark: '#1E293B',
          darker: '#0F172A',
          cream: '#F8FAFC',
          'light-cream': '#FFFFFF',
          card: '#FFFFFF',
          sidebar: '#1E293B',
          'sidebar-hover': '#334155',
        },
        text: {
          primary: '#1E293B',
          secondary: '#475569',
          muted: '#64748B',
          light: '#FFFFFF',
        },
        accent: {
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B',
          info: '#3B82F6',
          purple: '#8B5CF6',
          blue: '#0EA5E9',
          red: '#F87171',
        },
      },
      fontFamily: {
        sans: ['Kanit', 'sans-serif'],
      },
      boxShadow: {
        blue: '0 0 20px rgba(0, 102, 204, 0.3)',
        'blue-lg': '0 0 30px rgba(0, 102, 204, 0.4)',
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 102, 204, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 102, 204, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
