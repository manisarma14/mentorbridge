const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMentors, getMentorById, getMatchedMentors, toggleBookmark, addReview } = require('../controllers/mentorController');

router.get('/',         getMentors);
router.get('/matches',  protect, getMatchedMentors);
router.get('/:id',      getMentorById);
router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/reviews',  protect, addReview);

module.exports = router;
