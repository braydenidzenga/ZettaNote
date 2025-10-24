import express from 'express';
import {
  adminLogin,
  adminLogout,
  banUser,
  changeFirstPassword,
  createAdmin,
  getAllAdmins,
  getAllUsers,
  getAnalytics,
  getTotalUsers,
  unbanUser,
  updateAdmin,
  triggerImageCleanup,
} from '../../controllers/v1/admin.controller.js';
import {
  adminLoginLimiter,
  adminApiLimiter,
  adminCreationLimiter,
  logSuspiciousActivity,
  securityHeaders,
} from '../../utils/security.utils.js';
import { asyncHandler } from '../../middleware/error.middleware.js';
import {
  authenticateAdmin,
  requirePermission,
  requireSuperAdmin,
} from '../../middleware/admin.middleware.js';

const router = express.Router();

// Apply security middleware to all admin routes
router.use(securityHeaders);
router.use(logSuspiciousActivity);
router.use(adminApiLimiter);

/**
 * POST /api/admin/login
 * @description    Admin login
 * @access  Public
 */
router.post(
  '/login',
  adminLoginLimiter,
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await adminLogin(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/admin/change-first-password
 * @description    Change first time admin password
 * @access  Public
 */
router.post(
  '/change-first-password',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await changeFirstPassword(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/admin/logout
 * @description    Admin logout
 * @access  Private (Admin)
 */
router.post(
  '/logout',
  authenticateAdmin,
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await adminLogout(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * GET /api/admin/me
 * @description    Get current admin info
 * @access  Private (Admin)
 */
router.get('/me', authenticateAdmin, (req, res) => {
  if (!req.admin) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

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
});

/**
 * POST /api/admin/create
 * @description    Create new admin
 * @access  Private (Super Admin)
 */
router.post(
  '/create',
  adminCreationLimiter,
  authenticateAdmin,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    req.body.createdBy = req.admin?._id;
    const { resStatus, resMessage } = await createAdmin(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * GET /api/admin/analytics/total-users
 * @description    Get total users count
 * @access  Private (Admin with read_analytics permission)
 */
router.get(
  '/analytics/total-users',
  authenticateAdmin,
  requirePermission('read_analytics'),
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await getTotalUsers(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * GET /api/admin/analytics
 * @description    Get analytics data
 * @access  Private (Admin with read_analytics permission)
 */
router.get(
  '/analytics',
  authenticateAdmin,
  requirePermission('read_analytics'),
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await getAnalytics(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * GET /api/admin/users
 * @description    Get all users
 * @access  Private (Admin with read_users permission)
 */
router.get(
  '/users',
  authenticateAdmin,
  requirePermission('read_users'),
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await getAllUsers(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/admin/users/:userId/ban
 * @description    Ban a user
 * @access  Private (Admin with ban_users permission)
 */
router.post(
  '/users/:userId/ban',
  authenticateAdmin,
  requirePermission('ban_users'),
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await banUser(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/admin/users/:userId/unban
 * @description    Unban a user
 * @access  Private (Admin with ban_users permission)
 */
router.post(
  '/users/:userId/unban',
  authenticateAdmin,
  requirePermission('ban_users'),
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await unbanUser(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * GET /api/admin/admins
 * @description    Get all admins
 * @access  Private (Super Admin)
 */
router.get(
  '/admins',
  authenticateAdmin,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await getAllAdmins(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * PUT /api/admin/admins/:adminId
 * @description    Update admin
 * @access  Private (Super Admin)
 */
router.put(
  '/admins/:adminId',
  authenticateAdmin,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await updateAdmin(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/admin/system/cleanup-images
 * @description    Trigger manual image cleanup
 * @access  Private (Super Admin)
 */
router.post(
  '/system/cleanup-images',
  authenticateAdmin,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await triggerImageCleanup(req);
    res.status(resStatus).json(resMessage);
  })
);

export default router;
