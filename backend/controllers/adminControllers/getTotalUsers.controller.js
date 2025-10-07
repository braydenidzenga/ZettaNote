import User from '../../models/User.model.js';

export default async function getTotalUsers(req) {
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
      resStatus: 200,
      resMessage: {
        success: true,
        totalUsers,
        activeUsers,
        bannedUsers,
        newUsersLast30Days,
      },
    };
  } catch (error) {
    console.error('Get total users error:', error);
    return {
      resStatus: 500,
      resMessage: {
        success: false,
        message: 'Internal server error.',
      },
    };
  }
}
