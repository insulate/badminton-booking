const mongoose = require('mongoose');

const recurringBookingGroupSchema = new mongoose.Schema(
  {
    groupCode: {
      type: String,
      required: [true, 'Please provide group code'],
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
    pattern: {
      daysOfWeek: {
        type: [Number],
        required: [true, 'Please provide days of week'],
        validate: {
          validator: function (arr) {
            return (
              arr.length > 0 &&
              arr.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
            );
          },
          message: 'Days of week must be numbers between 0 (Sunday) and 6 (Saturday)',
        },
      },
      timeSlot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TimeSlot',
        required: [true, 'Please provide time slot'],
      },
      duration: {
        type: Number,
        required: [true, 'Please provide duration'],
        min: [1, 'Duration must be at least 1 hour'],
        max: [8, 'Duration cannot exceed 8 hours'],
        default: 1,
      },
      court: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court',
        required: [true, 'Please provide court'],
      },
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide end date'],
    },
    paymentMode: {
      type: String,
      enum: {
        values: ['bulk', 'per_session'],
        message: '{VALUE} is not a valid payment mode',
      },
      default: 'per_session',
    },
    bulkPayment: {
      totalAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      paidAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      paymentStatus: {
        type: String,
        enum: {
          values: ['pending', 'partial', 'paid'],
          message: '{VALUE} is not a valid payment status',
        },
        default: 'pending',
      },
      paymentMethod: {
        type: String,
        enum: {
          values: ['cash', 'bank_transfer', 'promptpay', 'transfer', 'qr', 'card'],
          message: '{VALUE} is not a valid payment method',
        },
      },
    },
    totalBookings: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedBookings: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancelledBookings: {
      type: Number,
      default: 0,
      min: 0,
    },
    skippedDates: [
      {
        date: {
          type: Date,
          required: true,
        },
        reason: {
          type: String,
          enum: ['blocked', 'conflict', 'holiday'],
          required: true,
        },
        detail: {
          type: String,
        },
      },
    ],
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide creator'],
    },
    notes: {
      type: String,
      trim: true,
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

// Indexes
recurringBookingGroupSchema.index({ groupCode: 1 });
recurringBookingGroupSchema.index({ 'customer.phone': 1 });
recurringBookingGroupSchema.index({ status: 1 });
recurringBookingGroupSchema.index({ createdBy: 1 });
recurringBookingGroupSchema.index({ deletedAt: 1 });
recurringBookingGroupSchema.index({ startDate: 1, endDate: 1 });

// Virtual for days of week display
recurringBookingGroupSchema.virtual('daysOfWeekDisplay').get(function () {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return this.pattern.daysOfWeek.map((day) => dayNames[day]).join(', ');
});

// Soft delete method
recurringBookingGroupSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

// Cancel group
recurringBookingGroupSchema.methods.cancel = function () {
  this.status = 'cancelled';
  return this.save();
};

// Update bulk payment
recurringBookingGroupSchema.methods.updateBulkPayment = function (amountPaid, paymentMethod) {
  if (this.paymentMode !== 'bulk') {
    throw new Error('Cannot update bulk payment for per_session payment mode');
  }

  if (amountPaid < 0) {
    throw new Error('Payment amount must be positive');
  }

  const currentPaid = this.bulkPayment.paidAmount || 0;
  const totalPaid = currentPaid + amountPaid;
  const remainingBalance = this.bulkPayment.totalAmount - currentPaid;

  if (amountPaid > remainingBalance) {
    throw new Error(
      `Payment amount (${amountPaid}) exceeds remaining balance (${remainingBalance})`
    );
  }

  this.bulkPayment.paidAmount = totalPaid;
  if (paymentMethod) {
    this.bulkPayment.paymentMethod = paymentMethod;
  }

  if (totalPaid >= this.bulkPayment.totalAmount) {
    this.bulkPayment.paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    this.bulkPayment.paymentStatus = 'partial';
  }

  return this.save();
};

// Static method to get active groups
recurringBookingGroupSchema.statics.getActiveGroups = function () {
  return this.find({
    status: 'active',
    deletedAt: null,
  })
    .populate('pattern.court', 'courtNumber name')
    .populate('pattern.timeSlot', 'startTime endTime')
    .populate('createdBy', 'username')
    .sort({ createdAt: -1 });
};

// Static method to find groups by customer phone
recurringBookingGroupSchema.statics.findByCustomerPhone = function (phone) {
  return this.find({
    'customer.phone': phone,
    deletedAt: null,
  })
    .populate('pattern.court', 'courtNumber name')
    .populate('pattern.timeSlot', 'startTime endTime')
    .sort({ createdAt: -1 });
};

const RecurringBookingGroup = mongoose.model(
  'RecurringBookingGroup',
  recurringBookingGroupSchema
);

module.exports = RecurringBookingGroup;
