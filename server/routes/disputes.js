const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/disputeController');

router.use(authenticate);

router.post('/', ctrl.createDispute);
router.get('/mine', ctrl.listMyDisputes);
router.get('/admin', requireAdmin, ctrl.listAllDisputes);
router.patch('/admin/:id', requireAdmin, ctrl.updateDispute);

module.exports = router;
