const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อหมวดหมู่'],
      trim: true,
      unique: true,
    },
    label: {
      type: String,
      required: [true, 'กรุณาระบุป้ายกำกับหมวดหมู่'],
      trim: true,
    },
    icon: {
      type: String,
      default: 'Package', // Lucide icon name
    },
    color: {
      type: String,
      default: 'gray', // Color for UI (blue, green, yellow, purple, gray)
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
// name already has unique index from schema definition
categorySchema.index({ isActive: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
