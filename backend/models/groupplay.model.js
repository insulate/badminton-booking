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
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: [true, 'กรุณาเลือกสนาม'],
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
    courts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court',
      },
    ],
    daysOfWeek: {
      type: [String],
      enum: {
        values: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        message: 'วันในสัปดาห์ไม่ถูกต้อง',
      },
      required: [true, 'กรุณาเลือกวันในสัปดาห์'],
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'กรุณาเลือกอย่างน้อย 1 วัน'
      }
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
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'active', 'completed'],
        message: 'สถานะต้องเป็น scheduled, active, หรือ completed',
      },
      default: 'scheduled',
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
groupPlaySchema.index({ daysOfWeek: 1 });
groupPlaySchema.index({ courts: 1 });
groupPlaySchema.index({ isActive: 1 });
groupPlaySchema.index({ status: 1 });
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
  // Normalize phone number (remove dashes and spaces)
  const normalizedPhone = playerData.phone.replace(/[-\s]/g, '');

  // Check if player with this phone is already checked in and not checked out
  const existingPlayer = this.players.find(
    (p) =>
      p.phone.replace(/[-\s]/g, '') === normalizedPhone &&
      p.checkedIn &&
      !p.checkedOut
  );

  if (existingPlayer) {
    throw new Error('ผู้เล่นนี้เช็คอินแล้ว');
  }

  this.players.push({
    ...playerData,
    phone: normalizedPhone,
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
groupPlaySchema.methods.startGame = function (playerIds, courtId, teammates = [], opponents = []) {
  if (!courtId) {
    throw new Error('กรุณาเลือกสนาม');
  }

  const gameNumber = this.players.reduce((max, p) => Math.max(max, p.games.length), 0) + 1;

  playerIds.forEach((playerId) => {
    const player = this.players.id(playerId);
    if (player) {
      player.games.push({
        gameNumber,
        court: courtId,
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

// Method to update game players
groupPlaySchema.methods.updateGamePlayers = function (gameNumber, newPlayerIds) {
  // Find all players currently in this game
  const currentPlayers = [];
  this.players.forEach(p => {
    const playerGame = p.games.find(g => g.gameNumber === gameNumber && g.status === 'playing');
    if (playerGame) {
      currentPlayers.push({ player: p, game: playerGame });
    }
  });

  if (currentPlayers.length === 0) {
    throw new Error('ไม่พบเกมที่กำลังเล่น');
  }

  // Get game details from first player (court, startTime)
  const firstGame = currentPlayers[0].game;
  const courtId = firstGame.court;
  const startTime = firstGame.startTime;
  const teammates = firstGame.teammates;
  const opponents = firstGame.opponents;

  // Validate all new player IDs exist and are checked in
  const newPlayers = [];
  for (const playerId of newPlayerIds) {
    const player = this.players.id(playerId);
    if (!player) {
      throw new Error(`ไม่พบผู้เล่น ID: ${playerId}`);
    }
    if (!player.checkedIn || player.checkedOut) {
      throw new Error(`ผู้เล่น ${player.name} ยังไม่ได้ check-in หรือ check-out ไปแล้ว`);
    }
    // Check if player is in another active game
    const isPlayingOtherGame = player.games.some(
      g => g.status === 'playing' && g.gameNumber !== gameNumber
    );
    if (isPlayingOtherGame) {
      throw new Error(`ผู้เล่น ${player.name} กำลังเล่นอยู่ในเกมอื่น`);
    }
    newPlayers.push(player);
  }

  // Remove game from current players
  currentPlayers.forEach(({ player }) => {
    player.games = player.games.filter(g => g.gameNumber !== gameNumber);
  });

  // Add game to new players
  newPlayers.forEach(player => {
    player.games.push({
      gameNumber,
      court: courtId,
      teammates: teammates || [],
      opponents: opponents || [],
      status: 'playing',
      startTime,
      items: [],
      totalItemsCost: 0,
      costPerPlayer: 0,
    });
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

  // Find all players who have this game (by gameNumber and status = playing)
  const playersInGame = [];
  this.players.forEach(p => {
    const playerGame = p.games.find(g => g.gameNumber === gameNumber && g.status === 'playing');
    if (playerGame) {
      playersInGame.push(p);
    }
  });

  if (playersInGame.length === 0) {
    throw new Error('ไม่พบผู้เล่นในเกมนี้');
  }

  // Get total number of players in this game
  const totalPlayers = playersInGame.length;

  // Calculate cost per player
  const costPerPlayer = totalItemsCost / totalPlayers;

  const endTime = new Date();

  // Update all players in this game
  playersInGame.forEach(p => {
    const playerGame = p.games.find(g => g.gameNumber === gameNumber && g.status === 'playing');
    if (playerGame) {
      // Update game details
      playerGame.items = items;
      playerGame.totalItemsCost = totalItemsCost;
      playerGame.costPerPlayer = costPerPlayer;
      playerGame.status = 'finished';
      playerGame.endTime = endTime;

      // Update player total cost
      p.totalCost += costPerPlayer;
    }
  });

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

// Static method to find active group play rules
groupPlaySchema.statics.findActiveRules = function () {
  return this.find({ isActive: true })
    .populate('courts')
    .populate('createdBy', 'username')
    .sort({ sessionName: 1, startTime: 1 });
};

// Static method to check if a time slot is blocked by group play
groupPlaySchema.statics.isTimeSlotBlocked = async function (courtId, dayOfWeek, time) {
  const rules = await this.find({
    isActive: true,
    courts: courtId,
    daysOfWeek: dayOfWeek,
  });

  for (const rule of rules) {
    const [startHour, startMin] = rule.startTime.split(':').map(Number);
    const [endHour, endMin] = rule.endTime.split(':').map(Number);
    const [checkHour, checkMin] = time.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const checkMinutes = checkHour * 60 + checkMin;

    if (checkMinutes >= startMinutes && checkMinutes < endMinutes) {
      return true;
    }
  }

  return false;
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
