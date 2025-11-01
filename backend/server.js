/**
 * Server Entry Point
 * Connects to database and starts the Express server
 */

import app from './src/app.js';
import { connectDatabase, getDatabaseStatus } from './src/config/database.js';
import config from './src/config/index.js';
import logger from './src/utils/logger.js';
import { ConnectRedis } from './src/config/redis.js';
import { initializeQueues, closeQueues } from './src/config/queue.js';
import { initializeScheduledJobs } from './src/config/schedulers.js';
import createPageSaveWorker from './src/workers/pageSave.worker.js';
import createImageUploadWorker from './src/workers/imageUpload.worker.js';
import createImageCleanupWorker from './src/workers/imageCleanup.worker.js';
import createTaskReminderWorker from './src/workers/taskReminder.worker.js';

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

    // Initialize BullMQ (optional - will warn if Redis unavailable)
    let workers = null;
    try {
      await initializeQueues();

      // Start BullMQ workers
      workers = {
        pageSave: createPageSaveWorker(),
        imageUpload: createImageUploadWorker(),
        imageCleanup: createImageCleanupWorker(),
        taskReminder: createTaskReminderWorker(),
      };
      logger.info('✅ All BullMQ workers started');

      // Initialize scheduled jobs (if enabled)
      if (config.cron.reminderJobEnabled && config.cron.imageCleanupJobEnabled) {
        await initializeScheduledJobs();
      } else {
        if (!config.cron.reminderJobEnabled) {
          logger.info('⏰ Task reminder scheduled job disabled via configuration');
        }
        if (!config.cron.imageCleanupJobEnabled) {
          logger.info('🖼️ Image cleanup scheduled job disabled via configuration');
        }
      }
    } catch (bullmqError) {
      logger.warn(
        '⚠️ BullMQ initialization failed - background jobs will not work:',
        bullmqError.message
      );
      logger.warn('⚠️ Please ensure Redis is running for background job processing');
    }

    // Start Express server
    const server = app.listen(config.server.port, () => {
      logger.info('🚀 ZettaNote API Server Started');
      logger.info(`� Environment: ${config.server.nodeEnv}`);
      logger.info(`🌐 Server running on port ${config.server.port}`);
      logger.info(`� API available at: http://localhost:${config.server.port}/api`);
      logger.info(`💚 Health check: http://localhost:${config.server.port}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Close BullMQ workers if they were started
      if (workers) {
        try {
          await Promise.all([
            workers.pageSave.close(),
            workers.imageUpload.close(),
            workers.imageCleanup.close(),
            workers.taskReminder.close(),
          ]);
          logger.info('✅ All BullMQ workers closed');
        } catch (err) {
          logger.error('❌ Error closing workers:', err);
        }

        // Close BullMQ queues
        try {
          await closeQueues();
        } catch (err) {
          logger.error('❌ Error closing queues:', err);
        }
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

export default app;
export { startServer };
