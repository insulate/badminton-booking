require('dotenv').config();
const mongoose = require('mongoose');
const Player = require('../models/player.model');
const connectDB = require('../config/database');

const players = [
  {
    name: 'สมชาย ใจดี',
    phone: '0812345678',
    level: '0',
    notes: 'มือใหม่ พึ่งเริ่มเล่น',
  },
  {
    name: 'สมหญิง รักสนุก',
    phone: '0823456789',
    level: '1',
    notes: 'เล่นเพื่อสุขภาพ',
  },
  {
    name: 'ปรีชา วิ่งเร็ว',
    phone: '0834567890',
    level: '2',
    notes: 'เริ่มเล่นได้ดีขึ้น',
  },
  {
    name: 'สมศักดิ์ สม้าชเนียร',
    phone: '0845678901',
    level: '3',
    notes: 'เล่นได้คล่อง',
  },
  {
    name: 'วิชัย มือแม่น',
    phone: '0856789012',
    level: '4',
    notes: 'มีเทคนิคดี',
  },
  {
    name: 'ธนพล เข้มแข็ง',
    phone: '0867890123',
    level: '5',
    notes: 'เล่นได้ดีมาก',
  },
  {
    name: 'อนุชา ฉับไว',
    phone: '0878901234',
    level: '6',
    notes: 'นักกีฬาระดับดี',
  },
  {
    name: 'ชัยชนะ เด็ดเดี่ยว',
    phone: '0889012345',
    level: '7',
    notes: 'ระดับสูง',
  },
  {
    name: 'พงษ์ศักดิ์ แข็งแกร่ง',
    phone: '0890123456',
    level: '8',
    notes: 'เคยแข่งระดับจังหวัด',
  },
  {
    name: 'กิตติศักดิ์ ชนะเลิศ',
    phone: '0801234567',
    level: '9',
    notes: 'เคยแข่งระดับภาค',
  },
  {
    name: 'ณัฐพงษ์ โปรเฟสชั่นแนล',
    phone: '0891234567',
    level: '10',
    notes: 'นักกีฬาทีมชาติ',
  },
  {
    name: 'มานี เพื่อนดี',
    phone: '0881234567',
    level: '3',
    notes: 'เพื่อนสนิท',
  },
  {
    name: 'สุภาพร ยิ้มสวย',
    phone: '0871234567',
    level: '4',
    notes: 'ชอบเล่นเดี่ยว',
  },
  {
    name: 'ธีรพงษ์ แกร่งมาก',
    phone: '0861234567',
    level: '5',
    notes: 'เล่นคู่เก่ง',
  },
  {
    name: 'วรรณา สวยสด',
    phone: '0851234567',
    level: '2',
    notes: 'ชอบซ้อมเย็นๆ',
  },
];

const seedPlayers = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing players...');
    await Player.deleteMany({});

    console.log('🌱 Seeding players...');
    const createdPlayers = await Player.create(players);

    console.log(`✅ Successfully seeded ${createdPlayers.length} players!`);
    console.log('\n📊 Player Levels:');

    // Group by level
    const grouped = createdPlayers.reduce((acc, player) => {
      const level = player.level || 'ไม่ระบุ';
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(player);
      return acc;
    }, {});

    Object.keys(grouped)
      .sort()
      .forEach((level) => {
        const levelPlayers = grouped[level];
        const levelName = levelPlayers[0].levelName;
        console.log(`   Level ${level} (${levelName}): ${levelPlayers.length} players`);
      });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding players:', error);
    process.exit(1);
  }
};

// Run seeder
seedPlayers();
