const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markAllRead, deleteNotification } = require('../controllers/notificationController');

router.use(protect);
router.get('/',               getNotifications);
router.put('/read',           markAllRead);
router.delete('/:notifId',    deleteNotification);

module.exports = router;
