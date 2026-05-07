const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/wishlistController');

router.use(authenticate);

router.get('/', ctrl.listWishlists);
router.post('/', ctrl.createWishlist);
router.get('/property/:propertyId', ctrl.propertySaveStatus);
router.get('/:id', ctrl.getWishlistDetail);
router.put('/:id', ctrl.renameWishlist);
router.delete('/:id', ctrl.deleteWishlist);
router.post('/:id/items', ctrl.addItem);
router.delete('/:id/items/:itemId', ctrl.removeItem);

module.exports = router;
