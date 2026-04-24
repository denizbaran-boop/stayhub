const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  register, login, getProfile, updateProfile, changePassword,
  verifyTwoFactor, toggleTwoFactor, requestPasswordReset, resetPassword,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-2fa', verifyTwoFactor);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.put('/toggle-2fa', authenticate, toggleTwoFactor);

module.exports = router;
