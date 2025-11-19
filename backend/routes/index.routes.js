var express = require('express');
var router = express.Router();

// API root endpoint - returns API info and available endpoints
router.all('/', function(req, res) {
  res.json({
    success: true,
    message: 'Badminton Court Booking System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      bookings: '/api/bookings',
      courts: '/api/courts',
      timeslots: '/api/timeslots',
      products: '/api/products',
      sales: '/api/sales',
      categories: '/api/categories',
      players: '/api/players',
      groupplay: '/api/groupplay',
      settings: '/api/settings'
    }
  });
});

module.exports = router;
