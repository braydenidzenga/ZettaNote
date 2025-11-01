/**
 * BullMQ Schedulers
 * @description Sets up repeatable jobs for scheduled background tasks
 */

import { imageCleanupQueue, taskReminderQueue } from '../config/queue.js';
import logger from '../utils/logger.js';

/**
 * Initialize scheduled jobs
 * @description Sets up repeatable jobs for image cleanup and task reminders
 */
export const initializeScheduledJobs = async () => {
  // Check if queues are available
  if (!imageCleanupQueue || !taskReminderQueue) {
    logger.warn('⚠️ BullMQ queues not available - skipping scheduled jobs initialization');
    return;
  }

  try {
    logger.info('🕐 Initializing scheduled jobs...');

    // Image cleanup job - runs every 6 hours
    await imageCleanupQueue.add(
      'scheduled-comprehensive-cleanup',
      {
        cleanupType: 'comprehensive',
        batchSize: 50,
      },
      {
        repeat: {
          pattern: '0 */6 * * *', // Every 6 hours at minute 0
        },
        jobId: 'scheduled-image-cleanup', // Unique job ID to prevent duplicates
      }
    );
    logger.info('✅ Scheduled image cleanup job (every 6 hours)');

    // Task reminder job - runs every 5 minutes
    await taskReminderQueue.add(
      'scheduled-reminder-check',
      {
        checkType: 'all',
      },
      {
        repeat: {
          pattern: '*/5 * * * *', // Every 5 minutes
        },
        jobId: 'scheduled-task-reminders', // Unique job ID to prevent duplicates
      }
    );
    logger.info('✅ Scheduled task reminder job (every 5 minutes)');

    // Run initial cleanup on startup
    await imageCleanupQueue.add('startup-cleanup', {
      cleanupType: 'comprehensive',
      batchSize: 50,
    });
    logger.info('✅ Triggered initial image cleanup');

    // Run initial reminder check on startup
    await taskReminderQueue.add('startup-reminder-check', {
      checkType: 'all',
    });
    logger.info('✅ Triggered initial reminder check');

    logger.info('✅ All scheduled jobs initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize scheduled jobs:', error);
    throw error;
  }
};

/**
 * Remove scheduled jobs
 * @description Removes all repeatable jobs (useful for cleanup)
 */
export const removeScheduledJobs = async () => {
  // Check if queues are available
  if (!imageCleanupQueue || !taskReminderQueue) {
    logger.warn('⚠️ BullMQ queues not available - skipping scheduled jobs removal');
    return;
  }

  try {
    logger.info('Removing scheduled jobs...');

    // Get and remove repeatable jobs from image cleanup queue
    const imageCleanupRepeatableJobs = await imageCleanupQueue.getRepeatableJobs();
    for (const job of imageCleanupRepeatableJobs) {
      await imageCleanupQueue.removeRepeatableByKey(job.key);
      logger.info(`Removed repeatable job: ${job.name} from image-cleanup queue`);
    }

    // Get and remove repeatable jobs from task reminder queue
    const taskReminderRepeatableJobs = await taskReminderQueue.getRepeatableJobs();
    for (const job of taskReminderRepeatableJobs) {
      await taskReminderQueue.removeRepeatableByKey(job.key);
      logger.info(`Removed repeatable job: ${job.name} from task-reminder queue`);
    }

    logger.info('✅ All scheduled jobs removed');
  } catch (error) {
    logger.error('❌ Error removing scheduled jobs:', error);
    throw error;
  }
};

export default {
  initializeScheduledJobs,
  removeScheduledJobs,
};
