const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUserById, getLeaderboard } = require('../controllers/userController');

router.get('/leaderboard', getLeaderboard);
router.get('/:id',         protect, getUserById);

module.exports = router;
