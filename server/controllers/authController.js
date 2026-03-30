const bcrypt        = require('bcryptjs');
const User          = require('../models/User');
const OTP           = require('../models/OTP');
const generateToken = require('../utils/generateToken');
const { generateOTP, sendOTPEmail } = require('../services/emailService');

const OTP_TTL_MINUTES = 10;

// Normalize email
const normalizeEmail = (email) => email.toLowerCase().trim();

// ─────────────────────────────────────
// Create & Send OTP (FIXED)
// ─────────────────────────────────────
const createAndSendOTP = async (email, name, type = 'verify') => {
  // Always delete old OTPs
  await OTP.deleteMany({ email, type });

  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await OTP.create({ email, otp, type, expiresAt });

  await sendOTPEmail({ to: email, name, otp, type });

  console.log(`✅ OTP sent to ${email}: ${otp}`);
};

// ─────────────────────────────────────
// REGISTER
// ─────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const emailLower = normalizeEmail(email);
    const existing = await User.findOne({ email: emailLower });

    if (existing) {
      if (existing.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered. Please login.',
        });
      }

      existing.name = name;
      existing.password = password;
      existing.role = role || existing.role;
      await existing.save();

      await createAndSendOTP(emailLower, name);

      return res.json({
        success: true,
        message: 'Account exists but not verified. OTP sent again.',
        email: emailLower,
      });
    }

    const user = await User.create({
      name,
      email: emailLower,
      password,
      role: role || 'mentee',
      isEmailVerified: false,
    });

    await createAndSendOTP(emailLower, name);

    res.status(201).json({
      success: true,
      message: 'Registered successfully. OTP sent.',
      email: emailLower,
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    next(err);
  }
};

// ─────────────────────────────────────
// LOGIN
// ─────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const emailLower = normalizeEmail(email);
    const user = await User.findOne({ email: emailLower }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isEmailVerified) {
      await createAndSendOTP(emailLower, user.name);

      return res.status(403).json({
        success: false,
        emailUnverified: true,
        email: emailLower,
        message: 'Email not verified. OTP sent again.',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    next(err);
  }
};

// ─────────────────────────────────────
// VERIFY EMAIL (FULLY FIXED)
// ─────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    console.log("VERIFY REQUEST:", req.body);

    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP required',
      });
    }

    const emailLower = normalizeEmail(email);

    // Always fetch latest OTP
    const record = await OTP.findOne({
      email: emailLower,
      type: 'verify',
      used: false,
    }).sort({ createdAt: -1 });

    console.log("DB OTP:", record);

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found',
      });
    }

    // Manual validation (avoid schema method bugs)
    if (record.used || record.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired',
      });
    }

    const incomingOtp = String(otp).trim();

    if (record.otp !== incomingOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Mark used
    record.used = true;
    await record.save();

    // Verify user
    const user = await User.findOneAndUpdate(
      { email: emailLower },
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user,
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

// ─────────────────────────────────────
// RESEND OTP
// ─────────────────────────────────────
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const emailLower = normalizeEmail(email);
    const user = await User.findOne({ email: emailLower });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Already verified' });
    }

    await createAndSendOTP(emailLower, user.name);

    res.json({ success: true, message: 'OTP resent successfully' });

  } catch (err) {
    console.error("RESEND OTP ERROR:", err);
    next(err);
  }
};

// ─────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────
module.exports = {
  register,
  login,
  verifyEmail,
  resendOTP,
};