const User = require('../models/User');

// @desc  Get notifications
// @route GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    const sorted = user.notifications.sort((a, b) => b.createdAt - a.createdAt);
    res.json({ success: true, notifications: sorted });
  } catch (err) { next(err); }
};

// @desc  Mark notifications as read
// @route PUT /api/notifications/read
const markAllRead = async (req, res, next) => {
  try {
    await User.updateOne(
      { _id: req.user._id },
      { $set: { 'notifications.$[].isRead': true } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

// @desc  Delete a notification
// @route DELETE /api/notifications/:notifId
const deleteNotification = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { notifications: { _id: req.params.notifId } },
    });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markAllRead, deleteNotification };
