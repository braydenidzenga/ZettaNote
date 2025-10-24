/**
 * Admin Controller
 * Handles all admin-related operations
 * Consolidated from 12 separate controller files
 */

import AdminAccount from '../../models/AdminAccount.model.js';
import User from '../../models/User.model.js';
import Page from '../../models/Page.model.js';
import { generateAdminToken, verifyAdminToken } from '../../utils/token.utils.js';
import { generateMemorablePassword, validatePasswordStrength } from '../../utils/password.utils.js';
import { STATUS_CODES } from '../../constants/statusCodes.js';
import { MESSAGES } from '../../constants/messages.js';
import { triggerManualImageCleanup } from '../../jobs/imageCleanupJob.js';
import logger from '../../utils/logger.js';

/**
 * Admin Login
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export async function adminLogin(req) {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'Email and password are required.',
      },
    };
  }

  try {
    // Find admin by email
    const admin = await AdminAccount.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: {
          success: false,
          message: MESSAGES.AUTH.INVALID_CREDENTIALS,
        },
      };
    }

    // Check if admin account is active
    if (!admin.active) {
      admin.addAuditLog('LOGIN_ATTEMPT_INACTIVE_ACCOUNT', req.ip, req.get('User-Agent'), { email });
      await admin.save();

      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: {
          success: false,
          message: 'Account is deactivated.',
        },
      };
    }

    // Check if account is locked
    if (admin.isLocked) {
      admin.addAuditLog('LOGIN_ATTEMPT_LOCKED_ACCOUNT', req.ip, req.get('User-Agent'), {
        email,
        lockUntil: admin.lockUntil,
      });
      await admin.save();

      return {
        resStatus: 423, // Locked
        resMessage: {
          success: false,
          message: 'Account is temporarily locked due to failed login attempts.',
        },
      };
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      admin.addAuditLog('LOGIN_FAILED', req.ip, req.get('User-Agent'), {
        email,
        attempts: admin.loginAttempts,
      });
      await admin.save();

      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: {
          success: false,
          message: MESSAGES.AUTH.INVALID_CREDENTIALS,
        },
      };
    }

    // Check IP whitelist if configured
    if (admin.ipWhitelist && admin.ipWhitelist.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress;
      if (!admin.ipWhitelist.includes(clientIP)) {
        admin.addAuditLog('LOGIN_IP_WHITELIST_VIOLATION', clientIP, req.get('User-Agent'), {
          email,
          attemptedIP: clientIP,
        });
        await admin.save();

        return {
          resStatus: STATUS_CODES.FORBIDDEN,
          resMessage: {
            success: false,
            message: 'Access denied from this IP address.',
          },
        };
      }
    }

    // Check if this is first login and password must be changed
    if (admin.firstLogin && admin.mustChangePassword) {
      // Generate a temporary token for password change only
      const tempToken = generateAdminToken(admin, '15m');

      admin.addAuditLog('FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED', req.ip, req.get('User-Agent'), {
        email,
      });
      await admin.save();

      return {
        resStatus: STATUS_CODES.OK,
        resMessage: {
          success: true,
          message: 'Password change required for first login.',
          requirePasswordChange: true,
          tempToken,
          admin: {
            id: admin._id,
            email: admin.email,
            name: admin.name,
            firstLogin: admin.firstLogin,
          },
        },
      };
    }

    // Generate JWT token
    const token = generateAdminToken(admin);

    // Update last login and log successful login
    admin.lastLogin = new Date();
    admin.addAuditLog('LOGIN_SUCCESS', req.ip, req.get('User-Agent'), { email });
    await admin.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        message: MESSAGES.AUTH.LOGIN_SUCCESS,
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          permissions: admin.permissions,
          lastLogin: admin.lastLogin,
          twoFactorEnabled: admin.twoFactorEnabled,
        },
      },
    };
  } catch (error) {
    logger.error('Admin login error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Admin Logout
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export async function adminLogout(req) {
  try {
    // Log the logout activity
    if (req.admin) {
      req.admin.addAuditLog('LOGOUT', req.ip, req.get('User-Agent'), { email: req.admin.email });
      await req.admin.save();
    }

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        message: 'Logout successful.',
      },
    };
  } catch (error) {
    logger.error('Admin logout error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Change First Password
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export async function changeFirstPassword(req) {
  const { tempToken, newPassword, confirmPassword } = req.body;

  // Input validation
  if (!tempToken || !newPassword || !confirmPassword) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'Temporary token, new password, and confirmation are required.',
      },
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'Passwords do not match.',
      },
    };
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'Password does not meet requirements.',
        errors: passwordValidation.errors,
      },
    };
  }

  try {
    // Verify temporary token
    const decoded = verifyAdminToken(tempToken);
    if (!decoded) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: {
          success: false,
          message: 'Invalid or expired temporary token.',
        },
      };
    }

    const adminId = decoded.id;

    // Find admin
    const admin = await AdminAccount.findById(adminId);
    if (!admin) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: {
          success: false,
          message: 'Admin not found.',
        },
      };
    }

    // Check if admin still needs to change password
    if (!admin.firstLogin || !admin.mustChangePassword) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: {
          success: false,
          message: 'Password change not required.',
        },
      };
    }

    // Update password and first login status
    admin.password = newPassword; // Will be hashed by the pre-save middleware
    admin.firstLogin = false;
    admin.mustChangePassword = false;
    admin.lastPasswordChange = new Date();

    admin.addAuditLog('FIRST_LOGIN_PASSWORD_CHANGED', req.ip, req.get('User-Agent'), {
      email: admin.email,
      changedAt: new Date(),
    });

    await admin.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        message: 'Password changed successfully. Please log in with your new password.',
        redirectToLogin: true,
      },
    };
  } catch (error) {
    logger.error('Change first password error', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: {
          success: false,
          message: 'Invalid or expired temporary token.',
        },
      };
    }

    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Create Admin
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export async function createAdmin(req) {
  const { email, name, role = 'admin', permissions, createdBy } = req.body;

  // Input validation
  if (!email || !name) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'Email and name are required.',
      },
    };
  }

  // Generate a secure default password
  const defaultPassword = generateMemorablePassword();

  // Validate role
  if (!['super_admin', 'admin', 'moderator'].includes(role)) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'Invalid role specified.',
      },
    };
  }

  try {
    // Check if admin already exists
    const existingAdmin = await AdminAccount.findOne({ email: email.toLowerCase() });

    if (existingAdmin) {
      return {
        resStatus: STATUS_CODES.CONFLICT,
        resMessage: {
          success: false,
          message: 'Admin account with this email already exists.',
        },
      };
    }

    // Set default permissions based on role if not provided
    const adminPermissions = permissions || AdminAccount.ROLE_PERMISSIONS[role] || [];

    // Create new admin account
    const newAdmin = new AdminAccount({
      email: email.toLowerCase(),
      password: defaultPassword,
      name,
      role,
      permissions: adminPermissions,
      createdBy: createdBy || null,
      firstLogin: true,
      mustChangePassword: true,
    });

    // Add creation audit log
    newAdmin.addAuditLog('ADMIN_ACCOUNT_CREATED', req.ip, req.get('User-Agent'), {
      email,
      role,
      permissions: adminPermissions,
      createdBy,
    });

    await newAdmin.save();

    return {
      resStatus: STATUS_CODES.CREATED,
      resMessage: {
        success: true,
        message: MESSAGES.ADMIN.CREATE_SUCCESS,
        defaultPassword: defaultPassword,
        admin: {
          id: newAdmin._id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
          permissions: newAdmin.permissions,
          active: newAdmin.active,
          firstLogin: newAdmin.firstLogin,
          mustChangePassword: newAdmin.mustChangePassword,
          createdAt: newAdmin.createdAt,
        },
      },
    };
  } catch (error) {
    logger.error('Create admin error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Delete Admin
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export async function deleteAdmin(req) {
  const { adminId } = req.params;

  if (!adminId) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'Admin ID is required.',
      },
    };
  }

  try {
    // Find the admin to delete
    const adminToDelete = await AdminAccount.findById(adminId);

    if (!adminToDelete) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: {
          success: false,
          message: 'Admin not found.',
        },
      };
    }

    // Prevent self-deletion
    if (adminToDelete._id.toString() === req.admin._id.toString()) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: {
          success: false,
          message: 'Cannot delete your own account.',
        },
      };
    }

    // Prevent deletion of super admin (optional safety measure)
    if (adminToDelete.role === 'super_admin') {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: {
          success: false,
          message: 'Cannot delete super admin accounts.',
        },
      };
    }

    // Log the deletion in the admin's audit log before deletion
    const deletionInfo = {
      deletedBy: req.admin._id,
      deletedByEmail: req.admin.email,
      deletedAdmin: {
        id: adminToDelete._id,
        name: adminToDelete.name,
        email: adminToDelete.email,
        role: adminToDelete.role,
      },
    };

    // Delete the admin
    await AdminAccount.findByIdAndDelete(adminId);

    // Log the action in the deleting admin's audit log
    req.admin.addAuditLog('ADMIN_DELETED', req.ip, req.get('User-Agent'), deletionInfo);
    await req.admin.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        message: MESSAGES.ADMIN.DELETE_SUCCESS,
      },
    };
  } catch (error) {
    logger.error('Delete admin error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Get All Admins
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export async function getAllAdmins(req) {
  try {
    // Get all admin accounts (excluding passwords)
    const admins = await AdminAccount.find()
      .select('-password -auditLog -twoFactorSecret')
      .sort({ createdAt: -1 });

    // Log admin activity
    req.admin.addAuditLog('VIEW_ALL_ADMINS', req.ip, req.get('User-Agent'), {
      totalAdmins: admins.length,
    });
    await req.admin.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        admins,
      },
    };
  } catch (error) {
    logger.error('Get all admins error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Update Admin
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export async function updateAdmin(req) {
  const { adminId } = req.params;
  const { name, email, role, permissions, password } = req.body;

  if (!adminId) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'Admin ID is required.',
      },
    };
  }

  // Input validation
  if (!name || !email || !role) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'Name, email, and role are required.',
      },
    };
  }

  // Validate role
  if (!['super_admin', 'admin', 'moderator'].includes(role)) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'Invalid role specified.',
      },
    };
  }

  try {
    // Find the admin to update
    const adminToUpdate = await AdminAccount.findById(adminId);

    if (!adminToUpdate) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: {
          success: false,
          message: 'Admin not found.',
        },
      };
    }

    // Prevent self-edit for critical changes
    if (adminToUpdate._id.toString() === req.admin._id.toString()) {
      if (role !== adminToUpdate.role) {
        return {
          resStatus: STATUS_CODES.FORBIDDEN,
          resMessage: {
            success: false,
            message: 'Cannot change your own role.',
          },
        };
      }
    }

    // Check if email already exists (excluding current admin)
    const existingAdmin = await AdminAccount.findOne({
      email: email.toLowerCase(),
      _id: { $ne: adminId },
    });

    if (existingAdmin) {
      return {
        resStatus: STATUS_CODES.CONFLICT,
        resMessage: {
          success: false,
          message: 'Email already exists for another admin.',
        },
      };
    }

    // Update admin fields
    adminToUpdate.name = name;
    adminToUpdate.email = email.toLowerCase();
    adminToUpdate.role = role;
    adminToUpdate.permissions = permissions || [];

    // Update password if provided
    if (password) {
      if (password.length < 8) {
        return {
          resStatus: STATUS_CODES.BAD_REQUEST,
          resMessage: {
            success: false,
            message: 'Password must be at least 8 characters long.',
          },
        };
      }
      adminToUpdate.password = password; // Will be hashed by pre-save middleware
    }

    // Add audit log
    adminToUpdate.addAuditLog('ADMIN_UPDATED', req.ip, req.get('User-Agent'), {
      updatedBy: req.admin._id,
      updatedByEmail: req.admin.email,
      changes: {
        name,
        email,
        role,
        passwordChanged: !!password,
      },
    });

    await adminToUpdate.save();

    // Log the action in the updating admin's audit log
    req.admin.addAuditLog('ADMIN_UPDATE_ACTION', req.ip, req.get('User-Agent'), {
      targetAdminId: adminId,
      targetAdminEmail: email,
      changes: { name, email, role, passwordChanged: !!password },
    });
    await req.admin.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        message: MESSAGES.ADMIN.UPDATE_SUCCESS,
        admin: {
          id: adminToUpdate._id,
          name: adminToUpdate.name,
          email: adminToUpdate.email,
          role: adminToUpdate.role,
          permissions: adminToUpdate.permissions,
          active: adminToUpdate.active,
          lastLogin: adminToUpdate.lastLogin,
          createdAt: adminToUpdate.createdAt,
        },
      },
    };
  } catch (error) {
    logger.error('Update admin error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Get All Users
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export async function getAllUsers(req) {
  try {
    const { page = 1, limit = 50, search = '', status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    // Build search filter
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'banned') {
      filter.banned = true;
    } else if (status === 'active') {
      filter.banned = false;
    }

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    // Log admin activity
    req.admin.addAuditLog('VIEW_ALL_USERS', req.ip, req.get('User-Agent'), {
      page,
      limit,
      search,
      status,
      totalResults: users.length,
    });
    await req.admin.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          limit: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    logger.error('Get all users error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Get Total Users
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export async function getTotalUsers(req) {
  try {
    // Get total user count
    const totalUsers = await User.countDocuments();

    // Get additional user statistics
    const bannedUsers = await User.countDocuments({ banned: true });
    const activeUsers = totalUsers - bannedUsers;

    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Log admin activity
    req.admin.addAuditLog('VIEW_TOTAL_USERS', req.ip, req.get('User-Agent'), {
      totalUsers,
      activeUsers,
      bannedUsers,
    });
    await req.admin.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        totalUsers,
        activeUsers,
        bannedUsers,
        newUsersLast30Days,
      },
    };
  } catch (error) {
    logger.error('Get total users error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Ban User
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export async function banUser(req) {
  const { userId } = req.params;
  const { reason = 'Violated terms of service' } = req.body;

  if (!userId) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'User ID is required.',
      },
    };
  }

  try {
    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: {
          success: false,
          message: 'User not found.',
        },
      };
    }

    // Check if user is already banned
    if (user.banned) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: {
          success: false,
          message: 'User is already banned.',
        },
      };
    }

    // Ban the user
    user.banned = true;
    await user.save();

    // Log admin activity
    req.admin.addAuditLog('USER_BANNED', req.ip, req.get('User-Agent'), {
      userId: user._id,
      userEmail: user.email,
      reason,
    });
    await req.admin.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        message: 'User has been banned successfully.',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          banned: user.banned,
        },
      },
    };
  } catch (error) {
    logger.error('Ban user error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Unban User
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export async function unbanUser(req) {
  const { userId } = req.params;

  if (!userId) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'User ID is required.',
      },
    };
  }

  try {
    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: {
          success: false,
          message: 'User not found.',
        },
      };
    }

    // Check if user is not banned
    if (!user.banned) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: {
          success: false,
          message: 'User is not banned.',
        },
      };
    }

    // Unban the user
    user.banned = false;
    await user.save();

    // Log admin activity
    req.admin.addAuditLog('USER_UNBANNED', req.ip, req.get('User-Agent'), {
      userId: user._id,
      userEmail: user.email,
    });
    await req.admin.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        message: 'User has been unbanned successfully.',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          banned: user.banned,
        },
      },
    };
  } catch (error) {
    logger.error('Unban user error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Get Analytics
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export async function getAnalytics(req) {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ banned: true });
    const activeUsers = totalUsers - bannedUsers;

    // Get total pages
    const totalPages = await Page.countDocuments();

    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get pages created in the last 30 days
    const newPagesLast30Days = await Page.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get user registration trends (last 7 days)
    const registrationTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      registrationTrends.push({
        date: startOfDay.toISOString().split('T')[0],
        count,
      });
    }

    // Get page creation trends (last 7 days)
    const pageCreationTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await Page.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      pageCreationTrends.push({
        date: startOfDay.toISOString().split('T')[0],
        count,
      });
    }

    // Log admin activity
    req.admin.addAuditLog('VIEW_ANALYTICS', req.ip, req.get('User-Agent'), {
      section: 'dashboard',
    });
    await req.admin.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        analytics: {
          users: {
            total: totalUsers,
            active: activeUsers,
            banned: bannedUsers,
            newLast30Days: newUsersLast30Days,
            registrationTrends,
          },
          pages: {
            total: totalPages,
            newLast30Days: newPagesLast30Days,
            creationTrends: pageCreationTrends,
          },
          generatedAt: new Date(),
        },
      },
    };
  } catch (error) {
    logger.error('Get admin analytics error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
}

/**
 * Trigger Manual Image Cleanup
 * @param {object} req - Express request object
 * @returns {object} Response status and cleanup results
 */
export async function triggerImageCleanup(req) {
  try {
    // Add audit log for admin action
    if (req.admin) {
      const admin = await AdminAccount.findById(req.admin._id);
      if (admin) {
        admin.addAuditLog('MANUAL_IMAGE_CLEANUP', req.ip, req.get('User-Agent'), {
          triggeredBy: req.admin.email,
          timestamp: new Date(),
        });
        await admin.save();
      }
    }

    logger.info(`Manual image cleanup triggered by admin: ${req.admin?.email || 'unknown'}`);

    // Trigger the cleanup
    const cleanupResult = await triggerManualImageCleanup();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        success: true,
        message: 'Image cleanup completed successfully',
        results: cleanupResult,
      },
    };
  } catch (error) {
    logger.error('Trigger image cleanup error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: 'Failed to trigger image cleanup',
        error: error.message,
      },
    };
  }
}
