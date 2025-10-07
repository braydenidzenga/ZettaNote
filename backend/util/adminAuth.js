import jsonwebtoken from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import AdminAccount from '../models/AdminAccount.model.js';

// Generate JWT token for admin users
export const genAdminToken = (admin, options = {}) => {
  const token = jsonwebtoken.sign(
    {
      id: admin._id,
      role: admin.role,
      type: 'admin', // Distinguish from regular user tokens
    },
    JWT_SECRET,
    { expiresIn: options.expiresIn || '4h' } // Default 4h, but can be customized
  );

  return token;
};

// Verify admin token
export const verifyAdminToken = async (token) => {
  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET);

    // Ensure it's an admin token
    if (decoded.type !== 'admin') {
      return null;
    }

    const admin = await AdminAccount.findById(decoded.id);

    // Check if admin exists and is active
    if (!admin || !admin.active || admin.isLocked) {
      return null;
    }

    return admin;
  } catch (err) {
    return null;
  }
};

// Middleware to protect admin routes
export const requireAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const admin = await verifyAdminToken(token);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid or expired token.',
      });
    }

    // Add admin info to request object
    req.admin = admin;
    req.adminId = admin._id;

    // Log admin activity
    admin.addAuditLog(
      `API_ACCESS: ${req.method} ${req.originalUrl}`,
      req.ip,
      req.get('User-Agent'),
      {
        method: req.method,
        url: req.originalUrl,
        body: req.method === 'POST' ? req.body : undefined,
      }
    );

    // Update last login time periodically (every 30 minutes)
    if (!admin.lastLogin || Date.now() - admin.lastLogin > 30 * 60 * 1000) {
      admin.lastLogin = new Date();
      await admin.save();
    }

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

// Middleware to check specific permissions
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!AdminAccount.hasPermission(req.admin, permission)) {
      // Log unauthorized access attempt
      req.admin.addAuditLog(`UNAUTHORIZED_ACCESS: ${permission}`, req.ip, req.get('User-Agent'), {
        permission,
        method: req.method,
        url: req.originalUrl,
      });
      req.admin.save().catch(console.error);

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.',
      });
    }

    next();
  };
};

// Middleware to check if admin is super admin
export const requireSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.admin.role !== 'super_admin') {
    req.admin.addAuditLog('UNAUTHORIZED_SUPER_ADMIN_ACCESS', req.ip, req.get('User-Agent'), {
      method: req.method,
      url: req.originalUrl,
    });
    req.admin.save().catch(console.error);

    return res.status(403).json({
      success: false,
      message: 'Super admin privileges required.',
    });
  }

  next();
};

// Middleware to check IP whitelist (if enabled for admin)
export const checkIPWhitelist = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  // Skip IP check if no whitelist is configured
  if (!req.admin.ipWhitelist || req.admin.ipWhitelist.length === 0) {
    return next();
  }

  const clientIP = req.ip || req.connection.remoteAddress;

  if (!req.admin.ipWhitelist.includes(clientIP)) {
    req.admin.addAuditLog('IP_WHITELIST_VIOLATION', clientIP, req.get('User-Agent'), {
      attemptedIP: clientIP,
      whitelistedIPs: req.admin.ipWhitelist,
    });
    req.admin.save().catch(console.error);

    return res.status(403).json({
      success: false,
      message: 'Access denied from this IP address.',
    });
  }

  next();
};
