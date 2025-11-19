/**
 * Script to fix GroupPlay indexes
 * Drops the problematic compound index and ensures correct individual indexes exist
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/badminton-system';

async function fixGroupPlayIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    const db = mongoose.connection.db;
    const collection = db.collection('groupplays');

    // Get all existing indexes
    console.log('\n=== Current Indexes ===');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop problematic compound indexes
    console.log('\n=== Dropping Problematic Indexes ===');
    for (const index of indexes) {
      const keys = Object.keys(index.key);

      // Check if it's a compound index with both courts and daysOfWeek
      if (keys.includes('courts') && keys.includes('daysOfWeek') && keys.length > 1) {
        console.log(`Dropping compound index: ${index.name}`);
        try {
          await collection.dropIndex(index.name);
          console.log(`✓ Dropped ${index.name}`);
        } catch (error) {
          console.log(`✗ Failed to drop ${index.name}:`, error.message);
        }
      }
    }

    // Create individual indexes
    console.log('\n=== Creating Individual Indexes ===');

    const indexesToCreate = [
      { key: { daysOfWeek: 1 }, name: 'daysOfWeek_1' },
      { key: { courts: 1 }, name: 'courts_1' },
      { key: { isActive: 1 }, name: 'isActive_1' },
      { key: { status: 1 }, name: 'status_1' },
      { key: { createdBy: 1 }, name: 'createdBy_1' },
      { key: { 'players.player': 1 }, name: 'players.player_1' },
    ];

    for (const indexDef of indexesToCreate) {
      try {
        await collection.createIndex(indexDef.key, { name: indexDef.name });
        console.log(`✓ Created index: ${indexDef.name}`);
      } catch (error) {
        if (error.code === 85 || error.message.includes('already exists')) {
          console.log(`- Index ${indexDef.name} already exists`);
        } else {
          console.log(`✗ Failed to create ${indexDef.name}:`, error.message);
        }
      }
    }

    // Show final indexes
    console.log('\n=== Final Indexes ===');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✓ Index fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error);
    process.exit(1);
  }
}

fixGroupPlayIndexes();
