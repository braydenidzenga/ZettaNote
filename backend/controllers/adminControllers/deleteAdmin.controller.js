import AdminAccount from '../../models/AdminAccount.model.js';

export default async function deleteAdmin(req) {
  const { adminId } = req.params;

  if (!adminId) {
    return {
      resStatus: 400,
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
        resStatus: 404,
        resMessage: {
          success: false,
          message: 'Admin not found.',
        },
      };
    }

    // Prevent self-deletion
    if (adminToDelete._id.toString() === req.admin._id.toString()) {
      return {
        resStatus: 403,
        resMessage: {
          success: false,
          message: 'Cannot delete your own account.',
        },
      };
    }

    // Prevent deletion of super admin (optional safety measure)
    if (adminToDelete.role === 'super_admin') {
      return {
        resStatus: 403,
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
      resStatus: 200,
      resMessage: {
        success: true,
        message: 'Admin deleted successfully.',
      },
    };
  } catch (error) {
    console.error('Delete admin error:', error);
    return {
      resStatus: 500,
      resMessage: {
        success: false,
        message: 'Internal server error.',
      },
    };
  }
}
