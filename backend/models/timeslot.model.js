const mongoose = require('mongoose');

const timeslotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: [true, 'Please provide start time'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'],
    },
    endTime: {
      type: String,
      required: [true, 'Please provide end time'],
      match: [/^(([0-1]?[0-9]|2[0-3]):[0-5][0-9]|24:00)$/, 'End time must be in HH:MM format'],
    },
    dayType: {
      type: String,
      enum: ['weekday', 'weekend'],
      required: [true, 'Please provide day type'],
    },
    pricing: {
      normal: {
        type: Number,
        required: [true, 'Please provide normal price'],
        min: [0, 'Price cannot be negative'],
        default: 150,
      },
      member: {
        type: Number,
        required: [true, 'Please provide member price'],
        min: [0, 'Price cannot be negative'],
        default: 120,
      },
    },
    peakPricing: {
      normal: {
        type: Number,
        min: [0, 'Price cannot be negative'],
        default: 200,
      },
      member: {
        type: Number,
        min: [0, 'Price cannot be negative'],
        default: 170,
      },
    },
    peakHour: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
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

// Index for queries
timeslotSchema.index({ dayType: 1, startTime: 1 });
timeslotSchema.index({ status: 1 });
timeslotSchema.index({ deletedAt: 1 });

// Validation: endTime must be after startTime
timeslotSchema.pre('save', function (next) {
  const start = this.startTime.split(':');
  const end = this.endTime.split(':');
  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);

  if (endMinutes <= startMinutes) {
    return next(new Error('End time must be after start time'));
  }

  next();
});

// Static method to get active timeslots
timeslotSchema.statics.getActiveTimeslots = function (dayType = null) {
  const query = { deletedAt: null, status: 'active' };
  if (dayType) {
    query.dayType = dayType;
  }
  return this.find(query).sort({ startTime: 1 });
};

// Instance method for soft delete
timeslotSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

// Instance method to restore
timeslotSchema.methods.restore = function () {
  this.deletedAt = null;
  return this.save();
};

// Method to check if timeslot overlaps with another
timeslotSchema.methods.overlaps = function (otherTimeslot) {
  if (this.dayType !== otherTimeslot.dayType) {
    return false;
  }

  const thisStart = this.startTime.split(':');
  const thisEnd = this.endTime.split(':');
  const otherStart = otherTimeslot.startTime.split(':');
  const otherEnd = otherTimeslot.endTime.split(':');

  const thisStartMinutes = parseInt(thisStart[0]) * 60 + parseInt(thisStart[1]);
  const thisEndMinutes = parseInt(thisEnd[0]) * 60 + parseInt(thisEnd[1]);
  const otherStartMinutes = parseInt(otherStart[0]) * 60 + parseInt(otherStart[1]);
  const otherEndMinutes = parseInt(otherEnd[0]) * 60 + parseInt(otherEnd[1]);

  return (
    (thisStartMinutes < otherEndMinutes && thisEndMinutes > otherStartMinutes) ||
    (otherStartMinutes < thisEndMinutes && otherEndMinutes > thisStartMinutes)
  );
};

const TimeSlot = mongoose.model('TimeSlot', timeslotSchema);

module.exports = TimeSlot;
