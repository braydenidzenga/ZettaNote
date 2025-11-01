/**
 * Image Cleanup Worker
 * @description BullMQ worker for processing image cleanup operations
 */

import { Worker } from 'bullmq';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { cleanupMarkedImages, markOrphanedImages } from '../utils/image.utils.js';

/**
 * Redis connection configuration
 */
const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
};

/**
 * Process image cleanup job
 * @param {object} job - BullMQ job
 * @returns {object} Cleanup result
 */
const processImageCleanup = async (job) => {
  const { cleanupType, batchSize = 50 } = job.data;

  logger.info('Processing image cleanup', {
    jobId: job.id,
    cleanupType,
    batchSize,
    attemptsMade: job.attemptsMade,
  });

  try {
    const result = {
      success: true,
      markedCount: 0,
      deletedCount: 0,
      failedCount: 0,
      totalProcessed: 0,
    };

    if (cleanupType === 'mark-orphaned' || cleanupType === 'comprehensive') {
      // Mark orphaned images for deletion
      const markedCount = await markOrphanedImages();
      result.markedCount = markedCount;
      logger.info(`Marked ${markedCount} orphaned images for deletion`, { jobId: job.id });
    }

    if (cleanupType === 'cleanup-marked' || cleanupType === 'comprehensive') {
      // Clean up marked images
      const cleanupResult = await cleanupMarkedImages(batchSize);
      result.deletedCount = cleanupResult.deletedCount;
      result.failedCount = cleanupResult.failedCount;
      result.totalProcessed = cleanupResult.totalProcessed;
      logger.info(
        `Cleaned up ${cleanupResult.deletedCount} marked images (${cleanupResult.failedCount} failed)`,
        { jobId: job.id }
      );
    }

    logger.info('Image cleanup completed successfully', {
      jobId: job.id,
      cleanupType,
      ...result,
    });

    return result;
  } catch (error) {
    logger.error('Image cleanup failed', {
      jobId: job.id,
      cleanupType,
      error: error.message,
      attemptsMade: job.attemptsMade,
    });
    throw error; // Will trigger retry if attempts remain
  }
};

/**
 * Create and start the image cleanup worker
 * @returns {Worker} BullMQ worker instance
 */
export const createImageCleanupWorker = () => {
  const worker = new Worker('image-cleanup', processImageCleanup, {
    connection: redisConnection,
    concurrency: 1, // Process one cleanup job at a time to avoid conflicts
  });

  // Event handlers
  worker.on('completed', (job, result) => {
    logger.info('Image cleanup job completed', {
      jobId: job.id,
      cleanupType: job.data.cleanupType,
      markedCount: result.markedCount,
      deletedCount: result.deletedCount,
      duration: job.processedOn ? Date.now() - job.processedOn : 'N/A',
    });
  });

  worker.on('failed', (job, err) => {
    logger.error('Image cleanup job failed permanently', {
      jobId: job?.id,
      cleanupType: job?.data?.cleanupType,
      error: err.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  worker.on('error', (err) => {
    logger.error('Image cleanup worker error:', err);
  });

  logger.info('✅ Image cleanup worker started');
  return worker;
};

export default createImageCleanupWorker;
