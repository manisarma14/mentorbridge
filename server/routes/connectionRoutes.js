const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { sendRequest, respondToRequest, getConnections } = require('../controllers/connectionController');

router.use(protect);
router.get('/',       getConnections);
router.post('/',      sendRequest);
router.put('/:id',    respondToRequest);

module.exports = router;
