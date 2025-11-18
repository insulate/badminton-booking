const mongoose = require('mongoose');

/**
 * Middleware to validate MongoDB ObjectId parameters
 * Prevents CastError by checking ObjectId validity before querying
 *
 * @param {string} paramName - Name of the route parameter to validate (default: 'id')
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return res.status(400).json({
        success: false,
        message: `${paramName} parameter is required`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }

    next();
  };
};

module.exports = validateObjectId;
