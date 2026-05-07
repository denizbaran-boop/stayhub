const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/sessionController');

router.use(authenticate);

router.get('/', ctrl.listMySessions);
router.delete('/others', ctrl.revokeAllOthers);
router.delete('/:id', ctrl.revokeSession);

module.exports = router;
