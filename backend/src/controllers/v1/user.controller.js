import cloudinary from '../../config/cloudinary.js';
import MESSAGES from '../../constants/messages.js';
import STATUS_CODES from '../../constants/statusCodes.js';
import User from '../../models/User.model.js';
import logger from '../../utils/logger.js';

export const getUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('-password');
    res.status(STATUS_CODES.OK).json({ user }, { message: MESSAGES.AUTH.ACCOUNT_FOUND });
  } catch (err) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.GENERAL.SERVER_ERROR });
    logger.error(err);
  }
};

export const updateUsername = async (req, res) => {
  try {
    const userId = req.userId;
    const { name } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.name = name;
    await user.save();
    res.status(STATUS_CODES.OK).json({ user }, { message: MESSAGES.AUTH.USER_UPDATED });
  } catch (err) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.GENERAL.SERVER_ERROR });
    logger.error(err);
  }
};

export const terminateAccount = async (req, res) => {
  try {
    const userId = req.userId;
    await User.findByIdAndDelete(userId);
    res.status(STATUS_CODES.OK).json({ message: MESSAGES.AUTH.ACCOUNT_TERMINATED });
  } catch (err) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.GENERAL.SERVER_ERROR });
    logger.error(err);
  }
};

export const addAvatar = async (req, res) => {
  try {
    const userId = req.userId;
    const { base64Avatar } = req.body;
    const cloudinaryRes = await cloudinary.uploader.upload(base64Avatar, {
      folder: 'avatars',
      public_id: `avatar_${userId}`,
    });
    const avatarUrl = cloudinaryRes.secure_url;
    const user = await User.findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true }).select(
      '-password'
    );
    res.status(STATUS_CODES.OK).json({ user }, { message: MESSAGES.AUTH.AVATAR_ADDED });
  } catch (err) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.GENERAL.SERVER_ERROR });
    logger.error(err);
  }
};
