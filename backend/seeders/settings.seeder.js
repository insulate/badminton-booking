const mongoose = require('mongoose');
const Setting = require('../models/setting.model');
require('dotenv').config();

const defaultSettings = {
  venue: {
    name: 'ABC Badminton Club',
    address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
    phone: '02-123-4567',
    email: 'info@abcbadminton.com',
  },
  operating: {
    openTime: '06:00',
    closeTime: '22:00',
    daysOpen: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  },
  booking: {
    advanceBookingDays: 7,
    minBookingHours: 1,
    maxBookingHours: 3,
    cancellationHours: 24,
    requireDeposit: false,
    depositAmount: 0,
    depositPercentage: 0,
  },
  payment: {
    acceptCash: true,
    acceptTransfer: true,
    acceptCreditCard: false,
    acceptPromptPay: true,
    promptPayNumber: '',
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountName: '',
    },
  },
  general: {
    currency: 'THB',
    timezone: 'Asia/Bangkok',
    language: 'th',
  },
};

const seedSettings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/badminton-booking');
    console.log('✅ Connected to MongoDB');

    // Check if settings already exist
    const existingSettings = await Setting.findOne();

    if (existingSettings) {
      console.log('⚠️  Settings already exist. Skipping seed.');
      console.log('Current settings:', existingSettings.venue.name);
    } else {
      // Create default settings
      const settings = await Setting.create(defaultSettings);
      console.log('✅ Default settings created successfully!');
      console.log('Venue:', settings.venue.name);
      console.log('Operating Hours:', `${settings.operating.openTime} - ${settings.operating.closeTime}`);
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding settings:', error);
    process.exit(1);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedSettings();
}

module.exports = { seedSettings, defaultSettings };
