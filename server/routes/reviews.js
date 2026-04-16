const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createReview, getPropertyReviews, getUserReviews } = require('../controllers/reviewController');

// Public
router.get('/property/:id', getPropertyReviews);

// Authenticated
router.use(authenticate);
router.post('/', createReview);
router.get('/my-reviews', getUserReviews);

module.exports = router;
