/**
 * Script to fix Counter synchronization issue
 * This resets the booking counter to match the highest existing booking code
 *
 * Usage: node scripts/fixCounterSync.js
 */

const mongoose = require('mongoose');
const Booking = require('../models/booking.model');
const Counter = require('../models/counter.model');

async function fixCounterSync() {
  try {
    // Connect to database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/badminton_db?authSource=admin';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get today's date formatted as YYYYMMDD
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    console.log(`\nFixing counter for date: ${dateStr}`);

    // Find all bookings for today
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const todayBookings = await Booking.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).select('bookingCode');

    console.log(`Found ${todayBookings.length} bookings for today`);

    if (todayBookings.length === 0) {
      console.log('No bookings found for today. Counter will start from 1.');
      await Counter.resetCounter(`booking-BK${dateStr}`, 0);
    } else {
      // Extract sequence numbers from booking codes
      const sequences = todayBookings
        .map(b => {
          const match = b.bookingCode.match(/BK\d{8}(\d{4})$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);

      if (sequences.length === 0) {
        console.log('No valid booking codes found. Counter will start from 1.');
        await Counter.resetCounter(`booking-BK${dateStr}`, 0);
      } else {
        const maxSequence = Math.max(...sequences);
        console.log(`Highest booking sequence: ${maxSequence}`);
        console.log(`Latest booking codes:`, todayBookings.slice(0, 5).map(b => b.bookingCode));

        // Reset counter to max sequence so next booking will be maxSequence + 1
        await Counter.resetCounter(`booking-BK${dateStr}`, maxSequence);
        console.log(`✅ Counter reset to ${maxSequence}. Next booking will be BK${dateStr}${String(maxSequence + 1).padStart(4, '0')}`);
      }
    }

    console.log('\n✅ Counter synchronization completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing counter sync:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixCounterSync()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
