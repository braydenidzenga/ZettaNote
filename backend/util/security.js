import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Rate limiting for admin login attempts
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
});

// Speed limiting for admin operations
export const adminSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // Allow 2 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 10000, // Maximum delay of 10 seconds
  validate: { delayMs: false }, // Disable the deprecation warning
});

// Rate limiting for general admin API calls
export const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many API requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for admin creation (super strict)
export const adminCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 admin creation attempts per hour
  message: {
    success: false,
    message: 'Too many admin creation attempts, please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to log suspicious activity
export const logSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /admin.*delete/i,
    /\.\.\/\.\.\//,
    /<script>/i,
    /union.*select/i,
    /drop.*table/i,
  ];

  const userAgent = req.get('User-Agent') || '';
  const url = req.originalUrl;
  const body = JSON.stringify(req.body);

  const isSuspicious = suspiciousPatterns.some(
    (pattern) => pattern.test(url) || pattern.test(body) || pattern.test(userAgent)
  );

  if (isSuspicious) {
    console.warn('🚨 SUSPICIOUS ACTIVITY DETECTED:', {
      ip: req.ip,
      userAgent,
      url,
      body: req.body,
      timestamp: new Date().toISOString(),
    });

    // Log to admin if available
    if (req.admin) {
      req.admin.addAuditLog('SUSPICIOUS_ACTIVITY_DETECTED', req.ip, userAgent, {
        url,
        body: req.body,
      });
      req.admin.save().catch(console.error);
    }
  }

  next();
};

// Middleware to enforce HTTPS in production
export const enforceHTTPS = (req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    !req.secure &&
    req.get('x-forwarded-proto') !== 'https'
  ) {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict transport security (HTTPS only)
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content Security Policy for admin panel
  if (req.originalUrl.startsWith('/api/admin')) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    );
  }

  next();
};
