const express = require('express');
const router = express.Router();
const { authenticate, requireHost } = require('../middleware/auth');
const ctrl = require('../controllers/occupancyController');

router.get('/host', authenticate, requireHost, ctrl.getHostOccupancy);

module.exports = router;
