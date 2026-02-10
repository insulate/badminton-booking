// Shared test setup utilities
// Usage: const { setupTestEnv, waitForDB, generateToken, createTestAdmin, createTestUser, cleanupAndDisconnect } = require('./helpers/testSetup');

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');

/**
 * Setup test environment variables
 * Call this at the top of each test file, BEFORE any imports
 */
const setupTestEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://admin:admin123@localhost:27017/badminton_test?authSource=admin';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'badminton_secret_key_for_development_only_change_in_production';
};

/**
 * Wait for mongoose connection to be ready
 */
const waitForDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
    });
  }
};

/**
 * Generate JWT token for testing
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

/**
 * Create a test admin user and return { user, token }
 */
const createTestAdmin = async (overrides = {}) => {
  const user = await User.create({
    username: overrides.username || 'testadmin',
    password: overrides.password || 'Admin123!',
    name: overrides.name || 'Test Admin',
    role: 'admin',
  });
  const token = generateToken(user._id);
  return { user, token };
};

/**
 * Create a test regular user and return { user, token }
 */
const createTestUser = async (overrides = {}) => {
  const user = await User.create({
    username: overrides.username || 'testuser',
    password: overrides.password || 'User123!',
    name: overrides.name || 'Test User',
    role: 'user',
  });
  const token = generateToken(user._id);
  return { user, token };
};

/**
 * Cleanup collections and disconnect
 */
const cleanupAndDisconnect = async (models = []) => {
  for (const Model of models) {
    await Model.deleteMany({});
  }
  await mongoose.connection.close();
};

/**
 * Format date to YYYY-MM-DD string
 */
const formatDateToString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

module.exports = {
  setupTestEnv,
  waitForDB,
  generateToken,
  createTestAdmin,
  createTestUser,
  cleanupAndDisconnect,
  formatDateToString,
};
