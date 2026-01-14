/**
 * Socket.IO Hook
 * จัดการ realtime connection สำหรับ admin notifications
 */

import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

// Socket URL (same as API but without /api)
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

/**
 * Custom hook for Socket.IO connection
 * @param {Object} options - Hook options
 * @param {Function} options.onNewBooking - Callback when new booking is created
 * @param {Function} options.onSlipUploaded - Callback when slip is uploaded
 * @param {Function} options.onBookingCancelled - Callback when booking is cancelled
 * @returns {Object} Socket state and methods
 */
const useSocket = ({ onNewBooking, onSlipUploaded, onBookingCancelled } = {}) => {
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useAuthStore();

  // Check if user is admin
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'staff');

  // Connect to socket
  useEffect(() => {
    // Only connect if user is admin
    if (!isAdmin) {
      return;
    }

    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      // Join admin room
      socket.emit('join-admin');
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.emit('leave-admin');
        socket.disconnect();
      }
    };
  }, [isAdmin]);

  // Register event listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isAdmin) return;

    // New booking event
    if (onNewBooking) {
      socket.on('new-booking', onNewBooking);
    }

    // Slip uploaded event
    if (onSlipUploaded) {
      socket.on('slip-uploaded', onSlipUploaded);
    }

    // Booking cancelled event
    if (onBookingCancelled) {
      socket.on('booking-cancelled', onBookingCancelled);
    }

    // Cleanup listeners
    return () => {
      if (onNewBooking) socket.off('new-booking', onNewBooking);
      if (onSlipUploaded) socket.off('slip-uploaded', onSlipUploaded);
      if (onBookingCancelled) socket.off('booking-cancelled', onBookingCancelled);
    };
  }, [isAdmin, onNewBooking, onSlipUploaded, onBookingCancelled]);

  // Manual emit method
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    emit,
  };
};

export default useSocket;
