import Page from '../../models/Page.model.js';
import { verifyToken } from '../../utils/token.utils.js';
import { STATUS_CODES } from '../../constants/statusCodes.js';
import { MESSAGES } from '../../constants/messages.js';
import { z } from 'zod';
import logger from '../../utils/logger.js';
import { safeRedisCall } from '../../config/redis.js';
import { updateImageReferences, getContentImageIds } from '../../utils/image.utils.js';
import { MOTIA_CONFIG, triggerAsyncPageSave } from '../../utils/motia.utils.js';

/**
 * Helper function to get page name and ID
 * @param {string} pageId - ID of the page
 * @returns {object|null} Object with page name and ID or null if not found
 */
const _getPageNameAndId = async (pageId) => {
  const page = await Page.findById(pageId);
  if (!page) {
    return null;
  }
  return {
    name: page.pageName,
    id: page._id,
  };
};

/**
 * V2 Save Page Controller
 * Updates page content with async processing support
 * @param {object} req - Express request object
 * @returns {object} Response status and message if successful
 */
export const savePage = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    // Validate input
    const savePageSchema = z.object({
      pageId: z.string().min(1, 'Page ID is required'),
      newPageData: z.string().min(0, 'Page data is required'),
    });
    const parseResult = savePageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: parseResult.error.errors.map((e) => e.message).join(', ') },
      };
    }
    const { pageId, newPageData } = parseResult.data;

    // Verify user
    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    // Find page
    const page = await Page.findById(pageId);
    if (!page) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { message: MESSAGES.PAGE.NOT_FOUND },
      };
    }

    // Check if user is owner or has write permission
    if (!page.owner.equals(user._id) && !(page.sharedTo || []).some((id) => id.equals(user._id))) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { message: MESSAGES.PAGE.ACCESS_DENIED },
      };
    }

    // Use Motia for async processing if enabled
    if (MOTIA_CONFIG.enabled) {
      logger.info('Using Motia for async page save', { pageId, userId: user._id });

      const motiaResult = await triggerAsyncPageSave(pageId, newPageData, user._id.toString());

      if (motiaResult.success) {
        return {
          resStatus: STATUS_CODES.ACCEPTED, // 202 - Accepted for processing
          resMessage: {
            message: 'Page save queued for processing',
            jobId: motiaResult.jobId,
          },
        };
      } else {
        logger.warn('Motia async save failed, falling back to sync', {
          pageId,
          error: motiaResult.error,
        });
        // Fall back to synchronous processing if Motia fails
      }
    }

    // Synchronous save logic
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
        // Don't fail the save operation if image cleanup fails
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
        message: MESSAGES.PAGE.UPDATED,
        'Updated Page': page,
      },
    };
  } catch (err) {
    logger.error('Save page error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * V2 Process Async Page Save
 * Internal endpoint called by Motia to process page saves
 * @param {object} req - Express request object
 * @returns {object} Response status and message if successful
 */
export const processAsyncPageSave = async (req) => {
  try {
    const { jobId, pageId, newPageData, userId } = req.body;

    logger.info('Processing async page save', { jobId, pageId, userId });

    // Validate input
    const processSchema = z.object({
      jobId: z.string().min(1, 'Job ID is required'),
      pageId: z.string().min(1, 'Page ID is required'),
      newPageData: z.string().min(0, 'Page data is required'),
      userId: z.string().min(1, 'User ID is required'),
    });
    const parseResult = processSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: parseResult.error.errors.map((e) => e.message).join(', ') },
      };
    }

    // Find page
    const page = await Page.findById(pageId);
    if (!page) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { message: MESSAGES.PAGE.NOT_FOUND },
      };
    }

    // Check if user is owner or has write permission
    if (!page.owner.equals(userId) && !(page.sharedTo || []).some((id) => id.equals(userId))) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { message: MESSAGES.PAGE.ACCESS_DENIED },
      };
    }

    // Perform synchronous save logic
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
        // Don't fail the save operation if image cleanup fails
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
        message: MESSAGES.PAGE.UPDATED,
        'Updated Page': page,
        jobId,
        updated: true,
      },
    };
  } catch (err) {
    logger.error('Async save page error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

export default {
  savePage,
  processAsyncPageSave,
};
