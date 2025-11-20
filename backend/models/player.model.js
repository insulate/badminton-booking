const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getLevelName, isValidLevel } = require('../constants/playerLevels');

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'กรุณากรอกชื่อผู้เล่น'],
      trim: true,
      minlength: [2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'],
      maxlength: [100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร'],
    },
    phone: {
      type: String,
      required: [true, 'กรุณากรอกเบอร์โทรศัพท์'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Thai phone number format: 0812345678 or 081-234-5678
          return /^0\d{9}$|^0\d{2}-?\d{3}-?\d{4}$/.test(v.replace(/-/g, ''));
        },
        message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
      },
    },
    password: {
      type: String,
      select: false, // Don't return password by default
      minlength: [6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'],
    },
    level: {
      type: String,
      enum: {
        values: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        message: 'ระดับมือต้องอยู่ระหว่าง 0-10',
      },
      default: null,
    },
    levelName: {
      type: String,
      default: 'ไม่ระบุ',
    },
    stats: {
      totalGames: {
        type: Number,
        default: 0,
        min: [0, 'จำนวนเกมต้องไม่ติดลบ'],
      },
      totalSpent: {
        type: Number,
        default: 0,
        min: [0, 'ค่าใช้จ่ายต้องไม่ติดลบ'],
      },
      lastPlayed: {
        type: Date,
        default: null,
      },
    },
    notes: {
      type: String,
      maxlength: [500, 'หมายเหตุต้องไม่เกิน 500 ตัวอักษร'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: 'สถานะต้องเป็น active หรือ inactive',
      },
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Note: phone already has unique index from schema definition
playerSchema.index({ name: 1 });
playerSchema.index({ level: 1 });
playerSchema.index({ status: 1 });
playerSchema.index({ 'stats.totalGames': -1 });
playerSchema.index({ 'stats.totalSpent': -1 });

// Pre-save middleware to auto-generate levelName from level
playerSchema.pre('save', function (next) {
  if (this.level && this.isModified('level')) {
    this.levelName = getLevelName(this.level);
  }
  next();
});

// Pre-save middleware to hash password if provided
playerSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (this.password && this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare password
playerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update stats after game
playerSchema.methods.updateStats = function (gamesPlayed, amountSpent) {
  this.stats.totalGames += gamesPlayed;
  this.stats.totalSpent += amountSpent;
  this.stats.lastPlayed = new Date();
  return this.save();
};

// Virtual for display name with level
playerSchema.virtual('displayName').get(function () {
  return this.level ? `${this.name} (${this.levelName})` : this.name;
});

// Ensure virtuals are included in JSON
playerSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    delete ret.password; // Don't return password in JSON
    return ret;
  },
});

playerSchema.set('toObject', { virtuals: true });

// Static method to find active players
playerSchema.statics.findActive = function () {
  return this.find({ status: 'active' }).sort({ name: 1 });
};

// Static method to find players by level
playerSchema.statics.findByLevel = function (level) {
  return this.find({ level, status: 'active' }).sort({ name: 1 });
};

// Static method to find players by phone (for check-in search)
playerSchema.statics.findByPhone = function (phone) {
  const cleanPhone = phone.replace(/-/g, '');
  return this.findOne({ phone: { $regex: cleanPhone, $options: 'i' } });
};

// Static method to get top players by games played
playerSchema.statics.getTopPlayers = function (limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'stats.totalGames': -1 })
    .limit(limit);
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
