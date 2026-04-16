const express = require('express');
const router = express.Router();
const {
  getPropertyById,
  getPropertyPhotos,
  getFeaturedProperties,
} = require('../controllers/propertyController');

// Public routes
router.get('/featured', getFeaturedProperties);
router.get('/:id', getPropertyById);
router.get('/:id/photos', getPropertyPhotos);

module.exports = router;
