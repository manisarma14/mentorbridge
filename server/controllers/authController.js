const User          = require('../models/User');
const OTP           = require('../models/OTP');
const generateToken = require('../utils/generateToken');
const { generateOTP, sendOTPEmail } = require('../services/emailService');

const OTP_TTL_MINUTES = 10;

const createAndSendOTP = async (email, name, type = 'verify') => {
  await OTP.deleteMany({ email, type });
  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await OTP.create({ email, otp, type, expiresAt });
  await sendOTPEmail({ to: email, name, otp, type });
  return otp;
};

// @desc  Register
// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });

    if (existing) {
      // Already verified — block
      if (existing.isEmailVerified) {
        res.status(400);
        throw new Error('Email already registered. Please log in.');
      }

      // Exists but unverified — update details + resend OTP
      existing.name     = name;
      existing.password = password; // will be rehashed by pre-save hook
      existing.role     = role || existing.role;
      await existing.save();

      await createAndSendOTP(email, name, 'verify');

      return res.status(200).json({
        success: true,
        message: 'Account already exists but email was not verified. A new OTP has been sent.',
        email,
        userId:  existing._id,
        resent:  true,
      });
    }

    // Brand new user
    const user = await User.create({
      name,
      email,
      password,
      role:            role || 'mentee',
      isEmailVerified: false,
    });

    await createAndSendOTP(email, name, 'verify');

    res.status(201).json({
      success: true,
      message: 'Account created! Check your email for a 6-digit verification code.',
      email,
      userId:  user._id,
    });
  } catch (err) { next(err); }
};

// @desc  Verify email with OTP
// @route POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email: email.toLowerCase(), type: 'verify', used: false });

    if (!record || !record.isValid()) {
      res.status(400);
      throw new Error('OTP has expired. Please request a new one.');
    }

    if (record.otp !== otp.trim()) {
      res.status(400);
      throw new Error('Incorrect OTP. Please try again.');
    }

    record.used = true;
    await record.save();

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) { res.status(404); throw new Error('User not found'); }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully!',
      token,
      user: {
        id:              user._id,
        name:            user.name,
        email:           user.email,
        role:            user.role,
        isEmailVerified: true,
      },
    });
  } catch (err) { next(err); }
};

// @desc  Resend OTP
// @route POST /api/auth/resend-otp
const resendOTP = async (req, res, next) => {
  try {
    const { email, type = 'verify' } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) { res.status(404); throw new Error('No account with that email'); }

    if (type === 'verify' && user.isEmailVerified) {
      res.status(400);
      throw new Error('Email is already verified');
    }

    await createAndSendOTP(email, user.name, type);

    res.json({ success: true, message: `New OTP sent to ${email}` });
  } catch (err) { next(err); }
};

// @desc  Login
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      await createAndSendOTP(email, user.name, 'verify');
      return res.status(403).json({
        success:         false,
        emailUnverified: true,
        email,
        message:         'Please verify your email. A new OTP has been sent.',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id:              user._id,
        name:            user.name,
        email:           user.email,
        role:            user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) { next(err); }
};

// @desc  Forgot password
// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    }
    await createAndSendOTP(email, user.name, 'reset');
    res.json({ success: true, message: 'Password reset OTP sent.', email });
  } catch (err) { next(err); }
};

// @desc  Reset password
// @route POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = await OTP.findOne({ email: email.toLowerCase(), type: 'reset', used: false });
    if (!record || !record.isValid()) {
      res.status(400); throw new Error('OTP is invalid or has expired');
    }
    if (record.otp !== otp.trim()) {
      res.status(400); throw new Error('Incorrect OTP');
    }

    record.used = true;
    await record.save();

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) { res.status(404); throw new Error('User not found'); }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) { next(err); }
};

// @desc  Get logged-in user
// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('bookmarks', 'name role company avatar isVerified rating');
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// @desc  Update profile
// @route PUT /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const allowed = ['name','bio','skills','goals','location','linkedin','company','experience','domain','hourlyRate'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// @desc  Change password
// @route PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      res.status(401); throw new Error('Current password is incorrect');
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { next(err); }
};

module.exports = {
  register, verifyEmail, resendOTP,
  login, forgotPassword, resetPassword,
  getMe, updateMe, changePassword,
};