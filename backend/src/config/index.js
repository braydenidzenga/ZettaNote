import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  // Server Configuration
  server: {
    url: process.env.BACKEND_URL || 'http://localhost:4000',
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Database Configuration
  database: {
    uri: process.env.DB || process.env.MONGODB_URI || 'mongodb://localhost:27017/zettanote',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    adminSecret: process.env.ADMIN_JWT_SECRET || 'your-admin-secret-key-change-in-production',
    adminExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '24h',
  },

  // CORS Configuration
  cors: {
    allowedOrigins: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:80',
            'http://localhost:5173',
          ],
  },

  // Cookie Configuration
  cookie: {
    httpOnly: true,
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: process.env.COOKIE_DOMAIN || undefined,
  },

  // OAuth Configuration
  oauth: {
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    },
    github: {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
    },
  },
  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Cron Job Configuration
  cron: {
    reminderJobEnabled: process.env.DISABLE_REMINDER_CRON !== 'true',
    imageCleanupJobEnabled: process.env.DISABLE_IMAGE_CLEANUP_CRON !== 'true',
  },
};

export default config;
