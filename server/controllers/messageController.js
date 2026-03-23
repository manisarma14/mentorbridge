const Message = require('../models/Message');
const User    = require('../models/User');

// @desc   Get all conversations for logged-in user
// @route  GET /api/messages/conversations
const getConversations = async (req, res, next) => {
  try {
    // Find latest message per conversation involving this user
    const conversations = await Message.aggregate([
      { $match: {
          $or: [
            { sender:   req.user._id },
            { receiver: req.user._id },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id:        '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                    { $eq: ['$receiver', req.user._id] },
                    { $eq: ['$isRead', false] },
                ]},
                1, 0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    // Populate the other participant
    const populated = await Promise.all(conversations.map(async conv => {
      const msg = conv.lastMessage;
      const otherId = msg.sender.toString() === req.user._id.toString()
        ? msg.receiver
        : msg.sender;
      const other = await User.findById(otherId).select('name avatar isOnline lastSeen role');
      return { ...conv, participant: other };
    }));

    res.json({ success: true, conversations: populated });
  } catch (err) { next(err); }
};

// @desc   Get messages for a conversation
// @route  GET /api/messages/:userId
const getMessages = async (req, res, next) => {
  try {
    const conversationId = Message.getConversationId(req.user._id.toString(), req.params.userId);

    const messages = await Message.find({ conversationId })
      .populate('sender', 'name avatar')
      .sort('createdAt')
      .limit(100);

    // Mark unread messages as read
    await Message.updateMany(
      { conversationId, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, messages });
  } catch (err) { next(err); }
};

// @desc   Send a message (REST fallback — primary path is Socket.io)
// @route  POST /api/messages
const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;

    const receiver = await User.findById(receiverId);
    if (!receiver) { res.status(404); throw new Error('Recipient not found'); }

    const conversationId = Message.getConversationId(req.user._id.toString(), receiverId);

    const message = await Message.create({
      conversationId,
      sender:   req.user._id,
      receiver: receiverId,
      content,
    });

    await message.populate('sender', 'name avatar');
    res.status(201).json({ success: true, message });
  } catch (err) { next(err); }
};

module.exports = { getConversations, getMessages, sendMessage };
