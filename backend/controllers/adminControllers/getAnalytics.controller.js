import User from '../../models/User.model.js';
import Page from '../../models/Page.model.js';

export default async function getAdminAnalytics(req) {
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
      resStatus: 200,
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
    console.error('Get admin analytics error:', error);
    return {
      resStatus: 500,
      resMessage: {
        success: false,
        message: 'Internal server error.',
      },
    };
  }
}
