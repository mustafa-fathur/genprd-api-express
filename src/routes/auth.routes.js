const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Web Authentication Routes
router.get('/web/google', authController.webGoogleLogin);
router.get('/web/google/callback', authController.webGoogleCallback);

// Mobile Authentication Routes  
router.get('/mobile/google', authController.mobileGoogleLogin);
router.get('/mobile/google/callback', authController.mobileGoogleCallback);

// Shared routes
router.post('/refresh', authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;