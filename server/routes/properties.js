const express = require('express');
const router = express.Router();
const { authenticate, requireHost } = require('../middleware/auth');
const {
  createProperty, getProperties, getPropertyById,
  updateProperty, deleteProperty,
  getPropertyPhotos, addPropertyPhoto, deletePropertyPhoto,
  getFeaturedProperties,
} = require('../controllers/propertyController');

// Public routes
router.get('/featured', getFeaturedProperties);
router.get('/:id', getPropertyById);
router.get('/:id/photos', getPropertyPhotos);

// Host routes
router.use(authenticate);
router.get('/', requireHost, getProperties);
router.post('/', requireHost, createProperty);
router.put('/:id', requireHost, updateProperty);
router.delete('/:id', requireHost, deleteProperty);
router.post('/:id/photos', requireHost, addPropertyPhoto);
router.delete('/:id/photos/:photoId', requireHost, deletePropertyPhoto);

module.exports = router;
