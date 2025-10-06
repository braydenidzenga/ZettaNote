import User from '../../models/User.js';

export default async function unbanUser(req) {
  const { userId } = req.params;

  if (!userId) {
    return {
      resStatus: 400,
      resMessage: {
        success: false,
        message: 'User ID is required.',
      },
    };
  }

  try {
    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return {
        resStatus: 404,
        resMessage: {
          success: false,
          message: 'User not found.',
        },
      };
    }

    // Check if user is not banned
    if (!user.banned) {
      return {
        resStatus: 400,
        resMessage: {
          success: false,
          message: 'User is not banned.',
        },
      };
    }

    // Unban the user
    user.banned = false;
    await user.save();

    // Log admin activity
    req.admin.addAuditLog('USER_UNBANNED', req.ip, req.get('User-Agent'), {
      userId: user._id,
      userEmail: user.email,
    });
    await req.admin.save();

    return {
      resStatus: 200,
      resMessage: {
        success: true,
        message: 'User has been unbanned successfully.',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          banned: user.banned,
        },
      },
    };
  } catch (error) {
    console.error('Unban user error:', error);
    return {
      resStatus: 500,
      resMessage: {
        success: false,
        message: 'Internal server error.',
      },
    };
  }
}
