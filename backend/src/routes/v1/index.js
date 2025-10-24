/**
 * V1 API Routes Index
 * Aggregates all v1 application routes
 */

import express from 'express';
import authRoutes from './auth.routes.js';
import pageRoutes from './page.routes.js';
import adminRoutes from './admin.routes.js';
import mailerRoutes from './mailer.routes.js';
import oauthRoutes from './oauth.routes.js';
import taskRoutes from './task.routes.js';
import userRoutes from './user.routes.js';
import { STATUS_CODES } from '../../constants/statusCodes.js';

const router = express.Router();

/**
 * GET /api/v1/health
 * @description Health check endpoint for v1 API
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(STATUS_CODES.OK).json({
    success: true,
    message: 'V1 API is running',
    version: 'v1',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/auth', oauthRoutes);
router.use('/pages', pageRoutes);
router.use('/admin', adminRoutes);
router.use('/mailer', mailerRoutes);
router.use('/task', taskRoutes);
router.use('/user', userRoutes);

export default router;
