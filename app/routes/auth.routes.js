const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/refresh-token', authController.refreshToken);
router.post('/user/password-reset', authController.passwordReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;