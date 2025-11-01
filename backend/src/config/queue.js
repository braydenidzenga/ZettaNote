/**
 * BullMQ Queue Configuration
 * @description Configures and exports BullMQ queues for background job processing
 */

import { Queue } from 'bullmq';
import config from './index.js';
import logger from '../utils/logger.js';

/**
 * Check if Redis configuration is available
 * @returns {boolean} True if Redis is explicitly configured (not just defaults)
 */
const isRedisConfigured = () => {
  // Only return true if REDIS_URL is explicitly set in environment
  // Don't use defaults to avoid connection attempts to unconfigured Redis
  return !!process.env.REDIS_URL;
};

/**
 * Get Redis connection configuration for BullMQ
 * @returns {object|null} Redis connection config or null if not configured
 */
const getRedisConnection = () => {
  if (!isRedisConfigured()) {
    return null;
  }

  return {
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null, // BullMQ recommendation
    enableOfflineQueue: false, // Don't queue commands if Redis is down
  };
};

/**
 * Get default queue options
 * @returns {object|null} Queue options or null if Redis not configured
 */
const getDefaultQueueOptions = () => {
  const redisConnection = getRedisConnection();
  if (!redisConnection) {
    return null;
  }

  return {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5 seconds
      },
      removeOnComplete: {
        age: 86400, // Keep completed jobs for 24 hours
        count: 1000, // Keep last 1000 jobs
      },
      removeOnFail: {
        age: 604800, // Keep failed jobs for 7 days
        count: 5000,
      },
    },
  };
};

/**
 * Queues - will be initialized when initializeQueues() is called
 */
export let pageSaveQueue = null;
export let imageUploadQueue = null;
export let imageCleanupQueue = null;
export let taskReminderQueue = null;

/**
 * Initialize all queues and log their status
 */
export const initializeQueues = async () => {
  // Check if Redis is configured
  if (!isRedisConfigured()) {
    logger.warn('⚠️ Redis not configured - BullMQ queues will not be available');
    logger.warn('⚠️ Background jobs will run synchronously');
    throw new Error('Redis not configured');
  }

  try {
    logger.info('🚀 Initializing BullMQ queues...');

    // Get queue options
    const queueOptions = getDefaultQueueOptions();
    if (!queueOptions) {
      throw new Error('Failed to get queue options');
    }

    // Create queues only when Redis is available
    pageSaveQueue = new Queue('page-save', queueOptions);
    imageUploadQueue = new Queue('image-upload', queueOptions);
    imageCleanupQueue = new Queue('image-cleanup', queueOptions);
    taskReminderQueue = new Queue('task-reminder', queueOptions);

    // Test connection by trying to add a test job and removing it
    const testJob = await pageSaveQueue.add(
      'test-connection',
      {},
      {
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
    await testJob.remove();

    logger.info('✅ Redis connection successful for BullMQ');
    logger.info('✅ All BullMQ queues initialized successfully');
    logger.info('   - page-save queue ready');
    logger.info('   - image-upload queue ready');
    logger.info('   - image-cleanup queue ready');
    logger.info('   - task-reminder queue ready');
  } catch (error) {
    logger.error('❌ Failed to initialize BullMQ queues:', error.message);
    logger.warn('⚠️ Background jobs will run synchronously');
    // Reset queues to null on error
    pageSaveQueue = null;
    imageUploadQueue = null;
    imageCleanupQueue = null;
    taskReminderQueue = null;
    throw error;
  }
};

/**
 * Close all queue connections
 */
export const closeQueues = async () => {
  // Only close if queues were initialized
  if (!pageSaveQueue) {
    return;
  }

  try {
    await Promise.all([
      pageSaveQueue.close(),
      imageUploadQueue.close(),
      imageCleanupQueue.close(),
      taskReminderQueue.close(),
    ]);
    logger.info('✅ All BullMQ queues closed');
  } catch (error) {
    logger.error('❌ Error closing BullMQ queues:', error);
    throw error;
  }
};

export default {
  pageSaveQueue,
  imageUploadQueue,
  imageCleanupQueue,
  taskReminderQueue,
  initializeQueues,
  closeQueues,
};
