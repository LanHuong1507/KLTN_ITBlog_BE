const express = require('express');
const router = express.Router();
const ortherController = require('../controllers/other.controller.js');
const { authenticateToken } = require('../middlewares/auth.middleware.js');

router.get('/list_articles', ortherController.listArticles);
router.get('/top_trendings', ortherController.topTrending);
router.get('/list_categories', ortherController.listCategories);
router.get('/last_comments', ortherController.lastComments);
router.get('/most_popular', ortherController.mostPopular);
router.get('/top_interacts', ortherController.topInteract);
router.get('/new_users', ortherController.newUsers);
router.get('/top_categories', ortherController.topCategories);
router.get('/articles_username/:username', ortherController.getArticlesByUsername);
router.get('/top_month', ortherController.topMonthView);
router.post('/top_related/:id', ortherController.topRelated);
router.get('/popular_today', ortherController.topPopularToday);
router.get('/articles_following', authenticateToken, ortherController.getArticlesFollowing);
router.get('/articles_categories', ortherController.getArticlesByCategorySlug);
router.get('/statistics', ortherController.statistics);


module.exports = router;
