import express from 'express';
import pageRoutes from './page.routes.js';
import motiaRoutes from './motia.routes.js';

const router = express.Router();

// V2 API Routes
router.use('/pages', pageRoutes);
router.use('/motia', motiaRoutes);

// Health check for v2 API
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: 'v2',
    timestamp: new Date().toISOString(),
  });
});

export default router;
