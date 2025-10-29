/**
 * Server Entry Point
 * Connects to database and starts the Express server
 */

import app from './src/app.js';
import { connectDatabase, getDatabaseStatus } from './src/config/database.js';
import config from './src/config/index.js';
import logger from './src/utils/logger.js';
import { ConnectRedis } from './src/config/redis.js';
import { startReminderCronJob, stopReminderCronJob } from './src/jobs/reminderJob.js';
import { startImageCleanupCronJob, stopImageCleanupCronJob } from './src/jobs/imageCleanupJob.js';

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

    // Start reminder cron job (if enabled)
    let reminderTask = null;
    if (config.cron.reminderJobEnabled) {
      reminderTask = startReminderCronJob();
      logger.info('⏰ Reminder cron job started');
    } else {
      logger.info('⏰ Reminder cron job disabled via configuration');
    }

    // Start image cleanup cron job (if enabled)
    let imageCleanupTasks = null;
    if (config.cron.imageCleanupJobEnabled) {
      imageCleanupTasks = startImageCleanupCronJob();
      logger.info('🖼️ Image cleanup cron job started');
    } else {
      logger.info('🖼️ Image cleanup cron job disabled via configuration');
    }

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      if (reminderTask) {
        stopReminderCronJob(reminderTask);
        logger.info('⏰ Reminder cron job stopped');
      }
      if (imageCleanupTasks) {
        stopImageCleanupCronJob(imageCleanupTasks);
        logger.info('🖼️ Image cleanup cron job stopped');
      }

      server.close(async () => {
        logger.info('✅ HTTP server closed');

        try {
          const mongoose = (await import('mongoose')).default;
          await mongoose.connection.close();
          logger.info('✅ Database connection closed');
          process.exit(0);
        } catch (err) {
          logger.error('❌ Error during shutdown:', err);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('⚠️ Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

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

// START SERVER ONLY WHEN NOT IN TEST ENV
// Jest sets NODE_ENV === 'test' automatically when running tests
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Export for testing (app for Supertest, startServer if you want to start/stop manually in tests)
export default app;
export { startServer };
