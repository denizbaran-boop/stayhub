const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { listUsers, setUserActive, deleteUser, getRevenueReport } = require('../controllers/adminController');

router.use(authenticate, requireAdmin);
router.get('/users', listUsers);
router.patch('/users/:id/active', setUserActive);
router.delete('/users/:id', deleteUser);
router.get('/revenue', getRevenueReport);

module.exports = router;
