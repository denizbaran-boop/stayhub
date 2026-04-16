const express = require('express');
const router = express.Router();
const { authenticate, requireHost } = require('../middleware/auth');
const {
  createPromotion, getHostPromotions, validatePromotion,
  updatePromotion, deletePromotion,
} = require('../controllers/promotionController');

router.use(authenticate);

router.post('/validate', validatePromotion);
router.get('/', requireHost, getHostPromotions);
router.post('/', requireHost, createPromotion);
router.put('/:id', requireHost, updatePromotion);
router.delete('/:id', requireHost, deletePromotion);

module.exports = router;
