require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const connectDB = require('./config/database');

const indexRouter = require('./routes/index.routes');
const usersRouter = require('./routes/users.routes');
const authRouter = require('./routes/auth.routes');
const settingsRouter = require('./routes/settings.routes');
const courtsRouter = require('./routes/courts.routes');
const timeslotsRouter = require('./routes/timeslots.routes');
const bookingsRouter = require('./routes/bookings.routes');
const productsRouter = require('./routes/products.routes');
const salesRouter = require('./routes/sales.routes');
const categoriesRouter = require('./routes/categories.routes');
const playersRouter = require('./routes/players.routes');
const groupplayRouter = require('./routes/groupplay.routes');
const reportsRouter = require('./routes/reports.routes');
const recurringBookingsRouter = require('./routes/recurringBookings.routes');
const attendanceRouter = require('./routes/attendance.routes');
const shiftsRouter = require('./routes/shifts.routes');

// Jobs
const { startCancelExpiredBookingsJob } = require('./jobs/cancelExpiredBookings');

const app = express();

// Connect to MongoDB
connectDB();

// Start background jobs (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  startCancelExpiredBookingsJob(1); // Check every 1 minute
}

// CORS Configuration
const corsOptions = {
  // Allow specific origins or use environment variable
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'https://badminton-booking.vercel.app',
      'https://badminton-booking-ivory.vercel.app'
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  // Allow credentials (cookies, authorization headers, etc.)
  credentials: true,
  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // Allowed headers
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  // Expose headers to the client
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  // Cache preflight requests for 24 hours
  maxAge: 86400,
  // Enable preflight for all routes
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.use(logger('dev'));
// Limit request body size to prevent DoS attacks
// 10mb for JSON (to allow product images in base64 if needed)
app.use(express.json({ limit: '10mb' }));
// 10mb for URL-encoded data
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/courts', courtsRouter);
app.use('/api/timeslots', timeslotsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/players', playersRouter);
app.use('/api/groupplay', groupplayRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/recurring-bookings', recurringBookingsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/shifts', shiftsRouter);

// Error handling
app.use((err, _req, res, _next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      status: err.status || 500
    }
  });
});

module.exports = app;
