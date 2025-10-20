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
    // Read comma-separated origins from either CORS_ORIGIN or ALLOWED_ORIGINS.
    // Trim entries and ignore empty strings to avoid accidentally blocking all origins.
    allowedOrigins: (() => {
      const envList = process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS;

      // Helper to normalize entries (trim, remove trailing slash)
      const normalize = (s) => s && s.trim().replace(/\/$/, '');

      if (envList && envList.trim() !== '') {
        const parsed = envList.split(',').map((s) => normalize(s)).filter(Boolean);

        // Also include FRONTEND_URL if set and not already in the list
        if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim() !== '') {
          const frontend = normalize(process.env.FRONTEND_URL);
          if (frontend && !parsed.includes(frontend)) { 
            parsed.push(frontend);
          }
        }

        // Deduplicate while preserving order
        return [...new Set(parsed)];
      }

      return [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:80',
        'http://localhost:5173',
        // Vite sometimes uses 127.0.0.1
        'http://127.0.0.1:5173',
      ];
    })(),
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
};

export default config;
