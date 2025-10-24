import express from 'express';
import {
  signup,
  login,
  getUser,
  changePassword,
  deleteUser,
  getUserById,
} from '../../controllers/v1/auth.controller.js';
import { asyncHandler } from '../../middleware/error.middleware.js';
import { userAuthLimiter } from '../../utils/security.utils.js';

const router = express.Router();

/**
 * POST /api/auth/signup
 * @description Register a new user
 * @access  Public
 */
router.post(
  '/signup',
  userAuthLimiter,
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage, token } = await signup(req);

    if (resStatus === 201 && token) {
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/auth/login
 * @description Authenticate user and get token
 * @access  Public
 */
router.post(
  '/login',
  userAuthLimiter,
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage, token } = await login(req);

    if (resStatus === 200 && token) {
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/auth/logout
 * @description Logout user and clear cookie
 * @access  Private
 */
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * POST /api/auth/changepassword
 * @description Change user password
 * @access  Private
 */
router.post(
  '/changepassword',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage, token } = await changePassword(req);

    if (resStatus === 200 && token) {
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    res.status(resStatus).json(resMessage);
  })
);

/**
 * GET /api/auth/getuser
 * @description Get current user information
 * @access  Private
 */
router.get(
  '/getuser',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await getUser(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * DELETE /api/auth/deleteUser
 * @description Delete user account
 * @access  Private
 */
router.delete(
  '/deleteUser',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await deleteUser(req);

    // Clear cookie on successful deletion
    if (resStatus === 200) {
      res.cookie('token', '', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0),
      });
    }

    res.status(resStatus).json(resMessage);
  })
);

/**
 * POST /api/auth/getuserbyid
 * @description Get user info by user ID
 * @access  Private
 */
router.post(
  '/getuserbyid',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await getUserById(req);
    res.status(resStatus).json(resMessage);
  })
);

export default router;
