const express = require('express');
const router = express.Router();
const { authenticate, requireHost } = require('../middleware/auth');
const { listHostPayouts, requestPayout, getHostEarnings } = require('../controllers/payoutController');

router.use(authenticate, requireHost);
router.get('/', listHostPayouts);
router.get('/earnings', getHostEarnings);
router.post('/:id/release', requestPayout);

module.exports = router;
