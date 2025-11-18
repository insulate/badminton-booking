const mongoose = require('mongoose');

/**
 * Counter Schema for atomic increments
 * Used to generate unique sequential numbers (e.g., booking codes)
 */
const counterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    sequence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Get next sequence number atomically
 * @param {string} name - Counter name (e.g., 'booking-BK20250118')
 * @returns {Promise<number>} Next sequence number
 */
counterSchema.statics.getNextSequence = async function (name) {
  const counter = await this.findByIdAndUpdate(
    name,
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence;
};

/**
 * Reset counter to specific value
 * @param {string} name - Counter name
 * @param {number} value - Value to reset to (default: 0)
 */
counterSchema.statics.resetCounter = async function (name, value = 0) {
  await this.findByIdAndUpdate(
    name,
    { sequence: value },
    { upsert: true }
  );
};

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
