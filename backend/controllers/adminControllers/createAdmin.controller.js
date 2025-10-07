import AdminAccount from '../../models/AdminAccount.model.js';
import { generateMemorablePassword } from '../../util/passwordGenerator.js';

export default async function createAdmin(req) {
  const { email, name, role = 'admin', permissions, createdBy } = req.body;

  // Input validation
  if (!email || !name) {
    return {
      resStatus: 400,
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
      resStatus: 400,
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
        resStatus: 409,
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
      resStatus: 201,
      resMessage: {
        success: true,
        message: 'Admin account created successfully.',
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
    console.error('Create admin error:', error);
    return {
      resStatus: 500,
      resMessage: {
        success: false,
        message: 'Internal server error.',
      },
    };
  }
}
