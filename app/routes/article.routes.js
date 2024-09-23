const express = require('express');
const router = express.Router();
const articleController = require('../controllers/article.controller.js');
const { authenticateToken, requireAdmin } = require('../middlewares/auth.middleware.js');
const upload = require('../middlewares/upload.middleware.js')('uploads/articles');


router.delete('/:id', authenticateToken, articleController.delete);
router.get('/:idOrSlug', articleController.show);
router.put('/:id', authenticateToken, upload.single('image_url'), articleController.update);
router.put('/:id/draft', authenticateToken, upload.single('image_url'), articleController.draft);
router.patch('/:id/public', authenticateToken, requireAdmin, articleController.public);
router.post('/uploadImage', upload.single('upload'), articleController.uploadImage);
router.post('/', authenticateToken, upload.single('image_url'), articleController.add);
router.get('/:id/detail', authenticateToken, requireAdmin, articleController.detail);
router.get('/', authenticateToken, articleController.index);
router.get('/list/newsfeed', articleController.list);
module.exports = router;
