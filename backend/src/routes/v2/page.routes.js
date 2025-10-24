import express from 'express';
import { savePage, processAsyncPageSave } from '../../controllers/v2/page.controller.js';
import { asyncHandler } from '../../middleware/error.middleware.js';

const router = express.Router();

/**
 * POST /api/v2/pages/savepage
 * @description Save/update page content (with async support)
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
 * POST /api/v2/pages/process-async-save
 * @description Process async page save (called by Motia)
 * @internal
 */
router.post(
  '/process-async-save',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await processAsyncPageSave(req);
    res.status(resStatus).json(resMessage);
  })
);

export default router;
