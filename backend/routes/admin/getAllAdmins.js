import AdminAccount from '../../models/AdminAccount.js';

export default async function getAllAdmins(req) {
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
      resStatus: 200,
      resMessage: {
        success: true,
        admins,
      },
    };
  } catch (error) {
    console.error('Get all admins error:', error);
    return {
      resStatus: 500,
      resMessage: {
        success: false,
        message: 'Internal server error.',
      },
    };
  }
}
