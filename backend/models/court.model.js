const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema(
  {
    courtNumber: {
      type: String,
      required: [true, 'กรุณาระบุรหัสสนาม'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'กรุณาระบุชื่อสนาม'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['normal', 'premium', 'vip'],
        message: 'ประเภทสนามต้องเป็น normal, premium หรือ vip',
      },
      default: 'normal',
    },
    status: {
      type: String,
      required: [true, 'กรุณาระบุสถานะสนาม'],
      enum: {
        values: ['available', 'maintenance', 'inactive'],
        message: 'สถานะสนามต้องเป็น available, maintenance หรือ inactive',
      },
      default: 'available',
    },
    description: {
      type: String,
      default: '',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
courtSchema.index({ courtNumber: 1 });
courtSchema.index({ status: 1 });
courtSchema.index({ type: 1 });
courtSchema.index({ deletedAt: 1 });

// Query helper to exclude soft-deleted documents
courtSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

// Static method to get all active courts
courtSchema.statics.getActiveCourts = async function (filters = {}) {
  return this.find({ ...filters, deletedAt: null }).sort({ courtNumber: 1 });
};

// Instance method to soft delete
courtSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return this.save();
};

// Instance method to restore
courtSchema.methods.restore = async function () {
  this.deletedAt = null;
  return this.save();
};

const Court = mongoose.model('Court', courtSchema);

module.exports = Court;
