const User       = require('../models/User');
const Review     = require('../models/Review');
const Connection = require('../models/Connection');

// @desc   Get all mentors with filters
// @route  GET /api/mentors
const getMentors = async (req, res, next) => {
  try {
    const { search, domain, skills, sort = 'rating', verified, page = 1, limit = 12 } = req.query;

    const query = { role: 'mentor' };
    if (verified === 'true')  query.isVerified = true;
    if (domain)               query.domain     = domain;
    if (skills)               query.skills     = { $in: skills.split(',') };
    if (search) {
      query.$or = [
        { name:    { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { skills:  { $regex: search, $options: 'i' } },
        { bio:     { $regex: search, $options: 'i' } },
      ];
    }

    const sortMap = { rating: '-rating', sessions: '-totalSessions', newest: '-createdAt' };
    const sortStr = sortMap[sort] || '-rating';

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const mentors = await User.find(query)
      .select('-password -notifications')
      .sort(sortStr)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page:    Number(page),
      pages:   Math.ceil(total / Number(limit)),
      mentors,
    });
  } catch (err) { next(err); }
};

// @desc   Get single mentor
// @route  GET /api/mentors/:id
const getMentorById = async (req, res, next) => {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' })
      .select('-password -notifications');
    if (!mentor) { res.status(404); throw new Error('Mentor not found'); }

    const reviews = await Review.find({ mentor: mentor._id })
      .populate('mentee', 'name avatar')
      .sort('-createdAt')
      .limit(10);

    res.json({ success: true, mentor, reviews });
  } catch (err) { next(err); }
};

// @desc   Get AI-matched mentors for logged-in user
// @route  GET /api/mentors/matches
const getMatchedMentors = async (req, res, next) => {
  try {
    const user = req.user;
    const mentors = await User.find({ role: 'mentor' })
      .select('-password -notifications')
      .limit(20);

    // Score each mentor based on skill overlap + goals
    const scored = mentors.map(m => {
      const skillOverlap = m.skills.filter(s =>
        user.skills.some(us => us.toLowerCase().includes(s.toLowerCase())) ||
        user.goals.some(g  => g.toLowerCase().includes(s.toLowerCase()))
      ).length;
      const maxSkills = Math.max(m.skills.length, 1);
      const matchScore = Math.min(99, Math.round((skillOverlap / maxSkills) * 60 + m.rating * 8));
      return { ...m.toJSON(), matchScore };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, mentors: scored.slice(0, 6) });
  } catch (err) { next(err); }
};

// @desc   Bookmark / unbookmark a mentor
// @route  POST /api/mentors/:id/bookmark
const toggleBookmark = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const mentorId = req.params.id;

    const idx = user.bookmarks.indexOf(mentorId);
    if (idx > -1) {
      user.bookmarks.splice(idx, 1);
    } else {
      user.bookmarks.push(mentorId);
    }
    await user.save();

    res.json({ success: true, bookmarked: idx === -1, bookmarks: user.bookmarks });
  } catch (err) { next(err); }
};

// @desc   Add review for a mentor
// @route  POST /api/mentors/:id/reviews
const addReview = async (req, res, next) => {
  try {
    const { rating, text } = req.body;
    const mentorId = req.params.id;

    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
    if (!mentor) { res.status(404); throw new Error('Mentor not found'); }

    const existing = await Review.findOne({ mentor: mentorId, mentee: req.user._id });
    if (existing) { res.status(400); throw new Error('You already reviewed this mentor'); }

    const review = await Review.create({
      mentor: mentorId,
      mentee: req.user._id,
      rating: Number(rating),
      text,
    });

    await review.populate('mentee', 'name avatar');
    res.status(201).json({ success: true, review });
  } catch (err) { next(err); }
};

module.exports = { getMentors, getMentorById, getMatchedMentors, toggleBookmark, addReview };
