const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller.js');
const { authenticateToken, requireAdmin } = require('../middlewares/auth.middleware.js');
const upload = require('../middlewares/upload.middleware.js')('uploads/categories');


router.delete('/:id', authenticateToken, requireAdmin, categoryController.delete);
router.get('/:idOrSlug', categoryController.show);
router.put('/:id', authenticateToken, requireAdmin, upload.single('image_url'), categoryController.update);
router.post('/', authenticateToken, requireAdmin, upload.single('image_url'), categoryController.add);
router.get('/', categoryController.index);

module.exports = router;
