import bcrypt from 'bcryptjs';
import User from '../../models/User.model.js';
import { generateToken, verifyToken } from '../../utils/token.utils.js';
import { validatePassword } from '../../utils/password.utils.js';
import {
  validate,
  signupSchema,
  loginSchema,
  changePasswordSchema,
} from '../../utils/validator.utils.js';
import { STATUS_CODES } from '../../constants/statusCodes.js';
import { MESSAGES } from '../../constants/messages.js';
import logger from '../../utils/logger.js';

/**
 * User Signup Controller
 * Creates a new user account
 * @param {object} req - Express request object
 * @returns {object} Response status, message, and token if successful
 */
export const signup = async (req) => {
  try {
    if (!req.body) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: 'Invalid request' },
      };
    }

    // Validate input
    const validation = validate(signupSchema, req.body);
    if (!validation.isValid) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: validation.message },
      };
    }

    const { name, email, password } = validation.data;

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: passwordValidation.error },
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, authProvider: 'local' });

    try {
      await newUser.save();
    } catch (err) {
      if (err.code === 11000) {
        return {
          resStatus: STATUS_CODES.CONFLICT,
          resMessage: { message: MESSAGES.AUTH.USER_EXISTS },
        };
      }
      throw err;
    }

    // Generate token
    const token = generateToken(newUser);

    return {
      resStatus: STATUS_CODES.CREATED,
      resMessage: {
        message: MESSAGES.AUTH.SIGNUP_SUCCESS,
        user: { name: newUser.name, email: newUser.email, id: newUser._id },
      },
      token,
    };
  } catch (err) {
    logger.error('Signup error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * User Login Controller
 * Authenticates user and returns token
 * @param {object} req - Express request object
 * @returns {object} Response status, message, and token if successful
 */
export const login = async (req) => {
  try {
    if (!req.body || !req.body.email || !req.body.password) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: 'Email and password are required' },
      };
    }

    // Validate input
    const validation = validate(loginSchema, req.body);
    if (!validation.isValid) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: validation.message },
      };
    }

    const { email, password } = validation.data;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_CREDENTIALS },
      };
    }

    // Check if user is banned
    if (user.banned) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { message: 'Your account has been banned. Please contact support.' },
      };
    }

    // Check if user signed up with OAuth
    if (user.authProvider && user.authProvider !== 'local') {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: {
          message: `This account was created with OAuth. Please sign in using Google or GitHub.`,
          authProvider: user.authProvider,
        },
      };
    }

    // Check if password exists (for OAuth accounts that might not have password)
    if (!user.password) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: {
          message: `This account was created with OAuth. Please sign in using Google or GitHub.`,
        },
      };
    }

    // Verify password
    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_CREDENTIALS },
      };
    }

    // Generate token
    const token = generateToken(user);

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        message: MESSAGES.AUTH.LOGIN_SUCCESS,
        user: { name: user.name, email: user.email, id: user._id },
      },
      token,
    };
  } catch (err) {
    logger.error('Login error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Get User Controller
 * Returns current user information
 * @param {object} req - Express request object
 * @returns {object} Response status and user information if successful
 */
export const getUser = async (req) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        user: {
          name: user.name,
          email: user.email,
          id: user._id,
        },
      },
    };
  } catch (err) {
    logger.error('Get user error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Change Password Controller
 * Updates user password
 * @param {object} req - Express request object
 * @returns {object} Response status and message if successful
 */
export const changePassword = async (req) => {
  try {
    // Validate input
    const validation = validate(changePasswordSchema, req.body);
    if (!validation.isValid) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: validation.message },
      };
    }

    const { email, password, newPassword, confirmNewPassword } = req.body;

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: passwordValidation.error },
      };
    }

    // Check if passwords match
    if (newPassword !== confirmNewPassword) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: 'New passwords do not match' },
      };
    }

    // Find user and verify current password
    const user = await User.findOne({ email });
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_CREDENTIALS },
      };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INCORRECT_PASSWORD },
      };
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user);

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        message: MESSAGES.AUTH.PASSWORD_CHANGED,
      },
      token,
    };
  } catch (err) {
    logger.error('Change password error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Delete User Controller
 * Deletes user account
 * @param {object} req - Express request object
 * @returns {object} Response status and message if successful
 */
export const deleteUser = async (req) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: 'Email and password are required' },
      };
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { message: MESSAGES.AUTH.USER_NOT_FOUND },
      };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password.trim(), user.password);
    if (!passwordMatch) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INCORRECT_PASSWORD },
      };
    }

    // Delete user
    await user.deleteOne();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: { message: MESSAGES.AUTH.ACCOUNT_DELETED },
    };
  } catch (err) {
    logger.error('Delete user error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Get User By ID Controller
 * Returns user information by user ID
 * @param {object} req - Express request object
 * @returns {object} Response status and user information if successful
 */
export const getUserById = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    const requestingUser = await verifyToken(token);
    if (!requestingUser) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    const { userId } = req.body;
    if (!userId) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: 'User ID is required' },
      };
    }

    const user = await User.findById(userId).select('name email createdAt');
    if (!user) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { message: 'User not found' },
      };
    }

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    };
  } catch (err) {
    logger.error('Get user by ID error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

export default {
  signup,
  login,
  getUser,
  changePassword,
  deleteUser,
  getUserById,
};
