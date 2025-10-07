import User from '../../models/User.model.js';

export default async function getAllUsers(req) {
  try {
    const { page = 1, limit = 50, search = '', status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    // Build search filter
    let filter = {};

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
      resStatus: 200,
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
    console.error('Get all users error:', error);
    return {
      resStatus: 500,
      resMessage: {
        success: false,
        message: 'Internal server error.',
      },
    };
  }
}
