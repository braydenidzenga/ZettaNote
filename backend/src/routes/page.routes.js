import express from 'express';
import {
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
  uploadImage,
} from '../controllers/page.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = express.Router();

/**
 * POST /api/pages/createpage
 * @description Create a new page
 * @private
 */
router.post(
  '/createpage',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await createPage(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/pages/getpage
 * @description Get a single page by ID
 * @private
 */
router.post(
  '/getpage',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await getPage(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/pages/getpages
 * @description Get all pages (owned and shared)
 * @private
 */
router.post(
  '/getpages',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await getPages(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/pages/savepage
 * @description Save/update page content
 * @private
 */
router.post(
  '/savepage',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await savePage(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/pages/renamepage
 * @description Rename a page
 * @private
 */
router.post(
  '/renamepage',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await renamePage(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * DELETE /api/pages/deletepage
 * @description Delete a page
 * @private
 */
router.delete(
  '/deletepage',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await deletePage(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/pages/sharepage
 * @description Share a page with another user
 * @private
 */
router.post(
  '/sharepage',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await sharePage(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/pages/publicshare
 * @description Generate public share link
 * @private
 */
router.post(
  '/publicshare',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await publicShare(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * GET /api/pages/share/:shareId
 * @description Get publicly shared page
 * @public
 */
router.get(
  '/share/:shareId',
  asyncHandler(async (req, res) => {
    const { shareId } = req.params;
    const { resStatus, resMessage } = await getPublicShare(shareId);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/pages/sharepage/remove-user
 * @description Remove a shared user from a page
 * @private
 */
router.post(
  '/sharepage/remove-user',
  asyncHandler(async (req, res) => {
    const { gmail, id } = req.body;
    const { resStatus, resMessage } = await removeUserFromSharedPage(req, id, gmail);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/pages/upload-image
 * @description Upload an image to Cloudinary
 * @private
 */
router.post(
  '/upload-image',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await uploadImage(req);
    res.status(resStatus).json(resMessage);
  })
);

export default router;
