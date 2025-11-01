/**
 * Routes Index
 * Aggregates all application routes
 */

import express from 'express';
import v1Routes from './v1/index.js';
import v2Routes from './v2/index.js';
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

// Mount API versions
router.use('/v1', v1Routes);
router.use('/v2', v2Routes);

// For backward compatibility, also mount v1 routes at root level
// TODO: Remove this in future versions when frontend is updated
import authRoutes from './v1/auth.routes.js';
import pageRoutes from './v1/page.routes.js';
import adminRoutes from './v1/admin.routes.js';
import mailerRoutes from './v1/mailer.routes.js';
import oauthRoutes from './v1/oauth.routes.js';
import taskRoutes from './v1/task.routes.js';
import userRoutes from './v1/user.routes.js';

router.use('/auth', authRoutes);
router.use('/auth', oauthRoutes);
router.use('/pages', pageRoutes);
router.use('/admin', adminRoutes);
router.use('/mailer', mailerRoutes);
router.use('/task', taskRoutes);
router.use('/user', userRoutes);

export default router;
