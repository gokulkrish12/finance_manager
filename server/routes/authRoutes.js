import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  setupMfa,
  verifyMfa,
  disableMfa,
} from '../controllers/authController.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  login
);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

router.post('/mfa/setup', protect, setupMfa);
router.post('/mfa/verify', protect, verifyMfa);
router.post('/mfa/disable', protect, disableMfa);

export default router;
