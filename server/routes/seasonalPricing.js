const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/seasonalPricingController');

// Public: list ranges + price calculation (used in BookingForm)
router.get('/property/:propertyId', ctrl.listForProperty);
router.get('/property/:propertyId/calculate', ctrl.calculatePrice);

// Host actions
router.post('/property/:propertyId', authenticate, ctrl.createSeasonalPrice);
router.delete('/property/:propertyId/:id', authenticate, ctrl.deleteSeasonalPrice);

module.exports = router;
