const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  text: {
    type: String,
    required: [true, 'Review text is required'],
    maxlength: 500,
    trim: true,
  },
}, { timestamps: true });

// ── One review per mentee per mentor ──
reviewSchema.index({ mentor: 1, mentee: 1 }, { unique: true });

// ── Recalculate mentor rating after each review ──
reviewSchema.statics.updateMentorRating = async function(mentorId) {
  const User = mongoose.model('User');
  const result = await this.aggregate([
    { $match: { mentor: mentorId } },
    { $group: { _id: '$mentor', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (result.length > 0) {
    await User.findByIdAndUpdate(mentorId, {
      rating:       Math.round(result[0].avgRating * 10) / 10,
      totalReviews: result[0].count,
    });
  }
};

reviewSchema.post('save', function() {
  this.constructor.updateMentorRating(this.mentor);
});

module.exports = mongoose.model('Review', reviewSchema);
