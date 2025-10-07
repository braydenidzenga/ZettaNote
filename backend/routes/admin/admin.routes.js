import express from 'express';
import { requireAdminAuth, requireSuperAdmin, requirePermission } from '../../util/adminAuth.js';
import {
  adminLoginLimiter,
  adminApiLimiter,
  adminCreationLimiter,
  logSuspiciousActivity,
  securityHeaders,
} from '../../util/security.js';
import adminLogin from '../../controllers/adminControllers/adminLogin.controller.js';
import adminLogout from '../../controllers/adminControllers/adminLogout.controller.js';
import changeFirstPassword from '../../controllers/adminControllers/changeFirstPassword.controller.js';
import createAdmin from '../../controllers/adminControllers/createAdmin.controller.js';
import getTotalUsers from '../../controllers/adminControllers/getTotalUsers.controller.js';
import getAllUsers from '../../controllers/adminControllers/getAllUsers.controller.js';
import banUser from '../../controllers/adminControllers/banUser.controller.js';
import unbanUser from '../../controllers/adminControllers/unbanUser.controller.js';
import getAnalytics from '../../controllers/adminControllers/getAnalytics.controller.js';
import getAllAdmins from '../../controllers/adminControllers/getAllAdmins.controller.js';
import updateAdmin from '../../controllers/adminControllers/updateAdmin.controller.js';
import deleteAdmin from '../../controllers/adminControllers/deleteAdmin.controller.js';

const router = express.Router();

// Apply security middleware to all admin routes
router.use(securityHeaders);
router.use(logSuspiciousActivity);

// Public admin routes (no authentication required)
router.post('/login', adminLoginLimiter, async (req, res) => {
  try {
    const { resStatus, resMessage } = await adminLogin(req);
    res.status(resStatus).json(resMessage);
  } catch (err) {
    console.log('Admin Login Error: ', err);
    res.status(500).json({ success: false, message: 'Internal Server error.' });
  }
});

router.post('/change-first-password', adminApiLimiter, async (req, res) => {
  try {
    const { resStatus, resMessage } = await changeFirstPassword(req);
    res.status(resStatus).json(resMessage);
  } catch (err) {
    console.log('Change First Password Error: ', err);
    res.status(500).json({ success: false, message: 'Internal Server error.' });
  }
});

// Protected admin routes (authentication required)
router.use(adminApiLimiter); // Apply rate limiting to all protected routes

router.post('/logout', requireAdminAuth, async (req, res) => {
  try {
    const { resStatus, resMessage } = await adminLogout(req);
    res.status(resStatus).json(resMessage);
  } catch (err) {
    console.log('Admin Logout Error: ', err);
    res.status(500).json({ success: false, message: 'Internal Server error.' });
  }
});

// Get current admin info
router.get('/me', requireAdminAuth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      admin: {
        id: req.admin._id,
        email: req.admin.email,
        name: req.admin.name,
        role: req.admin.role,
        permissions: req.admin.permissions,
        lastLogin: req.admin.lastLogin,
        twoFactorEnabled: req.admin.twoFactorEnabled,
      },
    });
  } catch (err) {
    console.log('Get Admin Info Error: ', err);
    res.status(500).json({ success: false, message: 'Internal Server error.' });
  }
});

// Super admin only routes
router.post(
  '/create',
  adminCreationLimiter,
  requireAdminAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      // Add the creating admin's ID to the request
      req.body.createdBy = req.admin._id;
      const { resStatus, resMessage } = await createAdmin(req);
      res.status(resStatus).json(resMessage);
    } catch (err) {
      console.log('Create Admin Error: ', err);
      res.status(500).json({ success: false, message: 'Internal Server error.' });
    }
  }
);

// Analytics routes (require specific permissions)
router.get(
  '/analytics/total-users',
  requireAdminAuth,
  requirePermission('read_analytics'),
  async (req, res) => {
    try {
      const { resStatus, resMessage } = await getTotalUsers(req);
      res.status(resStatus).json(resMessage);
    } catch (err) {
      console.log('Get Total Users Error: ', err);
      res.status(500).json({ success: false, message: 'Internal Server error.' });
    }
  }
);

router.get(
  '/analytics',
  requireAdminAuth,
  requirePermission('read_analytics'),
  async (req, res) => {
    try {
      const { resStatus, resMessage } = await getAnalytics(req);
      res.status(resStatus).json(resMessage);
    } catch (err) {
      console.log('Get Analytics Error: ', err);
      res.status(500).json({ success: false, message: 'Internal Server error.' });
    }
  }
);

// User management routes
router.get('/users', requireAdminAuth, requirePermission('read_users'), async (req, res) => {
  try {
    const { resStatus, resMessage } = await getAllUsers(req);
    res.status(resStatus).json(resMessage);
  } catch (err) {
    console.log('Get All Users Error: ', err);
    res.status(500).json({ success: false, message: 'Internal Server error.' });
  }
});

router.post(
  '/users/:userId/ban',
  requireAdminAuth,
  requirePermission('ban_users'),
  async (req, res) => {
    try {
      const { resStatus, resMessage } = await banUser(req);
      res.status(resStatus).json(resMessage);
    } catch (err) {
      console.log('Ban User Error: ', err);
      res.status(500).json({ success: false, message: 'Internal Server error.' });
    }
  }
);

router.post(
  '/users/:userId/unban',
  requireAdminAuth,
  requirePermission('ban_users'),
  async (req, res) => {
    try {
      const { resStatus, resMessage } = await unbanUser(req);
      res.status(resStatus).json(resMessage);
    } catch (err) {
      console.log('Unban User Error: ', err);
      res.status(500).json({ success: false, message: 'Internal Server error.' });
    }
  }
);

// Admin management routes (Super Admin only)
router.get('/admins', requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { resStatus, resMessage } = await getAllAdmins(req);
    res.status(resStatus).json(resMessage);
  } catch (err) {
    console.log('Get All Admins Error: ', err);
    res.status(500).json({ success: false, message: 'Internal Server error.' });
  }
});

router.put('/admins/:adminId', requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { resStatus, resMessage } = await updateAdmin(req);
    res.status(resStatus).json(resMessage);
  } catch (err) {
    console.log('Update Admin Error: ', err);
    res.status(500).json({ success: false, message: 'Internal Server error.' });
  }
});

router.delete('/admins/:adminId', requireAdminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { resStatus, resMessage } = await deleteAdmin(req);
    res.status(resStatus).json(resMessage);
  } catch (err) {
    console.log('Delete Admin Error: ', err);
    res.status(500).json({ success: false, message: 'Internal Server error.' });
  }
});

export default router;
