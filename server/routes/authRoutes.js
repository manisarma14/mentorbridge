const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();
const { protect } = require('../middleware/authMiddleware');
const validate    = require('../middleware/validate');
const {
  register, verifyEmail, resendOTP,
  login, forgotPassword, resetPassword,
  getMe, updateMe, changePassword,
} = require('../controllers/authController');

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['mentor','mentee']).withMessage('Role must be mentor or mentee'),
  ],
  validate, register
);

router.post('/verify-email',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate, verifyEmail
);

router.post('/resend-otp',
  [ body('email').isEmail().withMessage('Valid email required') ],
  validate, resendOTP
);

router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate, login
);

router.post('/forgot-password',
  [ body('email').isEmail().withMessage('Valid email required') ],
  validate, forgotPassword
);

router.post('/reset-password',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate, resetPassword
);

router.get('/me',              protect, getMe);
router.put('/me',              protect, updateMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
