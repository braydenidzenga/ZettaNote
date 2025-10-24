/**
 * Routes Index
 * Aggregates all application routes
 */

import express from 'express';
import authRoutes from './auth.routes.js';
import pageRoutes from './page.routes.js';
import adminRoutes from './admin.routes.js';
import mailerRoutes from './mailer.routes.js';
import oauthRoutes from './oauth.routes.js';
import taskRoutes from './task.routes.js';
import userRoutes from './user.routes.js';
import motiaRoutes from './motia.routes.js';
import { STATUS_CODES } from '../constants/statusCodes.js';

const router = express.Router();

/**
 * GET /api/health
 * @description Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(STATUS_CODES.OK).json({
    success: true,
    message: 'Server is running',
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
router.use('/motia', motiaRoutes);

export default router;
