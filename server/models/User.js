const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Name is required'], trim: true, maxlength: 80,
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },
  password: {
    type: String, required: [true, 'Password is required'],
    minlength: 6, select: false,
  },
  role: {
    type: String, enum: ['mentee', 'mentor', 'admin'], default: 'mentee',
  },
  avatar:   { type: String, default: '' },
  bio:      { type: String, maxlength: 500, default: '' },
  skills:   [{ type: String, trim: true }],
  goals:    [{ type: String, trim: true }],
  location: { type: String, default: '' },
  linkedin: { type: String, default: '' },

  // Mentor-specific fields
  experience: { type: String, default: '' },
  company:    { type: String, default: '' },
  domain:     { type: String, default: '' },
  hourlyRate: { type: Number, default: 0 },

  // ── Email verification ──
  isEmailVerified: { type: Boolean, default: false },
  isVerified:      { type: Boolean, default: false },

  // ✅ OTP fields — these were MISSING, causing OTP to never be saved
  otp:       { type: String, select: false },  // the 6-digit code
  otpExpiry: { type: Date,   select: false },  // expiry timestamp

  verificationStatus: {
    type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none',
  },
  verifiedAt: { type: Date },

  rating:        { type: Number, default: 0, min: 0, max: 5 },
  totalReviews:  { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },

  notifications: [{
    message:   { type: String },
    type:      { type: String, enum: ['message', 'connection', 'system', 'update'], default: 'system' },
    isRead:    { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],

  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isOnline:  { type: Boolean, default: false },
  lastSeen:  { type: Date, default: Date.now },

}, { timestamps: true });

// ── Hash password before save ──
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare password ──
userSchema.methods.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Remove sensitive fields from JSON output ──
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;       // never expose OTP in API responses
  delete obj.otpExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);