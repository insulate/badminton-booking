const mongoose = require('mongoose');

// Sub-schema for game items (products used in a game)
const gameItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'จำนวนต้องมากกว่า 0'],
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'ราคาต้องไม่ติดลบ'],
  },
});

// Sub-schema for game details
const gameSchema = new mongoose.Schema({
  gameNumber: {
    type: Number,
    required: true,
    min: [1, 'เบอร์เกมต้องมากกว่า 0'],
  },
  teammates: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    },
  ],
  opponents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    },
  ],
  status: {
    type: String,
    enum: {
      values: ['playing', 'finished'],
      message: 'สถานะเกมต้องเป็น playing หรือ finished',
    },
    default: 'playing',
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  items: [gameItemSchema],
  totalItemsCost: {
    type: Number,
    default: 0,
    min: [0, 'ค่าสินค้ารวมต้องไม่ติดลบ'],
  },
  costPerPlayer: {
    type: Number,
    default: 0,
    min: [0, 'ค่าใช้จ่ายต่อคนต้องไม่ติดลบ'],
  },
});

// Sub-schema for session players
const sessionPlayerSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null, // null for walk-in players
  },
  name: {
    type: String,
    required: [true, 'กรุณากรอกชื่อผู้เล่น'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'กรุณากรอกเบอร์โทรศัพท์'],
    trim: true,
  },
  level: {
    type: String,
    enum: {
      values: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', null],
      message: 'ระดับมือต้องอยู่ระหว่าง 0-10',
    },
    default: null,
  },
  levelName: {
    type: String,
    default: 'ไม่ระบุ',
  },
  checkedIn: {
    type: Boolean,
    default: true,
  },
  checkInTime: {
    type: Date,
    default: Date.now,
  },
  entryFeePaid: {
    type: Boolean,
    default: false,
  },
  games: [gameSchema],
  totalCost: {
    type: Number,
    default: 0,
    min: [0, 'ค่าใช้จ่ายรวมต้องไม่ติดลบ'],
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['unpaid', 'paid'],
      message: 'สถานะการชำระเงินต้องเป็น unpaid หรือ paid',
    },
    default: 'unpaid',
  },
  checkedOut: {
    type: Boolean,
    default: false,
  },
  checkOutTime: {
    type: Date,
  },
});

// Main GroupPlay schema
const groupPlaySchema = new mongoose.Schema(
  {
    sessionName: {
      type: String,
      required: [true, 'กรุณากรอกชื่อ session'],
      trim: true,
      maxlength: [100, 'ชื่อ session ต้องไม่เกิน 100 ตัวอักษร'],
    },
    court: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Court',
      required: [true, 'กรุณาเลือกสนาม'],
    },
    date: {
      type: Date,
      required: [true, 'กรุณาเลือกวันที่'],
    },
    daysOfWeek: {
      type: [String],
      enum: {
        values: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        message: 'วันในสัปดาห์ไม่ถูกต้อง',
      },
      default: [],
    },
    startTime: {
      type: String,
      required: [true, 'กรุณากรอกเวลาเริ่ม'],
      validate: {
        validator: function (v) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: 'รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น HH:MM)',
      },
    },
    endTime: {
      type: String,
      required: [true, 'กรุณากรอกเวลาสิ้นสุด'],
      validate: {
        validator: function (v) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: 'รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น HH:MM)',
      },
    },
    entryFee: {
      type: Number,
      default: 30,
      min: [0, 'ค่าเข้าร่วมต้องไม่ติดลบ'],
    },
    players: [sessionPlayerSchema],
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'active', 'completed'],
        message: 'สถานะต้องเป็น scheduled, active, หรือ completed',
      },
      default: 'scheduled',
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
groupPlaySchema.index({ date: 1, court: 1 });
groupPlaySchema.index({ status: 1 });
groupPlaySchema.index({ court: 1 });
groupPlaySchema.index({ createdBy: 1 });
groupPlaySchema.index({ 'players.player': 1 });

// Validation: endTime must be after startTime
groupPlaySchema.pre('validate', function (next) {
  if (this.startTime && this.endTime) {
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      this.invalidate('endTime', 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม');
    }
  }
  next();
});

