const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    clockIn: {
      time: {
        type: Date,
        default: null,
      },
      method: {
        type: String,
        enum: ['manual', 'system'],
        default: 'system',
      },
      note: {
        type: String,
        trim: true,
        default: '',
      },
      editedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      editedAt: {
        type: Date,
        default: null,
      },
    },
    clockOut: {
      time: {
        type: Date,
        default: null,
      },
      method: {
        type: String,
        enum: ['manual', 'system'],
        default: 'system',
      },
      note: {
        type: String,
        trim: true,
        default: '',
      },
      editedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      editedAt: {
        type: Date,
        default: null,
      },
    },
    totalHours: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: one attendance record per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Index for querying by date
attendanceSchema.index({ date: -1 });

// Pre-save hook to calculate total hours
attendanceSchema.pre('save', function (next) {
  if (this.clockIn?.time && this.clockOut?.time) {
    const diffMs = this.clockOut.time - this.clockIn.time;
    this.totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }
  next();
});

// Static method to get today's date (start of day)
attendanceSchema.statics.getToday = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Static method to find attendance by user and date
attendanceSchema.statics.findByUserAndDate = async function (userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  return this.findOne({
    user: userId,
    date: startOfDay,
  }).populate('user', 'name username');
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
