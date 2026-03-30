const bcrypt        = require('bcryptjs');
const User          = require('../models/User');
const OTP           = require('../models/OTP');
const generateToken = require('../utils/generateToken');
const { generateOTP, sendOTPEmail } = require('../services/emailService');

const OTP_TTL_MINUTES = 10;

// ─────────────────────────────────────
// Helper: normalize email
// ─────────────────────────────────────
const normalizeEmail = (email) => email.toLowerCase().trim();

// ─────────────────────────────────────
// Helper: create OTP record and send email
// Always awaited now so errors surface properly
// ─────────────────────────────────────
const createAndSendOTP = async (email, name, type = 'verify') => {
  // Delete any existing OTPs for this email+type
  await OTP.deleteMany({ email, type });

  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await OTP.create({ email, otp, type, expiresAt });

  // Send email — errors are caught by caller
  await sendOTPEmail({ to: email, name, otp, type });

  console.log(`✅ OTP created and sent to ${email}`);
};

// ─────────────────────────────────────
// @route POST /api/auth/register
// ─────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const emailLower = normalizeEmail(email);
    const existing   = await User.findOne({ email: emailLower });

    // ── Existing user ──
    if (existing) {
      if (existing.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered. Please log in.',
        });
      }

      // Unverified — update and resend OTP
      existing.name     = name;
      existing.password = password; // pre-save hook hashes it
      existing.role     = role || existing.role;
      await existing.save();

      try {
        await createAndSendOTP(emailLower, name, 'verify');
      } catch (emailErr) {
        console.error('OTP send failed:', emailErr.message);
        // Still return success — user exists, they can use resend
      }

      return res.status(200).json({
        success: true,
        resent:  true,
        message: 'Account exists but not verified. A new OTP has been sent to your email.',
        email:   emailLower,
      });
    }

    // ── New user ──
    const user = await User.create({
      name,
      email:           emailLower,
      password,        // pre-save hook in User.js hashes this
      role:            role || 'mentee',
      isEmailVerified: false,
    });

    try {
      await createAndSendOTP(emailLower, name, 'verify');
    } catch (emailErr) {
      console.error('OTP send failed:', emailErr.message);
      // User created successfully — they can use resend
    }

    return res.status(201).json({
      success: true,
      message: 'Account created! Check your email for the OTP.',
      email:   emailLower,
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────
// @route POST /api/auth/login
// ─────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const emailLower = normalizeEmail(email);
    const user       = await User.findOne({ email: emailLower }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // ── Check password first ──
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // ── Check email verified AFTER password ──
    if (!user.isEmailVerified) {
      // Send fresh OTP in background
      createAndSendOTP(emailLower, user.name, 'verify').catch(console.error);

      return res.status(403).json({
        success:         false,
        emailUnverified: true,
        email:           emailLower,
        message:         'Please verify your email. A new OTP has been sent.',
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id:              user._id,
        name:            user.name,
        email:           user.email,
        role:            user.role,
        isEmailVerified: user.isEmailVerified,
        bio:             user.bio,
        skills:          user.skills,
        company:         user.company,
        location:        user.location,
        avatar:          user.avatar,
      },
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────
// @route POST /api/auth/verify-email
// ─────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const emailLower = normalizeEmail(email);

    const record = await OTP.findOne({
  email: emailLower,
  type: 'verify',
  used: false
}).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.',
      });
    }

    if (!record.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // Mark OTP used
    record.used = true;
    await record.save();

    // Mark user verified
    const user = await User.findOneAndUpdate(
      { email: emailLower },
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Email verified successfully!',
      token,
      user: {
        id:              user._id,
        name:            user.name,
        email:           user.email,
        role:            user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────
// @route POST /api/auth/resend-otp
// ─────────────────────────────────────
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const emailLower = normalizeEmail(email);
    const user       = await User.findOne({ email: emailLower });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified. Please log in.' });
    }

    // Rate limit: check if an OTP was sent in the last 55 seconds
    const recent = await OTP.findOne({ email: emailLower, type: 'verify', used: false })
      .sort({ createdAt: -1 });

    if (recent) {
      const secondsAgo = (Date.now() - new Date(recent.createdAt)) / 1000;
      if (secondsAgo < 55) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(55 - secondsAgo)} seconds before requesting another OTP.`,
        });
      }
    }

    await createAndSendOTP(emailLower, user.name, 'verify');

    return res.json({ success: true, message: 'New OTP sent to your email.' });

  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────
// @route GET /api/auth/me
// ─────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────
// @route PUT /api/auth/me
// ─────────────────────────────────────
const updateMe = async (req, res, next) => {
  try {
    const allowed = ['name','bio','location','linkedin','company','experience','domain','skills','goals','avatar'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────
// @route PUT /api/auth/change-password
// ─────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword; // pre-save hook hashes it
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, verifyEmail, resendOTP, getMe, updateMe, changePassword };