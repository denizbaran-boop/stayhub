const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  listConversations, getConversation, sendMessage, createInquiry, getUnreadCount,
} = require('../controllers/messageController');

router.use(authenticate);
router.get('/conversations', listConversations);
router.get('/unread-count', getUnreadCount);
router.get('/conversations/:id', getConversation);
router.post('/', sendMessage);
router.post('/inquiry', createInquiry);

module.exports = router;
