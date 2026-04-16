const express = require('express');
const router = express.Router();
const { authenticate, requireHost } = require('../middleware/auth');
const { setAvailability, getAvailability, getBlockedDates } = require('../controllers/availabilityController');

// Public
router.get('/:propertyId', getAvailability);
router.get('/:propertyId/blocked', getBlockedDates);

// Host only
router.post('/:propertyId', authenticate, requireHost, setAvailability);

module.exports = router;
