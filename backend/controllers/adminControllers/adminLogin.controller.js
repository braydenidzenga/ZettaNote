import AdminAccount from '../../models/AdminAccount.model.js';
import { genAdminToken } from '../../util/adminAuth.js';

export default async function adminLogin(req) {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return {
      resStatus: 400,
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
        resStatus: 401,
        resMessage: {
          success: false,
          message: 'Invalid credentials.',
        },
      };
    }

    // Check if admin account is active
    if (!admin.active) {
      admin.addAuditLog('LOGIN_ATTEMPT_INACTIVE_ACCOUNT', req.ip, req.get('User-Agent'), { email });
      await admin.save();

      return {
        resStatus: 401,
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
        resStatus: 423,
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
        resStatus: 401,
        resMessage: {
          success: false,
          message: 'Invalid credentials.',
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
          resStatus: 403,
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
      const tempToken = genAdminToken(admin, { expiresIn: '15m' });

      admin.addAuditLog('FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED', req.ip, req.get('User-Agent'), {
        email,
      });
      await admin.save();

      return {
        resStatus: 200,
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
    const token = genAdminToken(admin);

    // Update last login and log successful login
    admin.lastLogin = new Date();
    admin.addAuditLog('LOGIN_SUCCESS', req.ip, req.get('User-Agent'), { email });
    await admin.save();

    return {
      resStatus: 200,
      resMessage: {
        success: true,
        message: 'Login successful.',
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
    console.error('Admin login error:', error);
    return {
      resStatus: 500,
      resMessage: {
        success: false,
        message: 'Internal server error.',
      },
    };
  }
}
