const express = require('express');
const router = express.Router();
const { authenticate, requireHost } = require('../middleware/auth');
const { createHostReview, getGuestReviews } = require('../controllers/hostReviewController');

router.get('/guest/:guestId', getGuestReviews);
router.post('/', authenticate, requireHost, createHostReview);

module.exports = router;
