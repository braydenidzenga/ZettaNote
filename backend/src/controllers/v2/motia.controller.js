import { z } from 'zod';
import { STATUS_CODES } from '../../constants/statusCodes.js';
import logger from '../../utils/logger.js';
import { cleanupMarkedImages, markOrphanedImages } from '../../utils/image.utils.js';
import { sendTaskReminderEmail, sendTaskOverdueEmail } from '../v1/mailer.controller.js';
import TaskModel from '../../models/Task.model.js';
import Page from '../../models/Page.model.js';
import { updateImageReferences, getContentImageIds } from '../../utils/image.utils.js';
import { safeRedisCall } from '../../config/redis.js';
import cloudinary from '../../config/cloudinary.js';
import Image from '../../models/Image.model.js';

/**
 * Cleanup Marked Images Endpoint (called by Motia)
 * @param {object} req - Express request object
 * @returns {object} Response with cleanup results
 */
export const cleanupMarkedImagesEndpoint = async (req) => {
  try {
    const schema = z.object({
      batchSize: z.number().min(1).max(100).default(50),
      jobId: z.string(),
    });

    const { batchSize, jobId } = schema.parse(req.body);

    logger.info('Processing marked images cleanup', { jobId, batchSize });

    const result = await cleanupMarkedImages(batchSize);

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        deletedCount: result.deletedCount,
        failedCount: result.failedCount,
        totalProcessed: result.totalProcessed,
      },
    };
  } catch (error) {
    logger.error('Marked images cleanup failed', { error: error.message });
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        error: error.message,
      },
    };
  }
};

/**
 * Mark Orphaned Images Endpoint (called by Motia)
 * @param {object} req - Express request object
 * @returns {object} Response with marking results
 */
export const markOrphanedImagesEndpoint = async (req) => {
  try {
    const schema = z.object({
      jobId: z.string(),
    });

    const { jobId } = schema.parse(req.body);

    logger.info('Processing orphaned images detection', { jobId });

    const markedCount = await markOrphanedImages();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        markedCount,
      },
    };
  } catch (error) {
    logger.error('Orphaned images detection failed', { error: error.message });
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        error: error.message,
      },
    };
  }
};

/**
 * Check Task Reminders Endpoint (called by Motia)
 * @param {object} req - Express request object
 * @returns {object} Response with reminder results
 */
export const checkTaskRemindersEndpoint = async (req) => {
  try {
    const schema = z.object({
      jobId: z.string(),
      checkType: z.enum(['all', 'one-hour', 'overdue']).default('all'),
    });

    const { jobId, checkType } = schema.parse(req.body);

    logger.info('Processing task reminders', { jobId, checkType });

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourWindow = 5 * 60 * 1000;

    let oneHourReminders = 0;
    let overdueReminders = 0;

    // Check 1-hour reminders
    if (checkType === 'all' || checkType === 'one-hour') {
      const tasksNearing1Hour = await TaskModel.find({
        taskDeadline: {
          $gte: new Date(oneHourFromNow.getTime() - oneHourWindow),
          $lte: new Date(oneHourFromNow.getTime() + oneHourWindow),
        },
        isTaskCompleted: false,
        oneHourReminderSent: false,
      }).populate('owner');

      for (const task of tasksNearing1Hour) {
        const emailResult = await sendTaskReminderEmail(task, '1 hour');
        if (emailResult.success) {
          await TaskModel.findByIdAndUpdate(task._id, { oneHourReminderSent: true });
          oneHourReminders++;
        }
      }
    }

    // Check overdue reminders
    if (checkType === 'all' || checkType === 'overdue') {
      const overdueTasks = await TaskModel.find({
        taskDeadline: { $lt: now },
        isTaskCompleted: false,
        overdueReminderSent: false,
      }).populate('owner');

      for (const task of overdueTasks) {
        const emailResult = await sendTaskOverdueEmail(task);
        if (emailResult.success) {
          await TaskModel.findByIdAndUpdate(task._id, { overdueReminderSent: true });
          overdueReminders++;
        }
      }
    }

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        oneHourReminders,
        overdueReminders,
      },
    };
  } catch (error) {
    logger.error('Task reminders check failed', { error: error.message });
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        error: error.message,
      },
    };
  }
};

/**
 * Async Page Save Endpoint (called by Motia)
 * @param {object} req - Express request object
 * @returns {object} Response with save results
 */
export const asyncPageSaveEndpoint = async (req) => {
  try {
    const schema = z.object({
      jobId: z.string(),
      pageId: z.string(),
      newPageData: z.string(),
      userId: z.string(),
    });

    const { jobId, pageId, newPageData, userId } = schema.parse(req.body);

    logger.info('Processing async page save', { jobId, pageId, userId });

    // Find page
    const page = await Page.findById(pageId);
    if (!page) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { success: false, error: 'Page not found' },
      };
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
      }
    }

    const pageKey = `page:${pageId}`;
    // Update cache in Redis
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

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        message: 'Page saved successfully',
        updated: true,
      },
    };
  } catch (error) {
    logger.error('Async page save failed', { error: error.message });
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        error: error.message,
      },
    };
  }
};

/**
 * Async Image Upload Endpoint (called by Motia)
 * @param {object} req - Express request object
 * @returns {object} Response with upload results
 */
export const asyncImageUploadEndpoint = async (req) => {
  try {
    const schema = z.object({
      jobId: z.string(),
      image: z.string(),
      originalName: z.string().optional(),
      pageId: z.string().optional(),
      userId: z.string(),
    });

    const { jobId, image, originalName, pageId, userId } = schema.parse(req.body);

    logger.info('Processing async image upload', { jobId, userId, pageId: pageId || 'none' });

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

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: cloudinaryRes.secure_url,
        imageId: cloudinaryRes.public_id,
        dbImageId: imageDoc._id.toString(),
      },
    };
  } catch (error) {
    logger.error('Async image upload failed', { error: error.message });
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        error: error.message,
      },
    };
  }
};

export default {
  cleanupMarkedImagesEndpoint,
  markOrphanedImagesEndpoint,
  checkTaskRemindersEndpoint,
  asyncPageSaveEndpoint,
  asyncImageUploadEndpoint,
};
