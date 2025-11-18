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

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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
