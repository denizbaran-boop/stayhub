const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/reviewReplyController');

router.post('/', authenticate, ctrl.upsertReply);
router.delete('/:id', authenticate, ctrl.deleteReply);

module.exports = router;
