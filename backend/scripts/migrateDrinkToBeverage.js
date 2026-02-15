/**
 * Migration script: Rename product category 'drink' -> 'beverage'
 *
 * This fixes the mismatch between product.category ('drink') and
 * the Category collection name ('beverage').
 *
 * Usage: node scripts/migrateDrinkToBeverage.js
 */

const mongoose = require('mongoose');

async function migrate() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI ||
      'mongodb://admin:admin123@localhost:27017/badminton_db?authSource=admin';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Update all products with category 'drink' to 'beverage'
    const result = await db
      .collection('products')
      .updateMany({ category: 'drink' }, { $set: { category: 'beverage' } });

    console.log(`Updated ${result.modifiedCount} products from 'drink' to 'beverage'`);

    // Verify
    const remaining = await db
      .collection('products')
      .countDocuments({ category: 'drink' });
    console.log(`Remaining products with category 'drink': ${remaining}`);

    const beverageCount = await db
      .collection('products')
      .countDocuments({ category: 'beverage' });
    console.log(`Total products with category 'beverage': ${beverageCount}`);

    await mongoose.disconnect();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
