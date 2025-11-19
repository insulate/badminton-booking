require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/category.model');

const categories = [
  {
    name: 'shuttlecock',
    label: 'ลูกแบด',
    color: '#3B82F6', // blue
    order: 1,
    isActive: true,
  },
  {
    name: 'drink',
    label: 'เครื่องดื่ม',
    color: '#10B981', // green
    order: 2,
    isActive: true,
  },
  {
    name: 'snack',
    label: 'ขนม',
    color: '#F59E0B', // amber/yellow
    order: 3,
    isActive: true,
  },
  {
    name: 'equipment',
    label: 'อุปกรณ์',
    color: '#8B5CF6', // purple
    order: 4,
    isActive: true,
  },
  {
    name: 'other',
    label: 'อื่นๆ',
    color: '#6B7280', // gray
    order: 5,
    isActive: true,
  },
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/badminton-system');
    console.log('Connected to MongoDB');

    // Drop the entire collection to remove old indexes
    try {
      await mongoose.connection.db.collection('categories').drop();
      console.log('Dropped existing categories collection');
    } catch (error) {
      console.log('No existing categories collection to drop');
    }

    // Insert new categories
    const result = await Category.insertMany(categories);
    console.log(`Successfully seeded ${result.length} categories`);

    // Display results
    result.forEach((category) => {
      console.log(`- ${category.label} (${category.name})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
