const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    // ข้อมูลสนาม
    venue: {
      name: {
        type: String,
        required: true,
        default: 'Badminton Club',
      },
      address: {
        type: String,
        default: '',
      },
      phone: {
        type: String,
        default: '',
      },
      email: {
        type: String,
        default: '',
      },
      floorPlanImage: {
        type: String,
        default: '',
      },
    },

    // เวลาทำการ
    operating: {
      openTime: {
        type: String,
        required: true,
        default: '06:00',
        validate: {
          validator: function (v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Invalid time format. Use HH:MM (e.g., 06:00)',
        },
      },
      closeTime: {
        type: String,
        required: true,
        default: '22:00',
        validate: {
          validator: function (v) {
            // Accept 00:00-24:00 format (24:00 = midnight)
            return /^([0-1]?[0-9]|2[0-4]):[0-5][0-9]$/.test(v);
          },
          message: 'Invalid time format. Use HH:MM (e.g., 22:00 or 24:00 for midnight)',
        },
      },
      daysOpen: {
        type: [String],
        default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
    },

    // การตั้งค่าการจอง
    booking: {
      advanceBookingDays: {
        type: Number,
        default: 7,
        min: 1,
        max: 30,
      },
      minBookingHours: {
        type: Number,
        default: 1,
        min: 0.5,
      },
      maxBookingHours: {
        type: Number,
        default: 3,
        min: 1,
      },
      cancellationHours: {
        type: Number,
        default: 24,
        min: 0,
      },
      requireDeposit: {
        type: Boolean,
        default: false,
      },
      depositAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      depositPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      minimumAdvanceHours: {
        type: Number,
        default: 0, // 0 = ไม่จำกัด
        min: 0,
        max: 168, // สูงสุด 7 วัน
      },
      // วันปิดการจอง (เช่น วันจัดแข่งขัน)
      blockedDates: [
        {
          date: {
            type: Date,
            required: true,
          },
          reason: {
            type: String,
            default: '',
            maxlength: 200,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // วิธีการชำระเงิน
    payment: {
      acceptCash: {
        type: Boolean,
        default: true,
      },
      acceptTransfer: {
        type: Boolean,
        default: true,
      },
      acceptCreditCard: {
        type: Boolean,
        default: false,
      },
      acceptPromptPay: {
        type: Boolean,
        default: true,
      },
      promptPayNumber: {
        type: String,
        default: '',
      },
      bankAccount: {
        bankName: {
          type: String,
          default: '',
        },
        accountNumber: {
          type: String,
          default: '',
        },
        accountName: {
          type: String,
          default: '',
        },
      },
    },

    // การตั้งค่าอื่นๆ
    general: {
      currency: {
        type: String,
        default: 'THB',
      },
      timezone: {
        type: String,
        default: 'Asia/Bangkok',
      },
      language: {
        type: String,
        default: 'th',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Validation: closeTime must be after openTime
settingSchema.pre('save', function (next) {
  const openHour = parseInt(this.operating.openTime.split(':')[0]);
  const openMin = parseInt(this.operating.openTime.split(':')[1]);
  let closeHour = parseInt(this.operating.closeTime.split(':')[0]);
  const closeMin = parseInt(this.operating.closeTime.split(':')[1]);

  const openTimeInMin = openHour * 60 + openMin;
  // Treat 24:00 as end of day (24 * 60 = 1440 minutes)
  const closeTimeInMin = closeHour === 24 ? 1440 : closeHour * 60 + closeMin;

  if (closeTimeInMin <= openTimeInMin) {
    next(new Error('Close time must be after open time'));
  }

  next();
});

// Validation: maxBookingHours must be greater than minBookingHours
settingSchema.pre('save', function (next) {
  if (this.booking.maxBookingHours < this.booking.minBookingHours) {
    next(new Error('Maximum booking hours must be greater than minimum booking hours'));
  }
  next();
});

// Static method to get or create settings
settingSchema.statics.getSettings = async function () {
  let settings = await this.findOne();

  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({});
  }

  return settings;
};

module.exports = mongoose.model('Setting', settingSchema);
