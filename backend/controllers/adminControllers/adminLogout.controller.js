export default async function adminLogout(req) {
  try {
    // Log the logout activity
    if (req.admin) {
      req.admin.addAuditLog('LOGOUT', req.ip, req.get('User-Agent'), { email: req.admin.email });
      await req.admin.save();
    }

    return {
      resStatus: 200,
      resMessage: {
        success: true,
        message: 'Logout successful.',
      },
    };
  } catch (error) {
    console.error('Admin logout error:', error);
    return {
      resStatus: 500,
      resMessage: {
        success: false,
        message: 'Internal server error.',
      },
    };
  }
}
