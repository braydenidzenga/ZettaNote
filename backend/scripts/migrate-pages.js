/**
 * Migration script to ensure all pages have the sharedTo field initialized
 */

import mongoose from 'mongoose';
import Page from '../src/models/Page.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function migratePages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zetta-note');
    console.log('Connected to MongoDB');

    // Update all pages that don't have sharedTo field
    const result = await Page.updateMany(
      { sharedTo: { $exists: false } },
      { $set: { sharedTo: [] } }
    );

    console.log(`Migration completed: ${result.modifiedCount} pages updated`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migratePages();
