const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { processPayment, getPaymentForBooking } = require('../controllers/paymentController');

router.use(authenticate);
router.post('/', processPayment);
router.get('/booking/:bookingId', getPaymentForBooking);

module.exports = router;
