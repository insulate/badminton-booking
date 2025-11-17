require('dotenv').config();
const mongoose = require('mongoose');
const UserModel = require('../models/user.model');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      console.log('   Username: admin');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user
    const admin = await UserModel.create({
      username: 'admin',
      password: 'admin123',
      name: 'Administrator',
      role: 'admin'
    });

    console.log('\n✓ Admin user created successfully!');
    console.log('=====================================');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('=====================================');
    console.log('\n⚠️  Please change the password after first login!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
