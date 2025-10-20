import cors from 'cors';
import config from './index.js';
import logger from '../utils/logger.js';

/**
 * Configure CORS middleware
 * @returns {Function} CORS middleware
 */
export const configureCors = () => {
  const { allowedOrigins } = config.cors;
  // Normalize allowed origins for robust matching
  const normalizedAllowed = allowedOrigins.map((o) => o.replace(/\/$/, '').toLowerCase());

  // Helpful startup log showing which origins are accepted
  logger.info('CORS allowed origins:', normalizedAllowed.join(', '));

  return cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, '').toLowerCase();

      if (normalizedAllowed.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Helpful debug log when rejecting
      logger.warn('CORS rejected origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
};

export default configureCors;
