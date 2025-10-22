/**
 * Express Application Setup
 * Configures middleware, routes, and error handlers
 */
import passport from './config/passport.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import { configureCors } from './config/cors.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiLimiter } from './utils/security.utils.js';

const app = express();

// Trust proxy (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// CORS configuration
app.use(configureCors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());
app.use(passport.initialize());

// API Routes
// Global API rate limiter (applies to all /api routes)
app.use('/api', apiLimiter);
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ZettaNote API Server',
    version: '2.0.0',
    documentation: '/api/health',
  });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
