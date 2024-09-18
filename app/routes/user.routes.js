const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller.js');
const { authenticateToken, requireAdmin } = require('../middlewares/auth.middleware.js');
const upload = require('../middlewares/upload.middleware.js')('uploads/users');

router.patch('/:id/block', authenticateToken, requireAdmin, userController.block);
router.put('/:id', authenticateToken, upload.single('avatar_url'), userController.update);
router.get('/profile', authenticateToken, userController.profile);
router.get('/:id', userController.show);
router.get('/', authenticateToken, requireAdmin, userController.index);


module.exports = router;