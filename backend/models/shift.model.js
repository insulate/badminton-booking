const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['ice', 'snack', 'supplies', 'other'],
      required: [true, 'Expense category is required'],
    },
    description: {
      type: String,
      required: [true, 'Expense description is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const shiftSchema = new mongoose.Schema(
  {
    shiftCode: {
      type: String,
      required: [true, 'Shift code is required'],
      unique: true,
      uppercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      default: null,
    },

    // Opening cash
    openingCash: {
      type: Number,
      required: [true, 'Opening cash amount is required'],
      min: [0, 'Opening cash cannot be negative'],
    },

    // Expenses during shift
    expenses: [expenseSchema],

    // Closing cash
    closingCash: {
      expected: {
        type: Number,
        default: 0,
      },
      actual: {
        type: Number,
        default: null,
      },
      difference: {
        type: Number,
        default: 0,
      },
    },

    // Closing non-cash (PromptPay, Transfer)
    closingNonCash: {
      expected: {
        type: Number,
        default: 0,
      },
      actual: {
        type: Number,
        default: null,
      },
      difference: {
        type: Number,
        default: 0,
      },
    },

    // Summary
    summary: {
      totalSales: {
        type: Number,
        default: 0,
      },
      cashSales: {
        type: Number,
        default: 0,
      },
      promptpaySales: {
        type: Number,
        default: 0,
      },
      transferSales: {
        type: Number,
        default: 0,
      },
      totalExpenses: {
        type: Number,
        default: 0,
      },
      totalChangeGiven: {
        type: Number,
        default: 0,
      },
    },

    closingNote: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (shiftCode index is auto-created by unique: true in schema)
shiftSchema.index({ user: 1, date: -1 });
shiftSchema.index({ status: 1 });
shiftSchema.index({ startTime: -1 });

// Virtual to calculate total expenses
shiftSchema.virtual('totalExpenses').get(function () {
  return this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
});

// Static method to find current open shift for a user
shiftSchema.statics.findOpenShift = async function (userId) {
  return this.findOne({
    user: userId,
    status: 'open',
  }).populate('user', 'name username');
};

// Static method to check if user has open shift
shiftSchema.statics.hasOpenShift = async function (userId) {
  const shift = await this.findOne({
    user: userId,
    status: 'open',
  });
  return !!shift;
};

// Method to calculate expected amounts
shiftSchema.methods.calculateExpected = function () {
  const totalExpenses = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Expected cash = opening + cash sales - change given - expenses
  this.closingCash.expected =
    this.openingCash +
    this.summary.cashSales -
    this.summary.totalChangeGiven -
    totalExpenses;

  // Expected non-cash = promptpay + transfer sales
  this.closingNonCash.expected =
    this.summary.promptpaySales + this.summary.transferSales;

  this.summary.totalExpenses = totalExpenses;
};

// Method to close shift
shiftSchema.methods.closeShift = function (actualCash, actualNonCash, note) {
  this.calculateExpected();

  this.closingCash.actual = actualCash;
  this.closingCash.difference = actualCash - this.closingCash.expected;

  this.closingNonCash.actual = actualNonCash;
  this.closingNonCash.difference = actualNonCash - this.closingNonCash.expected;

  this.closingNote = note || '';
  this.endTime = new Date();
  this.status = 'closed';
};

// Category labels for display
shiftSchema.statics.expenseCategories = {
  ice: 'ค่าน้ำแข็ง',
  snack: 'ค่าขนม',
  supplies: 'ค่าวัสดุสิ้นเปลือง',
  other: 'อื่นๆ',
};

const Shift = mongoose.model('Shift', shiftSchema);

module.exports = Shift;
