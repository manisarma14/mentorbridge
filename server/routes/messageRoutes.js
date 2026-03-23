const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getConversations, getMessages, sendMessage } = require('../controllers/messageController');

router.use(protect);
router.get('/conversations', getConversations);
router.get('/:userId',       getMessages);
router.post('/',             sendMessage);

module.exports = router;
