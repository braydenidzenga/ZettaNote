import User from '../../models/User.model.js';

export default async function banUser(req) {
  const { userId } = req.params;
  const { reason = 'Violated terms of service' } = req.body;

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

    // Check if user is already banned
    if (user.banned) {
      return {
        resStatus: 400,
        resMessage: {
          success: false,
          message: 'User is already banned.',
        },
      };
    }

    // Ban the user
    user.banned = true;
    await user.save();

    // Log admin activity
    req.admin.addAuditLog('USER_BANNED', req.ip, req.get('User-Agent'), {
      userId: user._id,
      userEmail: user.email,
      reason,
    });
    await req.admin.save();

    return {
      resStatus: 200,
      resMessage: {
        success: true,
        message: 'User has been banned successfully.',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          banned: user.banned,
        },
      },
    };
  } catch (error) {
    console.error('Ban user error:', error);
    return {
      resStatus: 500,
      resMessage: {
        success: false,
        message: 'Internal server error.',
      },
    };
  }
}
