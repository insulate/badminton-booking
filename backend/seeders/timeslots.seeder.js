const mongoose = require('mongoose');
const TimeSlot = require('../models/timeslot.model');
require('dotenv').config();

const generateTimeslots = () => {
  const timeslots = [];
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6-21 (06:00-22:00)

  const dayTypes = ['weekday', 'weekend', 'holiday'];

  dayTypes.forEach((dayType) => {
    hours.forEach((hour) => {
      const startHour = hour.toString().padStart(2, '0');
      const endHour = (hour + 1).toString().padStart(2, '0');
      const startTime = `${startHour}:00`;
      const endTime = `${endHour}:00`;

      // Peak hours: 17:00-21:00 (5 PM - 9 PM)
      const isPeakHour = hour >= 17 && hour < 21;

      // Different pricing based on day type
      let pricing = {
        normal: 150,
        member: 120,
      };

      let peakPricing = {
        normal: 200,
        member: 170,
      };

      if (dayType === 'weekend') {
        pricing = {
          normal: 200,
          member: 160,
        };
        peakPricing = {
          normal: 250,
          member: 210,
        };
      } else if (dayType === 'holiday') {
        pricing = {
          normal: 250,
          member: 200,
        };
        peakPricing = {
          normal: 300,
          member: 250,
        };
      }

      timeslots.push({
        startTime,
        endTime,
        dayType,
        pricing,
        peakPricing,
        peakHour: isPeakHour,
        status: 'active',
      });
    });
  });

  return timeslots;
};

const seedTimeslots = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/badminton-system',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('MongoDB Connected');

    // Clear existing timeslots
    await TimeSlot.deleteMany({});
    console.log('Cleared existing timeslots');

    // Generate and insert timeslots
    const timeslots = generateTimeslots();
    const createdTimeslots = await TimeSlot.insertMany(timeslots);

    console.log(`\nCreated ${createdTimeslots.length} timeslots successfully`);
    console.log('\nBreakdown:');
    console.log(`- Weekday timeslots: ${createdTimeslots.filter((t) => t.dayType === 'weekday').length}`);
    console.log(`- Weekend timeslots: ${createdTimeslots.filter((t) => t.dayType === 'weekend').length}`);
    console.log(`- Holiday timeslots: ${createdTimeslots.filter((t) => t.dayType === 'holiday').length}`);
    console.log(`- Peak hour slots: ${createdTimeslots.filter((t) => t.peakHour).length}`);

    console.log('\nSample timeslots:');
    console.log('Weekday (Normal):');
    console.log(
      `  06:00-07:00: ฿${createdTimeslots.find((t) => t.dayType === 'weekday' && t.startTime === '06:00').pricing.normal}`
    );
    console.log(
      `  18:00-19:00 (Peak): ฿${createdTimeslots.find((t) => t.dayType === 'weekday' && t.startTime === '18:00').pricing.normal}`
    );
    console.log('\nWeekend (Normal):');
    console.log(
      `  06:00-07:00: ฿${createdTimeslots.find((t) => t.dayType === 'weekend' && t.startTime === '06:00').pricing.normal}`
    );
    console.log(
      `  18:00-19:00 (Peak): ฿${createdTimeslots.find((t) => t.dayType === 'weekend' && t.startTime === '18:00').pricing.normal}`
    );
    console.log('\nHoliday (Normal):');
    console.log(
      `  06:00-07:00: ฿${createdTimeslots.find((t) => t.dayType === 'holiday' && t.startTime === '06:00').pricing.normal}`
    );
    console.log(
      `  18:00-19:00 (Peak): ฿${createdTimeslots.find((t) => t.dayType === 'holiday' && t.startTime === '18:00').pricing.normal}`
    );

    console.log('\n✅ TimeSlot seeding completed!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding timeslots:', error);
    process.exit(1);
  }
};

seedTimeslots();
