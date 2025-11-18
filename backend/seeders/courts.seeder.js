require('dotenv').config();
const mongoose = require('mongoose');
const Court = require('../models/court.model');

const courts = [
  {
    courtNumber: 'C01',
    name: 'Court 1',
    type: 'normal',
    status: 'available',
    description: 'สนามธรรมดา เหมาะสำหรับการเล่นทั่วไป',
    hourlyRate: {
      weekday: 150,
      weekend: 180,
      holiday: 200,
    },
  },
  {
    courtNumber: 'C02',
    name: 'Court 2',
    type: 'normal',
    status: 'available',
    description: 'สนามธรรมดา เหมาะสำหรับการเล่นทั่วไป',
    hourlyRate: {
      weekday: 150,
      weekend: 180,
      holiday: 200,
    },
  },
  {
    courtNumber: 'C03',
    name: 'Court 3',
    type: 'normal',
    status: 'available',
    description: 'สนามธรรมดา เหมาะสำหรับการเล่นทั่วไป',
    hourlyRate: {
      weekday: 150,
      weekend: 180,
      holiday: 200,
    },
  },
  {
    courtNumber: 'C04',
    name: 'Court Premium 1',
    type: 'premium',
    status: 'available',
    description: 'สนามพรีเมี่ยม มีระบบแสงสว่างและพื้นที่ดีกว่า',
    hourlyRate: {
      weekday: 200,
      weekend: 250,
      holiday: 300,
    },
  },
  {
    courtNumber: 'C05',
    name: 'Court Premium 2',
    type: 'premium',
    status: 'available',
    description: 'สนามพรีเมี่ยม มีระบบแสงสว่างและพื้นที่ดีกว่า',
    hourlyRate: {
      weekday: 200,
      weekend: 250,
      holiday: 300,
    },
  },
  {
    courtNumber: 'C06',
    name: 'Court Tournament',
    type: 'tournament',
    status: 'available',
    description: 'สนามมาตรฐานการแข่งขัน เหมาะสำหรับการจัดทัวร์นาเมนต์',
    hourlyRate: {
      weekday: 250,
      weekend: 300,
      holiday: 350,
    },
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
      console.log(
        `- ${court.courtNumber}: ${court.name} (${court.type}) - ${court.hourlyRate.weekday} บาท/ชม.`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding courts:', error);
    process.exit(1);
  }
};

seedCourts();
