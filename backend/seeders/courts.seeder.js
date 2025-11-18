require('dotenv').config();
const mongoose = require('mongoose');
const Court = require('../models/court.model');

const courts = [
  {
    courtNumber: 'C01',
    name: 'สนาม 1',
    status: 'available',
    description: 'สนามมาตรฐาน เหมาะสำหรับการเล่นทั่วไป',
  },
  {
    courtNumber: 'C02',
    name: 'สนาม 2',
    status: 'available',
    description: 'สนามมาตรฐาน เหมาะสำหรับการเล่นทั่วไป',
  },
  {
    courtNumber: 'C03',
    name: 'สนาม 3',
    status: 'available',
    description: 'สนามมาตรฐาน เหมาะสำหรับการเล่นทั่วไป',
  },
  {
    courtNumber: 'C04',
    name: 'สนาม 4',
    status: 'available',
    description: 'สนามมาตรฐาน พร้อมระบบแสงสว่างที่ดี',
  },
  {
    courtNumber: 'C05',
    name: 'สนาม 5',
    status: 'available',
    description: 'สนามมาตรฐาน พร้อมระบบแสงสว่างที่ดี',
  },
  {
    courtNumber: 'C06',
    name: 'สนาม 6',
    status: 'available',
    description: 'สนามมาตรฐานการแข่งขัน',
  },
];

const seedCourts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Clear existing courts
    await Court.deleteMany({});
    console.log('Existing courts cleared');

    // Insert courts
    const createdCourts = await Court.insertMany(courts);
    console.log(`${createdCourts.length} courts seeded successfully`);

    // Display created courts
    createdCourts.forEach((court) => {
      console.log(`- ${court.courtNumber}: ${court.name} - ${court.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding courts:', error);
    process.exit(1);
  }
};

seedCourts();
