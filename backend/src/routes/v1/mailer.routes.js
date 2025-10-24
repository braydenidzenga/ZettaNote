/**
 * Mailer Routes
 * Handles email sending functionality
 */

import express from 'express';
import { sendTestMail } from '../../controllers/v1/mailer.controller.js';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * POST /api/mailer/send
 * @description    Send an email
 * @access  Private (requires authentication)
 * @param {object} req.body - The request body
 * @param {string|string[]} req.body.to - Recipient email address(es)
 * @param {string} req.body.subject - Email subject
 * @param {string} [req.body.html] - HTML content (optional)
 * @param {string} [req.body.text] - Text content (optional)
 */
router.post(
  '/send',
  authenticate,
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await sendTestMail(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/mailer/test
 * @description    Send a test email (for testing purposes)
 * @access  Private (requires authentication)
 * @param {object} req.body - The request body
 * @param {string} req.body.to - Recipient email address
 * @param {string} req.body.subject - Email subject
 * @param {string} [req.body.html] - HTML content (optional)
 * @param {string} [req.body.text] - Text content (optional)
 */
router.post(
  '/test',
  authenticate,
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await sendTestMail(req);
    res.status(resStatus).json(resMessage);
  })
);

export default router;
