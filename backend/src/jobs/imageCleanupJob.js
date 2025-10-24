/**
 * Image Cleanup Cron Job
 * @description Cron job to clean up unused images from Cloudinary and database
 */

import cron from 'node-cron';
import { cleanupMarkedImages, markOrphanedImages } from '../utils/image.utils.js';
import logger from '../utils/logger.js';

/**
 * Clean up images that are marked for deletion
 * @description Deletes images from Cloudinary and marks them as deleted in database
 * @returns {Promise<object>} Cleanup results with deletedCount, failedCount, totalProcessed
 */
const cleanupMarkedImagesJob = async () => {
  try {
    logger.info('Starting marked images cleanup job...');

    const result = await cleanupMarkedImages(50); // Process up to 50 images at a time

    logger.info(
      `Marked images cleanup completed: ${result.deletedCount} deleted, ${result.failedCount} failed, ${result.totalProcessed} processed`
    );

    return result;
  } catch (error) {
    logger.error('Error in cleanupMarkedImagesJob:', error);
    throw error;
  }
};

/**
 * Mark orphaned images for deletion
 * @description Finds images with no references and marks them for deletion
 * @returns {Promise<number>} Number of images marked for deletion
 */
const markOrphanedImagesJob = async () => {
  try {
    logger.info('Starting orphaned images detection job...');

    const markedCount = await markOrphanedImages();

    logger.info(`Orphaned images detection completed: ${markedCount} images marked for deletion`);

    return markedCount;
  } catch (error) {
    logger.error('Error in markOrphanedImagesJob:', error);
    throw error;
  }
};

/**
 * Run comprehensive image cleanup
 * @description Runs both orphaned detection and marked cleanup
 * @returns {Promise<object>} Combined results from both cleanup operations
 */
const comprehensiveImageCleanup = async () => {
  try {
    logger.info('Starting comprehensive image cleanup...');

    // First mark orphaned images
    const markedCount = await markOrphanedImages();

    // Then clean up marked images
    const cleanupResult = await cleanupMarkedImages(50);

    logger.info(
      `Comprehensive image cleanup completed: ${markedCount} orphaned marked, ${cleanupResult.deletedCount} deleted`
    );

    return { markedCount, cleanupResult };
  } catch (error) {
    logger.error('Error in comprehensiveImageCleanup:', error);
    throw error;
  }
};

/**
 * Start the image cleanup cron job
 * @description Starts a cron job that runs image cleanup tasks periodically
 * @returns {ScheduledTask} Cron task instance
 */
export const startImageCleanupCronJob = () => {
  logger.info('Starting image cleanup cron job...');

  // Run comprehensive cleanup every 6 hours: '0 */6 * * *'
  // Also run orphaned detection every 12 hours: '0 */12 * * *'
  const cleanupTask = cron.schedule(
    '0 */6 * * *',
    async () => {
      logger.info('Running scheduled comprehensive image cleanup...');
      try {
        await comprehensiveImageCleanup();
      } catch (error) {
        logger.error('Comprehensive image cleanup cron job error:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );

  // Additional orphaned detection job every 12 hours
  const orphanedTask = cron.schedule(
    '0 */12 * * *',
    async () => {
      logger.info('Running scheduled orphaned images detection...');
      try {
        await markOrphanedImagesJob();
      } catch (error) {
        logger.error('Orphaned images detection cron job error:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );

  // Run initial cleanup on startup
  comprehensiveImageCleanup().catch((error) => {
    logger.error('Initial image cleanup error:', error);
  });

  logger.info(
    'Image cleanup cron jobs started - comprehensive cleanup every 6 hours, orphaned detection every 12 hours'
  );
  return { cleanupTask, orphanedTask };
};

/**
 * Stop the image cleanup cron jobs
 * @description Stops the running image cleanup cron jobs
 * @param {object} tasks - The cron tasks to stop
 */
export const stopImageCleanupCronJob = (tasks) => {
  if (tasks && tasks.cleanupTask) {
    tasks.cleanupTask.stop();
    logger.info('Image cleanup cron job stopped');
  }
  if (tasks && tasks.orphanedTask) {
    tasks.orphanedTask.stop();
    logger.info('Orphaned images detection cron job stopped');
  }
};

/**
 * Manual trigger for image cleanup (for admin use)
 * @description Manually trigger comprehensive image cleanup
 * @returns {object} Cleanup results
 */
export const triggerManualImageCleanup = async () => {
  logger.info('Manual image cleanup triggered');
  try {
    const result = await comprehensiveImageCleanup();
    logger.info('Manual image cleanup completed', result);
    return result;
  } catch (error) {
    logger.error('Manual image cleanup failed:', error);
    throw error;
  }
};

export default {
  startImageCleanupCronJob,
  stopImageCleanupCronJob,
  triggerManualImageCleanup,
  cleanupMarkedImagesJob,
  markOrphanedImagesJob,
  comprehensiveImageCleanup,
};
