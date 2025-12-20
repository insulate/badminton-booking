const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    saleCode: {
      type: String,
      required: [true, 'Sale code is required'],
      unique: true,
      uppercase: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: [true, 'Product is required'],
        },
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity must be at least 1'],
        },
        price: {
          type: Number,
          required: [true, 'Price is required'],
          min: [0, 'Price cannot be negative'],
        },
        subtotal: {
          type: Number,
          required: [true, 'Subtotal is required'],
          min: [0, 'Subtotal cannot be negative'],
        },
      },
    ],
    customer: {
      type: {
        type: String,
        enum: ['member', 'walk-in'],
        default: 'walk-in',
      },
      name: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'promptpay', 'transfer', 'credit_card'],
      required: [true, 'Payment method is required'],
      default: 'cash',
    },
    receivedAmount: {
      type: Number,
      min: [0, 'Received amount cannot be negative'],
      default: null,
    },
    changeAmount: {
      type: Number,
      min: [0, 'Change amount cannot be negative'],
      default: null,
    },
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
// saleCode already has unique index from schema definition
saleSchema.index({ createdAt: -1 });
saleSchema.index({ relatedBooking: 1 });

// Pre-save hook to calculate total
saleSchema.pre('save', function (next) {
  if (this.isModified('items')) {
    this.total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }
  next();
});

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
