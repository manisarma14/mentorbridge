const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { aiSearch, generateRoadmap, aiChat, getRoadmaps, updateStep } = require('../controllers/aiController');

router.use(protect);
router.post('/search',                      aiSearch);
router.post('/roadmap',                     generateRoadmap);
router.post('/chat',                        aiChat);
router.get('/roadmaps',                     getRoadmaps);
router.put('/roadmaps/:id/steps/:stepId',   updateStep);

module.exports = router;
