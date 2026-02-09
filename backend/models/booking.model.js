const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: [true, 'Please provide booking code'],
      unique: true,
      uppercase: true,
    },
    customer: {
      name: {
        type: String,
        required: [true, 'Please provide customer name'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Please provide customer phone'],
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },
    court: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Court',
      default: null,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      default: null,
    },
    bookingSource: {
      type: String,
      enum: {
        values: ['admin', 'customer'],
        message: '{VALUE} is not a valid booking source',
      },
      default: 'admin',
    },
    date: {
      type: Date,
      required: [true, 'Please provide booking date'],
    },
    timeSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeSlot',
      required: [true, 'Please provide time slot'],
    },
    duration: {
      type: Number,
      required: [true, 'Please provide duration'],
      min: [0.5, 'Duration must be at least 0.5 hours'],
      max: [8, 'Duration cannot exceed 8 hours'],
      default: 1,
      validate: {
        validator: function (v) {
          return v % 0.5 === 0;
        },
        message: 'Duration must be in increments of 0.5 hours',
      },
    },
    startMinute: {
      type: Number,
      enum: [0, 30],
      default: 0,
    },
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
      deposit: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'partial', 'paid'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'pending',
    },
    bookingStatus: {
      type: String,
      enum: {
        values: ['payment_pending', 'confirmed', 'checked-in', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'confirmed',
    },
    paymentDeadline: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'transfer', 'qr', 'card'],
        message: '{VALUE} is not a valid payment method',
      },
    },
    paymentSlip: {
      image: {
        type: String,
        default: '',
      },
      uploadedAt: {
        type: Date,
        default: null,
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      status: {
        type: String,
        enum: {
          values: ['none', 'pending_verification', 'verified', 'rejected'],
          message: '{VALUE} is not a valid slip status',
        },
        default: 'none',
      },
      rejectReason: {
        type: String,
        default: '',
      },
    },
    notes: {
      type: String,
      trim: true,
    },
    // Recurring booking fields
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringBookingGroup',
      default: null,
    },
    recurringSequence: {
      type: Number,
      default: null,
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

// Indexes for better query performance
// bookingCode already has unique index from schema definition
bookingSchema.index({ date: 1, court: 1 });
bookingSchema.index({ 'customer.phone': 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ deletedAt: 1 });
bookingSchema.index({ player: 1 });
bookingSchema.index({ bookingSource: 1 });
bookingSchema.index({ isRecurring: 1 });
bookingSchema.index({ recurringGroupId: 1 });

// Virtual for displaying date range
bookingSchema.virtual('dateRange').get(function () {
  if (!this.populated('timeSlot')) return null;
  return `${this.date.toLocaleDateString()} ${this.timeSlot.startTime}-${this.timeSlot.endTime}`;
});

// Soft delete method
bookingSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

// Cancel booking
bookingSchema.methods.cancel = function () {
  this.bookingStatus = 'cancelled';
  this.deletedAt = new Date();
  return this.save();
};

// Check-in
bookingSchema.methods.checkIn = function () {
  if (this.bookingStatus !== 'confirmed') {
    throw new Error('Can only check-in confirmed bookings');
  }
  this.bookingStatus = 'checked-in';
  return this.save();
};

// Check-out
bookingSchema.methods.checkOut = function () {
  if (this.bookingStatus !== 'checked-in') {
    throw new Error('Can only check-out checked-in bookings');
  }
  this.bookingStatus = 'completed';
  return this.save();
};

// Update payment
bookingSchema.methods.updatePayment = function (amountPaid) {
  // Validate amount is positive
  if (amountPaid < 0) {
    throw new Error('Payment amount must be positive');
  }

  const currentDeposit = this.pricing.deposit || 0;
  const totalPaid = currentDeposit + amountPaid;
  const remainingBalance = this.pricing.total - currentDeposit;

  // Prevent overpayment
  if (amountPaid > remainingBalance) {
    throw new Error(
      `Payment amount (${amountPaid}) exceeds remaining balance (${remainingBalance}). Total: ${this.pricing.total}, Already paid: ${currentDeposit}`
    );
  }

  // Update deposit and payment status
  if (totalPaid >= this.pricing.total) {
    this.paymentStatus = 'paid';
    this.pricing.deposit = this.pricing.total;
  } else if (totalPaid > 0) {
    this.paymentStatus = 'partial';
    this.pricing.deposit = totalPaid;
  } else {
    this.paymentStatus = 'pending';
  }

  return this.save();
};

// Static method to get bookings by date
bookingSchema.statics.getByDate = function (date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    deletedAt: null,
  })
    .populate('court', 'courtNumber name')
    .populate('timeSlot', 'startTime endTime')
    .sort({ date: 1, 'timeSlot.startTime': 1 });
};

// Static method to get daily schedule
bookingSchema.statics.getDailySchedule = function (date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    deletedAt: null,
    bookingStatus: { $ne: 'cancelled' },
  })
    .populate('court', 'courtNumber name type')
    .populate('timeSlot', 'startTime endTime peakHour')
    .sort({ 'court.courtNumber': 1, 'timeSlot.startTime': 1 });
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
