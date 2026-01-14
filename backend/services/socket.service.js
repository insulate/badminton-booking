/**
 * Socket.IO Service
 * จัดการ realtime notifications สำหรับ admin
 */

let io = null;

/**
 * Initialize Socket.IO with HTTP server
 * @param {http.Server} server - HTTP server instance
 * @param {Object} corsOptions - CORS configuration options
 */
const initSocket = (server, corsOptions) => {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin: corsOptions.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join admin room when admin connects
    socket.on('join-admin', () => {
      socket.join('admin-room');
      console.log(`[Socket] Admin joined: ${socket.id}`);
    });

    // Leave admin room
    socket.on('leave-admin', () => {
      socket.leave('admin-room');
      console.log(`[Socket] Admin left: ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Socket] Socket.IO initialized');
  return io;
};

/**
 * Get Socket.IO instance
 * @returns {Server|null} Socket.IO server instance
 */
const getIO = () => {
  return io;
};

/**
 * Emit event to admin room
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToAdmins = (event, data) => {
  if (io) {
    io.to('admin-room').emit(event, data);
    console.log(`[Socket] Emitted "${event}" to admin-room:`, data);
  }
};

/**
 * Notify admins about new booking
 * @param {Object} booking - Booking data
 */
const notifyNewBooking = (booking) => {
  emitToAdmins('new-booking', {
    type: 'new-booking',
    message: `การจองใหม่: ${booking.bookingCode}`,
    booking: {
      _id: booking._id,
      bookingCode: booking.bookingCode,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: booking.totalPrice,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
    },
    timestamp: new Date(),
  });
};

/**
 * Notify admins about slip upload
 * @param {Object} booking - Booking data with slip
 */
const notifySlipUploaded = (booking) => {
  emitToAdmins('slip-uploaded', {
    type: 'slip-uploaded',
    message: `สลิปใหม่: ${booking.bookingCode}`,
    booking: {
      _id: booking._id,
      bookingCode: booking.bookingCode,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      paymentSlip: booking.paymentSlip,
    },
    timestamp: new Date(),
  });
};

/**
 * Notify admins about booking cancellation
 * @param {Object} booking - Booking data
 */
const notifyBookingCancelled = (booking) => {
  emitToAdmins('booking-cancelled', {
    type: 'booking-cancelled',
    message: `การจองถูกยกเลิก: ${booking.bookingCode}`,
    booking: {
      _id: booking._id,
      bookingCode: booking.bookingCode,
      customerName: booking.customerName,
    },
    timestamp: new Date(),
  });
};

module.exports = {
  initSocket,
  getIO,
  emitToAdmins,
  notifyNewBooking,
  notifySlipUploaded,
  notifyBookingCancelled,
};
