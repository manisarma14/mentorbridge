const User          = require('../models/User');
const OTP           = require('../models/OTP');
const generateToken = require('../utils/generateToken');
const { generateOTP, sendOTPEmail } = require('../services/emailService');

const OTP_TTL_MINUTES = 10;

// 🔥 Non-blocking OTP creator (FIXED)
const createAndSendOTP = async (email, name, type = 'verify') => {
  try {
    await OTP.deleteMany({ email, type });

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await OTP.create({ email, otp, type, expiresAt });

    // 🚀 Run email in background (IMPORTANT FIX)
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

    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered. Please log in.',
        });
      }

      existing.name     = name;
      existing.password = password;
      existing.role     = role || existing.role;
      await existing.save();

      createAndSendOTP(email, name, 'verify'); // ✅ non-blocking

      return res.status(200).json({
        success: true,
        message: 'Account exists but not verified. OTP resent.',
        email,
        userId: existing._id,
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'mentee',
      isEmailVerified: false,
    });

    createAndSendOTP(email, name, 'verify'); // ✅ non-blocking

    res.status(201).json({
      success: true,
      message: 'Account created! Check email for OTP.',
      email,
      userId: user._id,
    });

  } catch (err) { next(err); }
};

// ================= LOGIN =================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isEmailVerified) {
      createAndSendOTP(email, user.name, 'verify'); // ✅ non-blocking

      return res.status(403).json({
        success: false,
        emailUnverified: true,
        email,
        message: 'Please verify your email. OTP sent.',
      });
    }

    const token = generateToken(user._id);

    res.json({
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

  } catch (err) { next(err); }
};

// ================= VERIFY EMAIL =================
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({
      email: email.toLowerCase(),
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

    record.used = true;
    await record.save();

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isEmailVerified: true },
      { new: true }
    );

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully!',
      token,
      user,
    });

  } catch (err) { next(err); }
};

// ================= EXPORT =================
module.exports = {
  register,
  login,
  verifyEmail,
};