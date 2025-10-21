import { v4 as uuidv4 } from 'uuid';
import Page from '../models/Page.model.js';
import User from '../models/User.model.js';
import { verifyToken } from '../utils/token.utils.js';
import { STATUS_CODES } from '../constants/statusCodes.js';
import { MESSAGES } from '../constants/messages.js';
import { z } from 'zod';
import logger from '../utils/logger.js';
import { safeRedisCall } from '../config/redis.js';

/**
 * Helper function to get page name and ID
 * @param {string} pageId - ID of the page
 * @returns {object|null} Object with page name and ID or null if not found
 */
const getPageNameAndId = async (pageId) => {
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
 * Create Page Controller
 * Creates a new page for the user
 * @param {object} req - Express request object
 * @returns {object} Response status and message if successful
 */
export const createPage = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    // Validate input
    const createPageSchema = z.object({
      pageName: z.string().min(1, 'Page name is required'),
    });
    const parseResult = createPageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: parseResult.error.errors.map((e) => e.message).join(', ') },
      };
    }
    const { pageName } = parseResult.data;

    // Verify user
    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    // Create new page
    const newPage = new Page({
      pageName,
      pageData: '',
      owner: user._id,
    });
    await newPage.save();

    // Add page to user's pages
    user.pages.push(newPage._id);
    await user.save();

    // Cache new page in Redis
    const cachedPages = JSON.parse(await safeRedisCall('get', `user:${user._id}:ownedPages`)) || [];
    cachedPages.push({ name: newPage.pageName, id: newPage._id });
    const saved = await safeRedisCall(
      'set',
      `user:${user._id}:ownedPages`,
      JSON.stringify(cachedPages),
      {
        EX: 3600, // Cache for 1 hour
      }
    );
    if (saved) {
      logger.info('New page cached in Redis');
    }
    return {
      resStatus: STATUS_CODES.CREATED,
      resMessage: {
        message: MESSAGES.PAGE.CREATED,
        Page: newPage,
      },
    };
  } catch (err) {
    logger.error('Create page error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Get Single Page Controller
 * Returns page details if user has access
 * @param {object} req - Express request object
 * @returns {object} Response status and message if successful
 */
export const getPage = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    // Validate input
    const getPageSchema = z.object({
      pageId: z.string().min(1, 'Page ID is required'),
    });
    const parseResult = getPageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: parseResult.error.errors.map((e) => e.message).join(', ') },
      };
    }
    const { pageId } = parseResult.data;

    const key = `page:${pageId}`;

    // Verify user
    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    // Check Redis cache first
    const cachedPage = await safeRedisCall('get', key);
    if (cachedPage) {
      logger.info('Page fetched from Redis cache');
      return {
        resStatus: STATUS_CODES.OK,
        resMessage: { Page: JSON.parse(cachedPage) },
      };
    }

    // Find page
    const page = await Page.findById(pageId);
    if (!page) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { Error: MESSAGES.PAGE.NOT_FOUND },
      };
    }

    // Check permissions
    const isOwner = page.owner.equals(user._id);
    const isShared = page.sharedTo.some((id) => id.equals(user._id));

    if (!isOwner && !isShared) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { Error: MESSAGES.PAGE.ACCESS_DENIED },
      };
    }

    // Cache page in Redis for future requests
    const saved = await safeRedisCall('set', key, JSON.stringify(page), {
      EX: 3600, // Cache for 1 hour
    });
    if (saved) {
      logger.info('Page cached in Redis');
    }

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: { Page: page },
    };
  } catch (err) {
    logger.error('Get page error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { Error: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Get All Pages Controller
 * Returns list of owned and shared pages
 * @param {object} req - Express request object
 * @returns {object} Response status and message if successful
 */
export const getPages = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    // Verify user
    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    // Get owned pages
    const ownedPages = [];

    // Check Redis cache for owned pages
    const ownedPagesCacheKey = `user:${user._id}:ownedPages`;
    const cachedOwnedPages = await safeRedisCall('get', ownedPagesCacheKey);
    if (cachedOwnedPages) {
      logger.info('Owned pages fetched from Redis cache');
      ownedPages.push(...JSON.parse(cachedOwnedPages));
    } else {
      for (const id of user.pages) {
        const page = await getPageNameAndId(id);
        if (page !== null) {
          ownedPages.push(page);
        }
      }
      // Cache owned pages in Redis
      const saved = await safeRedisCall('set', ownedPagesCacheKey, JSON.stringify(ownedPages), {
        EX: 3600, // Cache for 1 hour
      });
      if (saved) {
        logger.info('Owned pages cached in Redis');
      }
    }

    // Get shared pages
    const sharedPages = [];

    // Check Redis cache for shared pages
    const sharedPagesCacheKey = `user:${user._id}:sharedPages`;
    const cachedSharedPages = await safeRedisCall('get', sharedPagesCacheKey);
    if (cachedSharedPages) {
      logger.info('Shared pages fetched from Redis cache');
      sharedPages.push(...JSON.parse(cachedSharedPages));
    } else {
      for (const id of user.sharedPages) {
        const page = await getPageNameAndId(id);
        if (page !== null) {
          sharedPages.push(page);
        }
      }
      // Cache shared pages in Redis
      const saved = await safeRedisCall('set', sharedPagesCacheKey, JSON.stringify(sharedPages), {
        EX: 3600, // Cache for 1 hour
      });
      if (saved) {
        logger.info('Shared pages cached in Redis');
      }
    }

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        OwnedPages: ownedPages,
        SharedPages: sharedPages,
      },
    };
  } catch (err) {
    logger.error('Get pages error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Save Page Controller
 * Updates page content
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
    if (!page.owner.equals(user._id) && !page.sharedTo.some((id) => id.equals(user._id))) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { message: MESSAGES.PAGE.ACCESS_DENIED },
      };
    }

    // Update page
    page.pageData = newPageData;
    await page.save();

    const key = `page:${pageId}`;
    // Update cache in Redis
    const saved = await safeRedisCall('set', key, JSON.stringify(page), {
      EX: 3600, // Cache for 1 hour
    });
    if (saved) {
      logger.info('Page cache updated in Redis');
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
 * Rename Page Controller
 * Updates page name
 * @param {object} req - Express request object
 * @returns {object} Response status and message if successful
 */
export const renamePage = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    // Validate input
    const renamePageSchema = z.object({
      pageId: z.string().min(1, 'Page ID is required'),
      newPageName: z.string().min(1, 'New page name is required'),
    });
    const parseResult = renamePageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: parseResult.error.errors.map((e) => e.message).join(', ') },
      };
    }
    const { pageId, newPageName } = parseResult.data;

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

    // Check if user is owner
    if (!page.owner.equals(user._id)) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { message: MESSAGES.PAGE.ACCESS_DENIED },
      };
    }

    // Update page name
    page.pageName = newPageName;
    await page.save();

    const key = `user:${user._id}:ownedPages`;
    // // Update cache in Redis
    const cachedPages = JSON.parse(await safeRedisCall('get', key)) || [];
    const updatedPages = cachedPages.map((p) =>
      p.id === pageId ? { ...p, name: newPageName } : p
    );
    const saved = await safeRedisCall('set', key, JSON.stringify(updatedPages));
    if (saved) {
      logger.info('Page name updated in Redis cache');
    }
    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        message: MESSAGES.PAGE.RENAMED,
        'Updated Page': page,
      },
    };
  } catch (err) {
    logger.error('Rename page error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Delete Page Controller
 * Deletes a page
 * @param {object} req - Express request object
 * @returns {object} Response status and message if successful
 */
export const deletePage = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    // Validate input
    const deletePageSchema = z.object({
      pageId: z.string().min(1, 'Page ID is required'),
    });
    const parseResult = deletePageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: parseResult.error.errors.map((e) => e.message).join(', ') },
      };
    }
    const { pageId } = parseResult.data;

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

    // Check if user is owner
    if (!page.owner.equals(user._id)) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { message: MESSAGES.PAGE.ACCESS_DENIED },
      };
    }

    // Delete page
    const pageDeleted = await Page.findByIdAndDelete(pageId);
    if (!pageDeleted) {
      return {
        resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
        resMessage: { message: 'Failed to delete page' },
      };
    }

    // Remove from user's pages
    user.pages.pull(page._id);
    await user.save();

    // remove from Redis cache
    const key = `user:${user._id}:ownedPages`;
    const cachedPages = JSON.parse(await safeRedisCall('get', key)) || [];
    const updatedPages = cachedPages.filter((p) => p.id !== pageId);
    const saved = await safeRedisCall('set', key, JSON.stringify(updatedPages));
    if (saved) {
      logger.info('Page removed from Redis cache');
    }
    return {
      resStatus: STATUS_CODES.OK,
      resMessage: { message: MESSAGES.PAGE.DELETED },
    };
  } catch (err) {
    logger.error('Delete page error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Share Page Controller
 * Shares page with another user
 * @param {object} req - Express request object
 * @returns {object} Response status and message if successful
 */
export const sharePage = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    // Validate input
    const sharePageSchema = z.object({
      pageId: z.string().min(1, 'Page ID is required'),
      email: z.email('Invalid email address'),
    });
    const parseResult = sharePageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: {
          message: parseResult.error?.errors?.map((e) => e.message).join(', ') || 'Invalid input',
        },
      };
    }
    const { pageId, email: userEmail } = parseResult.data;

    // Verify user
    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { Error: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    // Find page
    const page = await Page.findById(pageId);
    if (!page) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { Error: MESSAGES.PAGE.NOT_FOUND },
      };
    }

    // Check if user owns the page
    if (!page.owner.equals(user._id)) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { message: MESSAGES.PAGE.ACCESS_DENIED },
      };
    }

    // Check if user shares page to self
    if (user.email === userEmail.toLowerCase()) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: MESSAGES.PAGE.SHARE_SELF_NOT_ALLOWED },
      };
    }

    // Find user to share with
    const sharedUser = await User.findOne({ email: userEmail });
    if (!sharedUser) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { message: 'User does not exist' },
      };
    }

    // Check if already shared
    const pageAlreadyShared = page.sharedTo.some((id) => id.equals(sharedUser._id));
    if (pageAlreadyShared) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: 'Page already shared with this user' },
      };
    }

    // Share page
    page.sharedTo.push(sharedUser._id);
    await page.save();

    // Add to shared user's pages
    sharedUser.sharedPages.push(page._id);
    await sharedUser.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: { message: MESSAGES.PAGE.SHARED },
    };
  } catch (err) {
    logger.error('Share page error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Public Share Controller
 * Generates public share link for page
 * @param {object} req - Express request object
 * @returns {object} Response status and message if successful
 */
export const publicShare = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    // Verify user
    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    const { pageId, allowDownload = false, isPublic = true, isRegenerate = true} = req.body;

    const page = await Page.findById(pageId);

    if (!page) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { Error: MESSAGES.PAGE.NOT_FOUND },
      };
    }

    // Check if user owns the page
    if (!page.owner.equals(user._id)) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { Error: 'Not authorized to share this page' },
      };
    }

    if(!isPublic){
      page.publicShareId = "";
      page.allowDownload = false;
    }

    // Check if already has public share ID - UPDATE THIS PART
    else if (!isRegenerate) {
      // Update the existing share settings, including allowDownload
      page.allowDownload = allowDownload;
    }

    else{
      // Generate and save public share ID for new share
      const uniqueShareId = uuidv4();
      page.publicShareId = uniqueShareId;
      page.allowDownload = allowDownload;
    }

    await page.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        message: 'Successfully shared publicly',
        publicShareId: page.publicShareId,
        allowDownload: page.allowDownload,
      },
    };
  } catch (err) {
    logger.error('Public share error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Get Public Share Controller
 * Returns publicly shared page content
 * @param {string} shareId - Public share ID
 * @returns {object} Response status and page content if successful
 */
export const getPublicShare = async (shareId) => {
  try {
    const page = await Page.findOne({ publicShareId: shareId });

    if (!page) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { Error: MESSAGES.PAGE.NOT_FOUND },
      };
    }
    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        title: page.pageName,
        content: page.pageData,
        allowDownload: page.allowDownload ?? false, // ✅ added
      },
    };
  } catch (err) {
    logger.error('Get public share error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { Error: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Post Unshare Page Controller
 * Removes a shared page from user
 * @param {object} req - Express request object
 * @param {string} id - Active page id
 * @param {string} gmail - Email of the user to unshare the page with
 * @returns {object} Response status and message if successful
 */
export const removeUserFromSharedPage = async (req, id, gmail) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    // Verify user
    const verifiedUser = await verifyToken(token);
    if (!verifiedUser) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    // Find page
    const page = await Page.findById(id);
    if (!page) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { Error: MESSAGES.PAGE.NOT_FOUND },
      };
    }

    //only owner can unshare the page
    if (!page.owner.equals(verifiedUser._id)) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { Error: MESSAGES.PAGE.ACCESS_DENIED },
      };
    }

    // Find user to unshare with
    const user = await User.findOne({ email: gmail });
    if (!user) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { Error: MESSAGES.AUTH.USER_NOT_FOUND },
      };
    }

    // Check if page is actually shared with the user
    const isShared = page.sharedTo.some((uid) => uid.equals(user._id));
    if (!isShared) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { Error: 'Page not shared with this user' },
      };
    }

    page.sharedTo.pull(user._id);
    await page.save();
    user.sharedPages.pull(page._id);
    await user.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: { message: 'Successfully unshared the page with the user' },
    };
  } catch (err) {
    logger.error(`Error occured while unsharing page`, err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { Error: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

export default {
  createPage,
  getPage,
  getPages,
  savePage,
  renamePage,
  deletePage,
  sharePage,
  publicShare,
  getPublicShare,
  removeUserFromSharedPage,
};
