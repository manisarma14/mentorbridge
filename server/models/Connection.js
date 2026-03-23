const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending',
  },
  message: {
    type: String,
    maxlength: 300,
    default: '',
  },
  respondedAt: {
    type: Date,
  },
}, { timestamps: true });

// ── Prevent duplicate connections ──
connectionSchema.index({ mentee: 1, mentor: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);
