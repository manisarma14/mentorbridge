const Connection = require('../models/Connection');
const User       = require('../models/User');

// @desc  Send connection request
// @route POST /api/connections
const sendRequest = async (req, res, next) => {
  try {
    const { mentorId, message } = req.body;

    if (mentorId === req.user._id.toString()) {
      res.status(400); throw new Error('Cannot connect with yourself');
    }

    const mentor = await User.findOne({ _id: mentorId, role: 'mentor' });
    if (!mentor) { res.status(404); throw new Error('Mentor not found'); }

    const existing = await Connection.findOne({ mentee: req.user._id, mentor: mentorId });
    if (existing) { res.status(400); throw new Error('Connection request already sent'); }

    const connection = await Connection.create({
      mentee:  req.user._id,
      mentor:  mentorId,
      message: message || '',
    });

    // Notify the mentor
    await User.findByIdAndUpdate(mentorId, {
      $push: {
        notifications: {
          message: `${req.user.name} sent you a mentorship request`,
          type: 'connection',
        },
      },
    });

    res.status(201).json({ success: true, connection });
  } catch (err) { next(err); }
};

// @desc  Respond to connection request
// @route PUT /api/connections/:id
const respondToRequest = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      res.status(400); throw new Error('Invalid status');
    }

    const connection = await Connection.findOne({ _id: req.params.id, mentor: req.user._id });
    if (!connection) { res.status(404); throw new Error('Request not found'); }

    connection.status      = status;
    connection.respondedAt = new Date();
    await connection.save();

    // Notify the mentee
    const msg = status === 'accepted'
      ? `${req.user.name} accepted your mentorship request!`
      : `${req.user.name} declined your mentorship request`;

    await User.findByIdAndUpdate(connection.mentee, {
      $push: { notifications: { message: msg, type: 'connection' } },
    });

    res.json({ success: true, connection });
  } catch (err) { next(err); }
};

// @desc  Get my connections
// @route GET /api/connections
const getConnections = async (req, res, next) => {
  try {
    const query = req.user.role === 'mentor'
      ? { mentor: req.user._id }
      : { mentee: req.user._id };

    const connections = await Connection.find(query)
      .populate('mentee', 'name avatar email role')
      .populate('mentor', 'name avatar email role company isVerified rating')
      .sort('-updatedAt');

    res.json({ success: true, connections });
  } catch (err) { next(err); }
};

module.exports = { sendRequest, respondToRequest, getConnections };
