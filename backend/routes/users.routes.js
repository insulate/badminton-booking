const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  restoreUser
} = require('../controllers/user.controller');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect, admin);

// @route   GET /api/users
// @desc    Get all users (exclude soft deleted by default)
// @access  Private/Admin
// @query   ?includeDeleted=true to include soft deleted users
router.get('/', getAllUsers);

// @route   POST /api/users
// @desc    Create new user
// @access  Private/Admin
router.post('/', createUser);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', getUserById);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', updateUser);

// @route   DELETE /api/users/:id
// @desc    Soft delete user
// @access  Private/Admin
router.delete('/:id', deleteUser);

// @route   PATCH /api/users/:id/restore
// @desc    Restore soft deleted user
// @access  Private/Admin
router.patch('/:id/restore', restoreUser);

module.exports = router;
