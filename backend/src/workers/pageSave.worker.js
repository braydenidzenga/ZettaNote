/**
 * Page Save Worker
 * @description BullMQ worker for processing page save operations asynchronously
 */

import { Worker } from 'bullmq';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import Page from '../models/Page.model.js';
import { updateImageReferences, getContentImageIds } from '../utils/image.utils.js';
import { safeRedisCall } from '../config/redis.js';

/**
 * Redis connection configuration
 */
const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
};

/**
 * Process page save job
 * @param {object} job - BullMQ job
 * @returns {object} Processing result
 */
const processPageSave = async (job) => {
  const { pageId, newPageData, userId } = job.data;

  logger.info('Processing page save', {
    jobId: job.id,
    pageId,
    userId,
    attemptsMade: job.attemptsMade,
  });

  try {
    // Find page
    const page = await Page.findById(pageId);
    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }

    // Get current image IDs from the page content before updating
    const previousImageIds = getContentImageIds(page.pageData);

    // Update page
    page.pageData = newPageData;
    await page.save();

    // Handle image reference updates
    const currentImageIds = getContentImageIds(newPageData);
    const addedImages = currentImageIds.filter((id) => !previousImageIds.includes(id));
    const removedImages = previousImageIds.filter((id) => !currentImageIds.includes(id));

    if (addedImages.length > 0 || removedImages.length > 0) {
      try {
        await updateImageReferences(pageId, addedImages, removedImages);
        logger.info(
          `Updated image references for page ${pageId}: +${addedImages.length} -${removedImages.length}`
        );
      } catch (imageError) {
        logger.error('Error updating image references:', imageError);
        // Don't fail the job if image cleanup fails
      }
    }

    // Update cache in Redis
    const pageKey = `page:${pageId}`;
    const saved = await safeRedisCall('set', pageKey, JSON.stringify(page), {
      EX: 3600, // Cache for 1 hour
    });
    if (saved) {
      logger.info('Page cache updated in Redis');
    }

    // Invalidate related user caches (owner and shared users)
    const ownerCacheKey = `user:${page.owner}:ownedPages`;
    const sharedUserCacheKeys = (page.sharedTo || []).map((userId) => `user:${userId}:sharedPages`);

    // Invalidate owner cache
    await safeRedisCall('del', ownerCacheKey);

    // Invalidate shared user caches in parallel
    if (sharedUserCacheKeys.length > 0) {
      await Promise.all(sharedUserCacheKeys.map((key) => safeRedisCall('del', key)));
    }

    logger.info('Page save completed successfully', { jobId: job.id, pageId });

    return {
      success: true,
      pageId,
      addedImages: addedImages.length,
      removedImages: removedImages.length,
    };
  } catch (error) {
    logger.error('Page save failed', {
      jobId: job.id,
      pageId,
      error: error.message,
      attemptsMade: job.attemptsMade,
    });
    throw error; // Will trigger retry if attempts remain
  }
};

/**
 * Create and start the page save worker
 * @returns {Worker} BullMQ worker instance
 */
export const createPageSaveWorker = () => {
  const worker = new Worker('page-save', processPageSave, {
    connection: redisConnection,
    concurrency: 5, // Process 5 page saves concurrently
  });

  // Event handlers
  worker.on('completed', (job, result) => {
    logger.info('Page save job completed', {
      jobId: job.id,
      pageId: result.pageId,
      duration: job.processedOn ? Date.now() - job.processedOn : 'N/A',
    });
  });

  worker.on('failed', (job, err) => {
    logger.error('Page save job failed permanently', {
      jobId: job?.id,
      pageId: job?.data?.pageId,
      error: err.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  worker.on('error', (err) => {
    logger.error('Page save worker error:', err);
  });

  logger.info('✅ Page save worker started');
  return worker;
};

export default createPageSaveWorker;
