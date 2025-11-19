const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../models/user.model');
const Court = require('../models/court.model');
const TimeSlot = require('../models/timeslot.model');
const Booking = require('../models/booking.model');
const Product = require('../models/product.model');
const Sale = require('../models/sale.model');
const Category = require('../models/category.model');
const Setting = require('../models/setting.model');
const Counter = require('../models/counter.model');
const Player = require('../models/player.model');
const GroupPlay = require('../models/groupplay.model');

const clearAllData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Clearing all data from database...\n');

    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      Court.deleteMany({}),
      TimeSlot.deleteMany({}),
      Booking.deleteMany({}),
      Product.deleteMany({}),
      Sale.deleteMany({}),
      Category.deleteMany({}),
      Setting.deleteMany({}),
      Counter.deleteMany({}),
      Player.deleteMany({}),
      GroupPlay.deleteMany({}),
    ]);

    console.log('✅ Users collection cleared');
    console.log('✅ Courts collection cleared');
    console.log('✅ TimeSlots collection cleared');
    console.log('✅ Bookings collection cleared');
    console.log('✅ Products collection cleared');
    console.log('✅ Sales collection cleared');
    console.log('✅ Categories collection cleared');
    console.log('✅ Settings collection cleared');
    console.log('✅ Counters collection cleared');
    console.log('✅ Players collection cleared');
    console.log('✅ GroupPlay collection cleared');

    console.log('\n🎉 All data cleared successfully!\n');

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    process.exit(1);
  }
};

// Run the seeder
clearAllData();
