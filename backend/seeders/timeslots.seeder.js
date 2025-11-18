const mongoose = require('mongoose');
const TimeSlot = require('../models/timeslot.model');
const Setting = require('../models/setting.model');
require('dotenv').config();

const generateTimeslots = (openTime, closeTime) => {
  const timeslots = [];

  // Parse open and close times
  const openHour = parseInt(openTime.split(':')[0]);
  const closeHour = parseInt(closeTime.split(':')[0]);

  // Generate hours array based on operating hours
  const hours = Array.from({ length: closeHour - openHour }, (_, i) => i + openHour);

  const dayTypes = ['weekday', 'weekend'];

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

    // Get or create settings
    const settings = await Setting.getSettings();
    const { openTime, closeTime } = settings.operating;

    console.log(`Operating hours: ${openTime} - ${closeTime}`);

    // Clear existing timeslots
    await TimeSlot.deleteMany({});
    console.log('Cleared existing timeslots');

    // Generate and insert timeslots based on operating hours
    const timeslots = generateTimeslots(openTime, closeTime);
    const createdTimeslots = await TimeSlot.insertMany(timeslots);

    console.log(`\nCreated ${createdTimeslots.length} timeslots successfully`);
    console.log('\nBreakdown:');
    console.log(`- Weekday timeslots: ${createdTimeslots.filter((t) => t.dayType === 'weekday').length}`);
    console.log(`- Weekend timeslots: ${createdTimeslots.filter((t) => t.dayType === 'weekend').length}`);
    console.log(`- Peak hour slots: ${createdTimeslots.filter((t) => t.peakHour).length}`);

    console.log('\nSample timeslots:');
    const weekdaySlots = createdTimeslots.filter((t) => t.dayType === 'weekday');
    const weekendSlots = createdTimeslots.filter((t) => t.dayType === 'weekend');

    if (weekdaySlots.length > 0) {
      console.log('Weekday:');
      console.log(
        `  ${weekdaySlots[0].startTime}-${weekdaySlots[0].endTime}: ฿${weekdaySlots[0].pricing.normal} (Normal), ฿${weekdaySlots[0].pricing.member} (Member)`
      );
      const weekdayPeak = weekdaySlots.find((t) => t.peakHour);
      if (weekdayPeak) {
        console.log(
          `  ${weekdayPeak.startTime}-${weekdayPeak.endTime} (Peak): ฿${weekdayPeak.peakPricing.normal} (Normal), ฿${weekdayPeak.peakPricing.member} (Member)`
        );
      }
    }

    if (weekendSlots.length > 0) {
      console.log('\nWeekend:');
      console.log(
        `  ${weekendSlots[0].startTime}-${weekendSlots[0].endTime}: ฿${weekendSlots[0].pricing.normal} (Normal), ฿${weekendSlots[0].pricing.member} (Member)`
      );
      const weekendPeak = weekendSlots.find((t) => t.peakHour);
      if (weekendPeak) {
        console.log(
          `  ${weekendPeak.startTime}-${weekendPeak.endTime} (Peak): ฿${weekendPeak.peakPricing.normal} (Normal), ฿${weekendPeak.peakPricing.member} (Member)`
        );
      }
    }

    console.log('\n✅ TimeSlot seeding completed!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding timeslots:', error);
    process.exit(1);
  }
};

seedTimeslots();
