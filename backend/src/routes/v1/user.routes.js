import express from 'express';
import {
  addAvatar,
  getUser,
  terminateAccount,
  updateUsername,
} from '../../controllers/v1/user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/getuser', authenticate, getUser);
router.post('/update-username', authenticate, updateUsername);
router.delete('/terminate-account', authenticate, terminateAccount);
router.post('/add-avatar', authenticate, addAvatar);

export default router;
