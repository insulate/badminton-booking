const mongoose = require('mongoose');
const User = require('../models/user.model');
require('dotenv').config();

const users = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'ผู้ดูแลระบบ',
    role: 'admin',
  },
  {
    username: 'user1',
    password: 'user123',
    name: 'ผู้ใช้งาน 1',
    role: 'user',
  },
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/badminton-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Insert users
    const createdUsers = await User.create(users);
    console.log(`Created ${createdUsers.length} users successfully`);

    // Display created users
    createdUsers.forEach((user) => {
      console.log(`- ${user.role}: ${user.username} (${user.name})`);
    });

    console.log('\n✅ User seeding completed!');
    console.log('\nLogin credentials:');
    console.log('Admin: username=admin, password=admin123');
    console.log('User: username=user1, password=user123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
