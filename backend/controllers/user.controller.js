const UserModel = require('../models/user.model');

// @desc    Get all users (exclude soft deleted)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { includeDeleted } = req.query;

    // Build query - exclude soft deleted by default
    const query = includeDeleted === 'true' ? {} : { deletedAt: null };

    const users = await UserModel.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is soft deleted
    if (user.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'User has been deleted'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);

    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    // Validate input
    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, password, and name'
      });
    }

    // Check if user already exists
    const userExists = await UserModel.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this username'
      });
    }

    // Create user
    const user = await UserModel.create({
      username,
      password,
      name,
      role: role || 'user'
    });

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { name, role, username } = req.body;

    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is soft deleted
    if (user.deletedAt) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update deleted user. Please restore first.'
      });
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const usernameExists = await UserModel.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
      user.username = username;
    }

    // Update fields
    if (name) user.name = name;
    if (role) user.role = role;

    await user.save();

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);

    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Soft delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already deleted
    if (user.deletedAt) {
      return res.status(400).json({
        success: false,
        message: 'User is already deleted'
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete - set deletedAt timestamp
    user.deletedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        _id: user._id,
        username: user.username,
        deletedAt: user.deletedAt
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);

    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Restore soft deleted user
// @route   PATCH /api/users/:id/restore
// @access  Private/Admin
const restoreUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is not deleted
    if (!user.deletedAt) {
      return res.status(400).json({
        success: false,
        message: 'User is not deleted'
      });
    }

    // Restore user - remove deletedAt
    user.deletedAt = null;
    await user.save();

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'User restored successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Restore user error:', error);

    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  restoreUser
};
