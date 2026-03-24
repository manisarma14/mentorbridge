const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const validate = require('../middleware/validate');

const {
  register,
  login,
  verifyEmail,
} = require('../controllers/authController');

// ================= REGISTER =================
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
);

// ================= LOGIN =================
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  login
);

// ================= VERIFY EMAIL =================
router.post(
  '/verify-email',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  verifyEmail
);

module.exports = router;