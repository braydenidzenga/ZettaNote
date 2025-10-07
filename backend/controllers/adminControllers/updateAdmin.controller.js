import AdminAccount from '../../models/AdminAccount.model.js';

export default async function updateAdmin(req) {
  const { adminId } = req.params;
  const { name, email, role, permissions, password } = req.body;

  if (!adminId) {
    return {
      resStatus: 400,
      resMessage: {
        success: false,
        message: 'Admin ID is required.',
      },
    };
  }

  // Input validation
  if (!name || !email || !role) {
    return {
      resStatus: 400,
      resMessage: {
        success: false,
        message: 'Name, email, and role are required.',
      },
    };
  }

  // Validate role
  if (!['super_admin', 'admin', 'moderator'].includes(role)) {
    return {
      resStatus: 400,
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
        resStatus: 404,
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
          resStatus: 403,
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
        resStatus: 409,
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
          resStatus: 400,
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
      resStatus: 200,
      resMessage: {
        success: true,
        message: 'Admin updated successfully.',
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
    console.error('Update admin error:', error);
    return {
      resStatus: 500,
      resMessage: {
        success: false,
        message: 'Internal server error.',
      },
    };
  }
}
