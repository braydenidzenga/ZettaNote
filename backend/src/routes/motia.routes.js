/**
 * Motia Routes
 * Routes for Motia service integration
 */

import express from 'express';
import {
  cleanupMarkedImagesEndpoint,
  markOrphanedImagesEndpoint,
  checkTaskRemindersEndpoint,
  asyncPageSaveEndpoint,
  asyncImageUploadEndpoint,
} from '../controllers/motia.controller.js';

const router = express.Router();

/**
 * POST /api/cleanup/marked-images
 * @description Cleanup marked images (called by Motia)
 * @access  Internal (Motia service)
 */
router.post('/cleanup/marked-images', async (req, res) => {
  const result = await cleanupMarkedImagesEndpoint(req);
  res.status(result.resStatus).json(result.resMessage);
});

/**
 * POST /api/cleanup/orphaned-images
 * @description Mark orphaned images for deletion (called by Motia)
 * @access  Internal (Motia service)
 */
router.post('/cleanup/orphaned-images', async (req, res) => {
  const result = await markOrphanedImagesEndpoint(req);
  res.status(result.resStatus).json(result.resMessage);
});

/**
 * POST /api/reminders/check
 * @description Check and send task reminders (called by Motia)
 * @access  Internal (Motia service)
 */
router.post('/reminders/check', async (req, res) => {
  const result = await checkTaskRemindersEndpoint(req);
  res.status(result.resStatus).json(result.resMessage);
});

/**
 * POST /api/pages/save-async
 * @description Async page save processing (called by Motia)
 * @access  Internal (Motia service)
 */
router.post('/pages/save-async', async (req, res) => {
  const result = await asyncPageSaveEndpoint(req);
  res.status(result.resStatus).json(result.resMessage);
});

/**
 * POST /api/images/upload-async
 * @description Async image upload processing (called by Motia)
 * @access  Internal (Motia service)
 */
router.post('/images/upload-async', async (req, res) => {
  const result = await asyncImageUploadEndpoint(req);
  res.status(result.resStatus).json(result.resMessage);
});

export default router;
