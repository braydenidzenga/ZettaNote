import mongoose from 'mongoose';
import config from './index.js';
import logger from '../utils/logger.js';

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
export const connectDatabase = async () => {
  try {
    await mongoose.connect(config.database.uri, {
      // Connection pool settings for better performance
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      minPoolSize: 2, // Minimum number of connections in the connection pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    });
    logger.success('Connected to MongoDB database');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

/**
 * Get database connection status
 * @returns {string} Connection status with emoji
 */
export const getDatabaseStatus = () => {
  const state = mongoose.connection.readyState;

  switch (state) {
    case 0:
      return 'Disconnected ❌';
    case 1:
      return 'Connected ✅';
    case 2:
      return 'Connecting ⏳';
    case 3:
      return 'Disconnecting ⚠️';
    default:
      return 'Unknown ❓';
  }
};

export default { connectDatabase, getDatabaseStatus };