// Method to check in a player
groupPlaySchema.methods.checkInPlayer = function (playerData) {
  this.players.push({
    ...playerData,
    checkedIn: true,
    checkInTime: new Date(),
    entryFeePaid: false,
    totalCost: this.entryFee,
  });
  return this.save();
};

// Method to mark entry fee as paid
groupPlaySchema.methods.markEntryFeePaid = function (playerId) {
  const player = this.players.id(playerId);
  if (player) {
    player.entryFeePaid = true;
  }
  return this.save();
};

// Method to start a new game
groupPlaySchema.methods.startGame = function (playerIds, teammates, opponents) {
  const gameNumber = this.players.reduce((max, p) => Math.max(max, p.games.length), 0) + 1;

  playerIds.forEach((playerId) => {
    const player = this.players.id(playerId);
    if (player) {
      player.games.push({
        gameNumber,
        teammates: teammates.filter((id) => id !== playerId.toString()),
        opponents,
        status: 'playing',
        startTime: new Date(),
        items: [],
        totalItemsCost: 0,
        costPerPlayer: 0,
      });
    }
  });

  return this.save();
};

// Method to finish a game and add items
groupPlaySchema.methods.finishGame = function (playerId, gameNumber, items) {
  const player = this.players.id(playerId);
  if (!player) {
    throw new Error('ไม่พบผู้เล่น');
  }

  const game = player.games.find((g) => g.gameNumber === gameNumber);
  if (!game) {
    throw new Error('ไม่พบเกม');
  }

  // Calculate total items cost
  const totalItemsCost = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Get total number of players in this game
  const totalPlayers = 1 + game.teammates.length + game.opponents.length;

  // Calculate cost per player
  const costPerPlayer = totalItemsCost / totalPlayers;

  // Update game
  game.items = items;
  game.totalItemsCost = totalItemsCost;
  game.costPerPlayer = costPerPlayer;
  game.status = 'finished';
  game.endTime = new Date();

  // Update player total cost
  player.totalCost += costPerPlayer;

  return this.save();
};

// Method to check out a player
groupPlaySchema.methods.checkOutPlayer = function (playerId) {
  const player = this.players.id(playerId);
  if (!player) {
    throw new Error('ไม่พบผู้เล่น');
  }

  player.paymentStatus = 'paid';
  player.checkedOut = true;
  player.checkOutTime = new Date();

  return this.save();
};

// Method to get session summary
groupPlaySchema.methods.getSessionSummary = function () {
  const totalPlayers = this.players.length;
  const checkedInPlayers = this.players.filter((p) => p.checkedIn).length;
  const paidPlayers = this.players.filter((p) => p.entryFeePaid).length;
  const checkedOutPlayers = this.players.filter((p) => p.checkedOut).length;
  const totalGames = this.players.reduce((sum, p) => sum + p.games.length, 0);
  const activeGames = this.players.reduce((sum, p) => sum + p.games.filter((g) => g.status === 'playing').length, 0);
  const totalRevenue = this.players.reduce((sum, p) => (p.paymentStatus === 'paid' ? sum + p.totalCost : sum), 0);

  return {
    totalPlayers,
    checkedInPlayers,
    paidPlayers,
    checkedOutPlayers,
    totalGames,
    activeGames,
    totalRevenue,
  };
};

// Static method to find sessions by date range
groupPlaySchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .populate('court')
    .populate('createdBy', 'username')
    .sort({ date: 1, startTime: 1 });
};

// Static method to find active sessions
groupPlaySchema.statics.findActive = function () {
  return this.find({ status: { $in: ['scheduled', 'active'] } })
    .populate('court')
    .populate('createdBy', 'username')
    .sort({ date: 1, startTime: 1 });
};

// Virtual for total revenue
groupPlaySchema.virtual('totalRevenue').get(function () {
  return this.players.reduce((sum, p) => (p.paymentStatus === 'paid' ? sum + p.totalCost : sum), 0);
});

// Ensure virtuals are included in JSON
groupPlaySchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

groupPlaySchema.set('toObject', { virtuals: true });

const GroupPlay = mongoose.model('GroupPlay', groupPlaySchema);

module.exports = GroupPlay;
