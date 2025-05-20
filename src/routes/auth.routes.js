const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;