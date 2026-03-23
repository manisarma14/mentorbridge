const User = require('../models/User');

// @desc  Get user by ID (public profile)
// @route GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -notifications -bookmarks');
    if (!user) { res.status(404); throw new Error('User not found'); }
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// @desc  Get leaderboard (top mentors)
// @route GET /api/users/leaderboard
const getLeaderboard = async (req, res, next) => {
  try {
    const mentors = await User.find({ role: 'mentor' })
      .select('name avatar company domain rating totalSessions totalReviews isVerified')
      .sort('-rating -totalSessions')
      .limit(10);
    res.json({ success: true, mentors });
  } catch (err) { next(err); }
};

module.exports = { getUserById, getLeaderboard };
