const express = require('express');
const router = express.Router();
const { authenticate, requireHost } = require('../middleware/auth');
const {
  createBooking, getGuestBookings, getHostBookings,
  getBookingById, updateBookingStatus, cancelBooking,
} = require('../controllers/bookingController');

router.use(authenticate);

router.post('/', createBooking);
router.get('/guest', getGuestBookings);
router.get('/host', requireHost, getHostBookings);
router.get('/:id', getBookingById);
router.patch('/:id/status', updateBookingStatus);
router.patch('/:id/cancel', cancelBooking);

module.exports = router;
