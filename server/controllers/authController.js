const bcrypt        = require('bcryptjs');
const User          = require('../models/User');
const OTP           = require('../models/OTP');
const generateToken = require('../utils/generateToken');
const { generateOTP, sendOTPEmail } = require('../services/emailService');

const OTP_TTL_MINUTES = 10;

// ================= HELPER =================
const normalizeEmail = (email) => email.toLowerCase().trim();

// 🔥 Non-blocking OTP creator
const createAndSendOTP = async (email, name, type = 'verify') => {
  try {
    await OTP.deleteMany({ email, type });

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await OTP.create({ email, otp, type, expiresAt });

    // 🚀 Send email in background (non-blocking)
    sendOTPEmail({ to: email, name, otp, type })
      .catch(err => console.error("Email send error:", err));

  } catch (err) {
    console.error("OTP error:", err);
  }
};

// ================= REGISTER =================
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const emailLower = normalizeEmail(email);

    const existing = await User.findOne({ email: emailLower });

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ================= EXISTING USER =================
    if (existing) {

      // If already verified → block
      if (existing.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered. Please log in.',
        });
      }

      // Update unverified user
      existing.name = name;
      existing.password = hashedPassword;
      existing.role = role || existing.role;
      existing.isEmailVerified = false;

      await existing.save();

      createAndSendOTP(emailLower, name, 'verify');

      return res.status(200).json({
        success: true,
        message: 'Account exists but not verified. OTP resent.',
        email: emailLower,
        userId: existing._id,
      });
    }

    // ================= NEW USER =================
    const user = await User.create({
      name,
      email: emailLower,
      password: hashedPassword,
      role: role || 'mentee',
      isEmailVerified: false,
    });

    createAndSendOTP(emailLower, name, 'verify');

    return res.status(201).json({
      success: true,
      message: 'Account created! Check email for OTP.',
      email: emailLower,
      userId: user._id,
    });

  } catch (err) {
    next(err);
  }
};

// ================= LOGIN =================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const emailLower = normalizeEmail(email);

    const user = await User.findOne({ email: emailLower }).select('+password');

    // ❌ User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 🔐 Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ⚠️ Email not verified
    if (!user.isEmailVerified) {
      createAndSendOTP(emailLower, user.name, 'verify');

      return res.status(403).json({
        success: false,
        emailUnverified: true,
        email: emailLower,
        message: 'Please verify your email. OTP sent.',
      });
    }

    // 🔐 Generate token
    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });

  } catch (err) {
    next(err);
  }
};

// ================= VERIFY EMAIL =================
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    const emailLower = normalizeEmail(email);

    const record = await OTP.findOne({
      email: emailLower,
      type: 'verify',
      used: false
    });

    if (!record || !record.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Request again.',
      });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP',
      });
    }

    // ✅ Mark OTP used
    record.used = true;
    await record.save();

    // ✅ Verify user
    const user = await User.findOneAndUpdate(
      { email: emailLower },
      { isEmailVerified: true },
      { new: true }
    );

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Email verified successfully!',
      token,
      user,
    });

  } catch (err) {
    next(err);
  }
};

// ================= EXPORT =================
module.exports = {
  register,
  login,
  verifyEmail,
};