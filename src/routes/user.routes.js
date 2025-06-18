const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/fcm-token', userController.updateFCMToken);

module.exports = router;
