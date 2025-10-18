/**
 * Server Entry Point
 * Connects to database and starts the Express server
 */

import app from './src/app.js';
import { connectDatabase, getDatabaseStatus } from './src/config/database.js';
import config from './src/config/index.js';
import logger from './src/utils/logger.js';
import { ConnectRedis } from './src/config/redis.js';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  process.exit(1);
});

// Connect to Redis
ConnectRedis().catch((err) => {
  logger.error('❌ Failed to connect to Redis:', err);
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Check database status
    const dbStatus = getDatabaseStatus();
    logger.info(`📊 Database Status: ${dbStatus.status}`);

    // Start Express server
    const server = app.listen(config.server.port, () => {
      logger.info('🚀 ZettaNote API Server Started');
      logger.info(`📍 Environment: ${config.server.nodeEnv}`);
      logger.info(`🌐 Server running on port ${config.server.port}`);
      logger.info(`🔗 API available at: http://localhost:${config.server.port}/api`);
      logger.info(`💚 Health check: http://localhost:${config.server.port}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('✅ HTTP server closed');

        try {
          // Close database connection
          const mongoose = (await import('mongoose')).default;
          await mongoose.connection.close();
          logger.info('✅ Database connection closed');
          process.exit(0);
        } catch (err) {
          logger.error('❌ Error during shutdown:', err);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⚠️ Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('❌ UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  process.exit(1);
});

// Start the server
startServer();
