import AdminAccount from '../../models/AdminAccount.js';
import jwt from 'jsonwebtoken';
import { validatePasswordStrength } from '../../util/passwordGenerator.js';

export default async function changeFirstPassword(req) {
  const { tempToken, newPassword, confirmPassword } = req.body;

  // Input validation
  if (!tempToken || !newPassword || !confirmPassword) {
    return {
      resStatus: 400,
      resMessage: {
        success: false,
        message: 'Temporary token, new password, and confirmation are required.',
      },
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      resStatus: 400,
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
      resStatus: 400,
      resMessage: {
        success: false,
        message: 'Password does not meet requirements.',
        errors: passwordValidation.errors,
      },
    };
  }

  try {
    // Verify temporary token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const adminId = decoded.id;

    // Find admin
    const admin = await AdminAccount.findById(adminId);
    if (!admin) {
      return {
        resStatus: 404,
        resMessage: {
          success: false,
          message: 'Admin not found.',
        },
      };
    }

    // Check if admin still needs to change password
    if (!admin.firstLogin || !admin.mustChangePassword) {
      return {
        resStatus: 400,
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
      resStatus: 200,
      resMessage: {
        success: true,
        message: 'Password changed successfully. Please log in with your new password.',
        redirectToLogin: true,
      },
    };
  } catch (error) {
    console.error('Change first password error:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return {
        resStatus: 401,
        resMessage: {
          success: false,
          message: 'Invalid or expired temporary token.',
        },
      };
    }

    return {
      resStatus: 500,
      resMessage: {
        success: false,
        message: 'Internal server error.',
      },
    };
  }
}
