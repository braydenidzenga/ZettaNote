/**
 * Image Upload Worker
 * @description BullMQ worker for processing image uploads asynchronously
 */

import { Worker } from 'bullmq';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import cloudinary from '../config/cloudinary.js';
import Image from '../models/Image.model.js';

/**
 * Redis connection configuration
 */
const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
};

/**
 * Process image upload job
 * @param {object} job - BullMQ job
 * @returns {object} Upload result
 */
const processImageUpload = async (job) => {
  const { image, originalName, pageId, userId } = job.data;

  logger.info('Processing image upload', {
    jobId: job.id,
    userId,
    pageId: pageId || 'none',
    attemptsMade: job.attemptsMade,
  });

  try {
    // Upload image to Cloudinary
    const timestamp = new Date().getTime();
    const uniqueId = `${userId}_${timestamp}`;
    const cloudinaryRes = await cloudinary.uploader.upload(image, {
      folder: 'notes',
      public_id: `note_img_${uniqueId}`,
    });

    // Save image metadata to database
    const imageDoc = new Image({
      publicId: cloudinaryRes.public_id,
      url: cloudinaryRes.secure_url,
      originalName: originalName || null,
      size: cloudinaryRes.bytes || 0,
      mimeType: cloudinaryRes.format ? `image/${cloudinaryRes.format}` : 'image/jpeg',
      uploadedBy: userId,
      usedInPages: pageId ? [pageId] : [],
      referenceCount: pageId ? 1 : 0,
    });

    await imageDoc.save();

    logger.info('Image upload completed successfully', {
      jobId: job.id,
      imageId: cloudinaryRes.public_id,
      dbImageId: imageDoc._id.toString(),
    });

    return {
      success: true,
      imageUrl: cloudinaryRes.secure_url,
      imageId: cloudinaryRes.public_id,
      dbImageId: imageDoc._id.toString(),
    };
  } catch (error) {
    logger.error('Image upload failed', {
      jobId: job.id,
      userId,
      error: error.message,
      attemptsMade: job.attemptsMade,
    });
    throw error; // Will trigger retry if attempts remain
  }
};

/**
 * Create and start the image upload worker
 * @returns {Worker} BullMQ worker instance
 */
export const createImageUploadWorker = () => {
  const worker = new Worker('image-upload', processImageUpload, {
    connection: redisConnection,
    concurrency: 3, // Process 3 image uploads concurrently
  });

  // Event handlers
  worker.on('completed', (job, result) => {
    logger.info('Image upload job completed', {
      jobId: job.id,
      imageId: result.imageId,
      duration: job.processedOn ? Date.now() - job.processedOn : 'N/A',
    });
  });

  worker.on('failed', (job, err) => {
    logger.error('Image upload job failed permanently', {
      jobId: job?.id,
      userId: job?.data?.userId,
      error: err.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  worker.on('error', (err) => {
    logger.error('Image upload worker error:', err);
  });

  logger.info('✅ Image upload worker started');
  return worker;
};

export default createImageUploadWorker;
